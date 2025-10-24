<script>
    // @ts-nocheck
    // Importa mi componente de gráfico.
    import DistributionChart from "$lib/components/DistributionChart.svelte";

    // 1. CARGA DE DATOS (+page.js)
    export let data;

    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios || {};

    // 2. ESTADOS
    let mostrarBienvenida = true;
    let provinciaSeleccionada = "";
    let cantonSeleccionado = "";
    let gastoComparacionSeleccionada = "";
    let presentacionSeleccionada = "todas"; // 'todas', 'solo_total', 'gasto_especifico'

    let zonasFiltradasActuales = todasLasZonas;
    let mostrarResultados = false;
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado";

    // ✅ CORRECCIÓN MODO CLARO/OSCURO: ESTADO PARA EL TEMA
    let theme = "light";

    // 3. DATOS REACTIVOS DE SELECTORES
    $: todasLasProvincias = [
        ...new Set(todasLasZonas.map((z) => z.provincia)),
    ].sort();

    $: cantonesDisponibles = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada) {
                return z.provincia === provinciaSeleccionada;
            }
            return true;
        })
        .map((z) => z.distrito);

    $: todosLosCantones = [...new Set(cantonesDisponibles)].sort();

    const opcionesTipoGasto = [
        { key: "", label: "-- SELECCIONE GASTO --" },
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
        { key: "salud", label: "Salud" },
        { key: "educacion", label: "Educación" },
        { key: "comunicaciones", label: "Comunicaciones" },
    ];

    // La lista de categorías para el selector de ordenamiento
    const categorias = opcionesTipoGasto.slice(1);
    categorias.unshift({
        key: "costo_total_estimado",
        label: "Costo Total Estimado",
    });

    // 4. LÓGICA DE INTERFAZ Y FILTROS
    const entrarAPagina = () => {
        mostrarBienvenida = false;
        aplicarFiltros();
    };

    const aplicarFiltros = () => {
        let filtrosAplicados = todasLasZonas.filter((zona) => {
            let coincideProvincia = provinciaSeleccionada
                ? zona.provincia === provinciaSeleccionada
                : true;
            let coincideCanton = cantonSeleccionado
                ? zona.distrito === cantonSeleccionado
                : true;
            return coincideProvincia && coincideCanton;
        });

        // Lógica de Ordenamiento
        zonasFiltradasActuales = filtrosAplicados.sort((a, b) => {
            let valA, valB;
            const key =
                criterioOrden === "costo" ? categoriaComparacion : "provincia";

            if (criterioOrden === "costo") {
                valA =
                    key === "costo_total_estimado"
                        ? a.costo_total_estimado
                        : a.gastos[key] || 0;
                valB =
                    key === "costo_total_estimado"
                        ? b.costo_total_estimado
                        : b.gastos[key] || 0;
            } else {
                valA = a.provincia;
                valB = b.provincia;
            }

            if (valA < valB) return direccionOrden === "asc" ? -1 : 1;
            if (valA > valB) return direccionOrden === "asc" ? 1 : -1;
            return 0;
        });

        mostrarResultados = true;
    };

    // Cuando cambia de provincia, Se resetea el cantón para evitar inconsistencias
    $: if (provinciaSeleccionada) {
        cantonSeleccionado = "";
    }

    const cambiarDireccion = (criterio) => {
        if (criterioOrden === criterio) {
            direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
        } else {
            criterioOrden = criterio;
            direccionOrden = "desc";
        }
        aplicarFiltros();
    };

    // 5. LAS FUNCIONES DE FORMATO Y COMPARACIÓN
    const safeFormat = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    const getComparisonIndicator = (zona, key) => {
        const zonaValor =
            key === "costo_total_estimado"
                ? zona.costo_total_estimado
                : zona.gastos?.[key] || 0;
        const promedioValor =
            key === "costo_total_estimado"
                ? promediosNacionales.costo_total_estimado
                : promediosNacionales.gastos?.[key] || 0;

        if (!promedioValor || promedioValor === 0) return "➖";

        // Compara con una ventana del 5%
        if (zonaValor > promedioValor * 1.05)
            return '<span class="indicator up-arrow">⬆️</span>';
        if (zonaValor < promedioValor * 0.95)
            return '<span class="indicator down-arrow">⬇️</span>';
        return '<span class="indicator">➖</span>';
    };

    // 6. LÓGICA DEL GRÁFICO
    $: zonaParaDistribucion =
        zonasFiltradasActuales.length === 1 || cantonSeleccionado
            ? zonasFiltradasActuales[0]
            : {
                  distrito: "Nacional (Promedio)",
                  gastos: promediosNacionales?.gastos || {},
                  costo_total_estimado:
                      promediosNacionales?.costo_total_estimado,
              };

    $: datosDistribucion = (() => {
        let datosBase = [];
        const gastos = zonaParaDistribucion.gastos || {};

        Object.entries(gastos).forEach(([key, value]) => {
            if (value > 0 && key !== "costo_total_estimado") {
                datosBase.push({
                    rubro: categorias.find((c) => c.key === key)?.label || key,
                    valor: value,
                    clave: key,
                });
            }
        });
        // Esto ordena por valor (mayor a menor) para el gráfico
        return datosBase.sort((a, b) => b.valor - a.valor);
    })();

    // 7. LA FUNCIÓN DE NAVEGACIÓN
    const goBack = () => {
        // Si hay un historial previo, usamos la navegación del navegador
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Si no hay historial previo (ej: es la primera carga), volvemos a la pantalla de bienvenida.
            mostrarBienvenida = true;
            mostrarResultados = false;
        }
    };

    // ✅ CORRECCIÓN MODO CLARO/OSCURO: FUNCIÓN PARA ALTERNAR EL TEMA
    const toggleTheme = () => {
        theme = theme === "light" ? "dark" : "light";
    };

    // ✅ CORRECCIÓN MODO CLARO/OSCURO: ACCIÓN PARA APLICAR LA CLASE AL <body>
    function setBodyClass(node, currentTheme) {
        function update(newTheme) {
            document.body.className = newTheme;
        }
        update(currentTheme);

        return {
            update,
            destroy() {
                // Limpieza si es necesaria
            },
        };
    }
</script>

<svelte:head>
    <title>Costo de Vida CR</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<svelte:body use:setBodyClass={theme} />

<div class="theme-toggle-container">
    <button on:click={toggleTheme} class="theme-toggle-button">
        {#if theme === "light"}
            🌞 Modo Claro
        {:else}
            🌙 Modo Oscuro
        {/if}
    </button>
</div>

<div class="welcome" style="display: {mostrarBienvenida ? 'flex' : 'none'};">
    <div class="welcome-content">
        <h1>
            ¡Compara y Descubra el Costo de Vida en Costa Rica por sus Zonas
            Geográficas!
        </h1>
        <p>
            Analiza el costo promedio de Vivienda, Alimentación, Transporte y
            mas en sus diferentes provincias y distritos del país.
        </p>

        <div class="button-group">
            <button on:click={entrarAPagina} class="start-button"
                >Comenzar a Comparar</button
            >
            <a
                href="https://github.com/xxyemaxx"
                target="_blank"
                class="github-button"
            >
                <span class="github-icon">
                    <svg
                        viewBox="0 0 16 16"
                        width="16"
                        height="16"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2.0-.21.15-.46.55-.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z"
                        ></path>
                    </svg>
                </span>
                Contacto
            </a>
        </div>
    </div>
</div>

<div
    class="main-content"
    style="display: {!mostrarBienvenida ? 'block' : 'none'};"
>
    <div class="header-group">
        <button on:click={goBack} class="back-button"> ⬅️ Volver </button>
        <h1 class="main-title">Costo de Vida por Zonas en Costa Rica</h1>
    </div>

    <div class="controls-container">
        <label class="control-label">
            Provincia:
            <select bind:value={provinciaSeleccionada}>
                <option value="">-- SELECCIONE --</option>
                {#each todasLasProvincias as provincia}
                    <option value={provincia}>{provincia}</option>
                {/each}
            </select>
        </label>

        <label class="control-label">
            Distrito:
            <select
                bind:value={cantonSeleccionado}
                disabled={!provinciaSeleccionada}
            >
                <option value="">-- SELECCIONE --</option>
                {#each todosLosCantones as canton}
                    <option value={canton}>{canton}</option>
                {/each}
            </select>
        </label>

        <label class="control-label">
            Tipo de Gasto:
            <select bind:value={gastoComparacionSeleccionada}>
                {#each opcionesTipoGasto as opcion}
                    <option value={opcion.key}>{opcion.label}</option>
                {/each}
            </select>
        </label>

        <label class="control-label">
            Presentación de Resultados:
            <select bind:value={presentacionSeleccionada}>
                <option value="todas">Costo Total + Desglose</option>
                <option value="solo_total">Solo Costo Total</option>
                <option value="gasto_especifico">Solo Gasto Específico</option>
            </select>
        </label>

        <button on:click={aplicarFiltros}>Consultar Resultados</button>
    </div>

    {#if mostrarResultados}
        <div class="chart-container">
            <h2>
                Grafico y Distribución de Gastos ({zonaParaDistribucion.distrito})
                📊
            </h2>
            <p class="chart-subtitle">
                Costo Total Estimado: ₡{safeFormat(
                    zonaParaDistribucion.costo_total_estimado,
                )}
            </p>
            <div class="chart-area">
                {#if datosDistribucion.length > 0}
                    <DistributionChart
                        data={datosDistribucion}
                        total={zonaParaDistribucion.costo_total_estimado}
                    />
                {:else}
                    <p>No hay datos de distribución disponibles.</p>
                {/if}
            </div>
        </div>

        <div class="list-header">
            <h3>
                Mostrando los Distritos Encontrados ({zonasFiltradasActuales.length})
            </h3>
            <div class="orden-group">
                <label>
                    Ordenar por:
                    <select
                        bind:value={categoriaComparacion}
                        on:change={() => cambiarDireccion("costo")}
                    >
                        {#each categorias as categoria}
                            <option value={categoria.key}
                                >{categoria.label}</option
                            >
                        {/each}
                    </select>
                </label>
                <button
                    on:click={() => cambiarDireccion("costo")}
                    class="sort-button"
                >
                    {direccionOrden === "asc"
                        ? "Menor a Mayor ⬇️"
                        : "Mayor a Menor ⬆️"}
                </button>
            </div>
        </div>

        <div class="table-list-container">
            <div class="table-header">
                <span class="col-zona">Distrito</span>
                <span class="col-provincia">Provincia</span>
                <span class="col-total">Costo Total Estimado</span>
                {#if presentacionSeleccionada === "todas"}
                    <span class="col-vivienda">Vivienda</span>
                    <span class="col-alimentacion">Alimentación</span>
                    <span class="col-transporte">Transporte</span>
                    <span class="col-servicios">Servicios</span>
                    <span class="col-otros">Otros Gastos</span>
                {:else if presentacionSeleccionada === "gasto_especifico" && gastoComparacionSeleccionada}
                    <span class="col-especifico"
                        >{categorias.find(
                            (c) => c.key === gastoComparacionSeleccionada,
                        )?.label || "Gasto"}</span
                    >
                {/if}
            </div>

            {#each zonasFiltradasActuales as zona}
                <div class="table-row-list">
                    <span class="col-zona">
                        <strong>{zona.distrito}</strong>
                    </span>

                    <span class="col-provincia">
                        {zona.provincia}
                    </span>

                    <span class="col-total value-total">
                        ₡{safeFormat(zona.costo_total_estimado)}
                        {@html getComparisonIndicator(
                            zona,
                            "costo_total_estimado",
                        )}
                    </span>

                    {#if presentacionSeleccionada === "todas"}
                        <span class="col-vivienda value">
                            ₡{safeFormat(zona.gastos.vivienda)}
                            {@html getComparisonIndicator(zona, "vivienda")}
                        </span>

                        <span class="col-alimentacion value">
                            ₡{safeFormat(zona.gastos.alimentacion)}
                            {@html getComparisonIndicator(zona, "alimentacion")}
                        </span>

                        <span class="col-transporte value">
                            ₡{safeFormat(zona.gastos.transporte)}
                            {@html getComparisonIndicator(zona, "transporte")}
                        </span>

                        <span class="col-servicios value">
                            ₡{safeFormat(zona.gastos.servicios)}
                            {@html getComparisonIndicator(zona, "servicios")}
                        </span>

                        <span class="col-otros value">
                            ₡{safeFormat(
                                zona.gastos.ocio +
                                    zona.gastos.salud +
                                    zona.gastos.educacion +
                                    zona.gastos.comunicaciones,
                            )}
                        </span>
                    {:else if presentacionSeleccionada === "gasto_especifico" && gastoComparacionSeleccionada}
                        <span class="col-especifico value">
                            ₡{safeFormat(
                                zona.gastos[gastoComparacionSeleccionada] || 0,
                            )}
                            {@html getComparisonIndicator(
                                zona,
                                gastoComparacionSeleccionada,
                            )}
                        </span>
                    {/if}
                </div>
            {/each}

            <div class="references-table">
                <h3>**Referencias Oficiales (INEC)**</h3>
                <p>
                    <strong>IPC Nacional:</strong>
                    {zonasFiltradasActuales[0]?.referencia_ipc_nacional ||
                        "N/A"} (Base 2020)
                </p>
                <p>
                    <strong>CBA Regional:</strong>
                    ₡{safeFormat(
                        zonasFiltradasActuales[0]?.cba_per_capita_regional,
                    ) || 0} (Región
                    {zonasFiltradasActuales[0]?.region_inec || "N/A"})
                </p>
            </div>
        </div>
    {/if}
</div>

<style>
    /* ---------------------------------------------------------------------- */
    /* 1. DEFINICIÓN DE VARIABLES DE TEMA (MODO CLARO Y OSCURO) */
    /* ---------------------------------------------------------------------- */
    /* Variables para el Modo Claro (Por Defecto) */
    :root {
        --bg-color: #f7f9fc;
        --card-bg-color: #ffffff;
        --text-color: #343a40;
        --border-color: #e9ecef;
        --shadow-color: rgba(0, 0, 0, 0.05);
        --header-bg-color: #007bff;
        --hover-row-bg: #f0f8ff;

        /* Colores de Marca */
        --color-primary: #007bff;
        --color-secondary: #28a745;
        --color-total: #17a2b8;
        --color-github: #333;
    }

    /* Variables para el Modo Oscuro (Se aplica cuando <body> tiene la clase 'dark') */
    :global(body.dark) {
        --bg-color: #1a1a2e; /* Fondo oscuro */
        --card-bg-color: #242440; /* Fondo de tarjetas más oscuro */
        --text-color: #e6e6e6; /* Texto claro */
        --border-color: #3f3f5a; /* Borde suave */
        --shadow-color: rgba(0, 0, 0, 0.5);
        --header-bg-color: #3f3f5a; /* Header oscuro */
        --hover-row-bg: #3f3f5a; /* Hover oscuro */

        --color-primary: #5078ff; /* Azul más claro para títulos */
        --color-secondary: #58d68d; /* Verde más claro */
        --color-total: #4dd0e1; /* Cyan más claro */
        --color-github: #bbbbbb; /* Gris claro para íconos */
    }

    /* ---------------------------------------------------------------------- */
    /* ESTILOS PARA EL BOTÓN DE TEMA */
    /* ---------------------------------------------------------------------- */
    .theme-toggle-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
    }
    .theme-toggle-button {
        padding: 8px 15px;
        background-color: var(--card-bg-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 50px;
        cursor: pointer;
        font-weight: 600;
        transition:
            background-color 0.3s,
            border-color 0.3s;
        box-shadow: 0 2px 4px var(--shadow-color);
    }
    .theme-toggle-button:hover {
        opacity: 0.8;
    }

    /* ---------------------------------------------------------------------- */
    /* 2. ESTILOS GLOBALES Y DE TEMA */
    /* ---------------------------------------------------------------------- */
    :global(body) {
        font-family: "Poppins", sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        margin: 0;
        padding: 0;
        transition:
            background-color 0.3s,
            color 0.3s;
    }

    /* Contenido Principal */
    .main-content {
        padding: 20px 20px 60px;
        max-width: 1200px;
        margin: auto;
    }

    /* Los estilos de Bienvenida */
    .welcome {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        text-align: center;
    }
    .welcome-content {
        padding: 60px;
        border-radius: 12px;
        box-shadow: 0 10px 25px var(--shadow-color);
        background: var(--card-bg-color);
        max-width: 650px;
    }
    .welcome-content h1 {
        font-size: 2.5em;
        color: var(--color-primary);
        margin-bottom: 20px;
    }

    /* El GRUPO DE BOTONES DE BIENVENIDA */
    .button-group {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 30px;
    }

    .start-button,
    .github-button {
        padding: 15px 30px;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: 600;
        transition:
            background-color 0.3s,
            transform 0.2s,
            box-shadow 0.3s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
    }

    .start-button {
        background-color: var(--color-secondary);
        color: white;
        box-shadow: 0 4px 6px var(--shadow-color);
    }
    .start-button:hover {
        background-color: #218838;
        transform: translateY(-2px);
    }

    .github-button {
        background-color: var(--color-github);
        color: white;
        box-shadow: 0 4px 6px var(--shadow-color);
    }
    /* Ajuste para el texto/ícono de GitHub en modo oscuro */
    :global(body.dark) .github-button {
        color: var(--bg-color);
        background-color: var(--color-github);
    }
    :global(body.dark) .github-icon svg {
        fill: var(--card-bg-color);
    }

    .github-button:hover {
        background-color: #1a1a1a;
        transform: translateY(-2px);
    }

    .github-icon {
        margin-right: 8px;
        display: flex;
        align-items: center;
    }
    .github-icon svg {
        fill: white;
    }

    .header-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        margin-bottom: 30px;
    }
    .main-title {
        text-align: center;
        color: var(--color-primary);
        font-size: 2.5em;
        font-weight: 700;
        margin: 0;
    }
    .back-button {
        position: absolute;
        left: 0;
        top: 10px;
        padding: 8px 15px;
        background-color: #6c757d; /* Gris para neutralidad */
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 600;
        transition:
            background-color 0.3s,
            transform 0.2s;
        box-shadow: 0 2px 4px var(--shadow-color);
    }
    .back-button:hover {
        background-color: #5a6268;
        transform: scale(1.05);
    }

    /* Controles y Filtros */
    .controls-container {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 40px;
        padding: 30px;
        background: var(--card-bg-color);
        border-radius: 12px;
        box-shadow: 0 4px 15px var(--shadow-color);
    }
    .control-label {
        display: block;
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 5px;
        font-size: 0.95em;
    }
    .controls-container select {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--card-bg-color);
        color: var(--text-color);
        appearance: none;
        font-size: 1em;
    }
    .controls-container button:not(.back-button) {
        grid-column: 1 / -1;
        padding: 15px;
        background-color: var(--color-secondary);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: 600;
        transition: background-color 0.3s;
        margin-top: 10px;
    }
    .controls-container button:not(.back-button):hover {
        background-color: #218838;
    }

    /* Gráfico */
    .chart-container {
        margin: 40px 0;
        padding: 30px;
        background: var(--card-bg-color);
        border-radius: 12px;
        box-shadow: 0 4px 15px var(--shadow-color);
        text-align: center;
    }
    .chart-container h2 {
        color: var(--text-color);
        font-size: 1.8em;
        margin-bottom: 5px;
    }
    .chart-subtitle {
        color: var(--color-secondary);
        font-weight: 600;
        margin-bottom: 20px;
    }
    .chart-area {
        max-width: 900px;
        margin: 20px auto 0;
    }

    /* El listado y Ordenamiento */
    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 30px 0 20px;
        padding: 10px 0;
        border-bottom: 2px solid var(--border-color);
    }
    .list-header h3 {
        margin: 0;
        color: var(--text-color);
        font-weight: 600;
    }
    .orden-group {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .sort-button {
        padding: 8px 15px;
        background-color: var(--color-total);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.3s;
    }
    .sort-button:hover {
        background-color: #0e8499;
    }

    /* ---------------------------------------------------------------------- */
    /* 3. ESTILOS DE LISTA/TABLA */
    /* ---------------------------------------------------------------------- */
    .table-list-container {
        margin-top: 5px;
        background: var(--card-bg-color);
        border-radius: 8px;
        box-shadow: 0 4px 15px var(--shadow-color);
        overflow-x: auto;
        font-size: 0.9em;
    }

    /* Definición de Columnas (GRID) para el modo de Desglose Completo (8 columnas) */
    .table-header,
    .table-row-list {
        display: grid;
        /* ✅ CORRECCIÓN ANCHO COLUMNA: Se ajusta de 1.4fr a 1.2fr para el texto "Distrito" */
        grid-template-columns: 1.2fr 1fr 1.2fr 1fr 1fr 1fr 1fr 1fr;
        align-items: center;
        padding: 12px 15px;
        border-bottom: 1px solid var(--border-color);
        min-width: 1050px;
    }

    /* Ajuste de columnas para el modo 'Solo Costo Total' o 'Gasto Específico' */
    .table-header:has(span.col-total:nth-child(3):last-child),
    .table-row-list:has(span.col-total:nth-child(3):last-child) {
        grid-template-columns: 1.5fr 1fr 1.5fr;
        min-width: 500px;
    }
    .table-header:has(span.col-especifico),
    .table-row-list:has(span.col-especifico) {
        grid-template-columns: 1.5fr 1fr 1.2fr 1.5fr;
        min-width: 650px;
    }

    /* Estilos del Encabezado */
    .table-header {
        background-color: var(--header-bg-color);
        color: white;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.85em;
        border-radius: 8px 8px 0 0;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    /* Estilos de las Filas de Datos */
    .table-row-list {
        transition: background-color 0.2s;
    }
    .table-row-list:hover {
        background-color: var(--hover-row-bg);
    }
    .table-row-list:last-child {
        border-bottom: none;
    }

    /* ESTILOS CLAVE PARA LA ALINEACIÓN INTERNA DE CELDAS */
    .table-header span,
    .table-row-list span {
        display: flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 5px;
        flex-shrink: 0;
        flex-grow: 1;
    }

    /* Alineación de Texto/Valores: Las zonas a la izquierda, los números a la derecha */
    .col-zona,
    .col-provincia {
        justify-content: flex-start;
        text-align: left;
    }

    .col-total,
    .col-vivienda,
    .col-alimentacion,
    .col-transporte,
    .col-servicios,
    .col-otros,
    .col-especifico {
        justify-content: flex-end;
        text-align: right;
    }

    /* Estilos de los valores (aplicados a los <span> en las filas) */
    .value {
        font-weight: 600;
        color: var(--text-color);
    }
    .value-total {
        font-weight: 800;
        color: var(--color-total);
        font-size: 1.1em;
    }

    /* Indicadores de comparación */
    .indicator {
        margin-left: 5px;
        font-size: 0.8em;
        width: 15px;
        flex-shrink: 0;
        text-align: center;
    }
    .up-arrow {
        color: #dc3545; /* Rojo de Alerta */
        font-weight: bold;
    }
    .down-arrow {
        color: var(--color-secondary);
        font-weight: bold;
    }

    /* Referencias INEC al final de la tabla */
    .references-table {
        margin-top: 10px;
        border-top: 1px solid var(--border-color);
        padding: 15px;
        font-size: 0.9em;
        color: var(--text-color);
        opacity: 0.8;
        grid-column: 1 / -1;
    }
    .references-table h3 {
        color: var(--text-color);
        font-size: 1em;
        margin-bottom: 8px;
    }

    /* Responsive: Ocultar columnas en pantallas pequeñas */
    @media (max-width: 1200px) {
        .table-header:not(:has(span.col-especifico)),
        .table-row-list:not(:has(span.col-especifico)) {
            grid-template-columns: 1.5fr 1fr 1.2fr 1fr 1fr 1fr;
            min-width: 800px;
        }
        .col-servicios,
        .col-otros {
            display: none;
        }
    }

    @media (max-width: 768px) {
        .table-header:not(:has(span.col-especifico)),
        .table-row-list:not(:has(span.col-especifico)) {
            grid-template-columns: 1.5fr 1.2fr 1fr 1fr;
            min-width: 450px;
        }

        .col-provincia,
        .col-vivienda {
            display: none;
        }

        .list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }
        .main-title {
            font-size: 2em;
        }
        .welcome-content {
            padding: 30px;
        }
        .welcome-content h1 {
            font-size: 2em;
        }
        .back-button {
            position: static;
            margin-bottom: 15px;
            width: 100%;
        }
        .header-group {
            align-items: center;
        }
        .button-group {
            flex-direction: column;
            gap: 15px;
        }
        .start-button,
        .github-button {
            width: 100%;
            justify-content: center;
        }
        .controls-container {
            grid-template-columns: 1fr;
        }
    }
</style>
