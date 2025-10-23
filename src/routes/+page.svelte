<script>
    // @ts-nocheck
    // Importa tu componente de gráfico. Asumo que está en $lib/components/
    import DistributionChart from "$lib/components/DistributionChart.svelte";

    // 1. CARGA DE DATOS (proviene de +page.js)
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

    // Lista de categorías para el selector de ordenamiento
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

    // Al cambiar la provincia, resetea el cantón para evitar inconsistencias
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

    // 5. FUNCIONES DE FORMATO Y COMPARACIÓN
    const getCostoPrincipal = (zona) => {
        let key = "costo_total_estimado";

        if (
            presentacionSeleccionada === "gasto_especifico" &&
            gastoComparacionSeleccionada
        ) {
            key = gastoComparacionSeleccionada;
        } else if (presentacionSeleccionada === "solo_total") {
            key = "costo_total_estimado";
        }

        const label =
            categorias.find((c) => c.key === key)?.label ||
            "Costo Total Estimado";

        const valor =
            key === "costo_total_estimado"
                ? zona.costo_total_estimado
                : zona.gastos?.[key] || 0;

        return {
            label: `${label}:`,
            valor: valor,
            key: key,
        };
    };

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
            return '<span class="up-arrow">⬆️</span>';
        if (zonaValor < promedioValor * 0.95)
            return '<span class="down-arrow">⬇️</span>';
        return "➖";
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
        // Ordenar por valor (mayor a menor) para el gráfico
        return datosBase.sort((a, b) => b.valor - a.valor);
    })();

    // 7. FUNCIÓN DE NAVEGACIÓN (Corregida para manejar historial vacío)
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
</script>

<svelte:head>
    <title>Costo de Vida CR</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="welcome" style="display: {mostrarBienvenida ? 'flex' : 'none'};">
    <div class="welcome-content">
        <h1>
            ¡Compara y Descubra el Costo de Vida en Costa Rica por sus Zonas
            Geográficas!
        </h1>
        <p>
            Analiza el costo promedio de Vivienda, Alimentación, Transporte y
            mas en sus diferentes provincias y distritos del pais.
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
            <h2>Grafico y Distribución de Gastos (Promedio Nacional) 📊</h2>
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
            <h3>Mostrando las 7 provincias del pais y sus Distritos</h3>
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

        <div class="card-container">
            {#each zonasFiltradasActuales as zona}
                <div class="card">
                    <header class="card-header">
                        <h2>
                            Zona {zona.zona}: {zona.distrito}, **{zona.provincia}**
                        </h2>
                    </header>

                    <p class="total-display">
                        <span class="label"
                            >{getCostoPrincipal(zona).label}</span
                        >
                        <span class="value"
                            >₡{safeFormat(getCostoPrincipal(zona).valor)}</span
                        >
                        <span class="indicator">
                            {#if getCostoPrincipal(zona).key !== "costo_total_estimado"}
                                {@html getComparisonIndicator(
                                    zona,
                                    getCostoPrincipal(zona).key,
                                )}
                            {/if}
                        </span>
                    </p>

                    {#if presentacionSeleccionada === "todas"}
                        <h3 class="desglose-title">Desglose de Gastos</h3>
                        <ul class="gastos-list">
                            <li>
                                <span>Vivienda:</span>
                                <span>₡{safeFormat(zona.gastos.vivienda)}</span>
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "vivienda",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Alimentación:</span>
                                <span
                                    >₡{safeFormat(
                                        zona.gastos.alimentacion,
                                    )}</span
                                >
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "alimentacion",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Transporte:</span>
                                <span
                                    >₡{safeFormat(zona.gastos.transporte)}</span
                                >
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "transporte",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Servicios:</span>
                                <span>₡{safeFormat(zona.gastos.servicios)}</span
                                >
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "servicios",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Ocio:</span>
                                <span>₡{safeFormat(zona.gastos.ocio)}</span>
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "ocio",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Salud:</span>
                                <span>₡{safeFormat(zona.gastos.salud)}</span>
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "salud",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Educación:</span>
                                <span>₡{safeFormat(zona.gastos.educacion)}</span
                                >
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "educacion",
                                    )}</span
                                >
                            </li>
                            <li>
                                <span>Comunicaciones:</span>
                                <span
                                    >₡{safeFormat(
                                        zona.gastos.comunicaciones,
                                    )}</span
                                >
                                <span class="indicator"
                                    >{@html getComparisonIndicator(
                                        zona,
                                        "comunicaciones",
                                    )}</span
                                >
                            </li>
                        </ul>
                    {/if}

                    <div class="references">
                        <h3>**Referencias Oficiales (INEC)**</h3>
                        <p>
                            <strong>IPC Nacional:</strong>
                            {zona.referencia_ipc_nacional} (Base 2020)
                        </p>
                        <p>
                            <strong>CBA Regional:</strong>
                            ₡{safeFormat(zona.cba_per_capita_regional)} (Región
                            {zona.region_inec})
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Estilos Globales y Tipografía */
    :global(body) {
        font-family: "Poppins", sans-serif;
        background-color: #f7f9fc; /* Fondo azul muy claro */
        margin: 0;
        padding: 0;
    }

    /* Colores CR: Azul (Fondo/Botones), Verde (Éxito), Rojo (Alerta/Mal) */
    :root {
        --color-primary: #007bff; /* Azul vibrante */
        --color-secondary: #28a745; /* Verde fuerte */
        --color-total: #17a2b8; /* Cyan para Costo Total */
        --color-github: #333; /* Gris oscuro para GitHub */
        --color-background: #f7f9fc;
        --color-text-dark: #343a40;
    }

    /* Estilos de Bienvenida */
    .welcome {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--color-background);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        text-align: center;
    }
    .welcome-content {
        padding: 60px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        background: white;
        max-width: 650px;
    }
    .welcome-content h1 {
        font-size: 2.5em;
        color: var(--color-primary);
        margin-bottom: 20px;
    }

    /* GRUPO DE BOTONES DE BIENVENIDA (NUEVO) */
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
        text-decoration: none; /* Para el <a> de GitHub */
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
    }

    .start-button {
        background-color: var(--color-secondary);
        color: white;
        box-shadow: 0 4px 6px rgba(40, 167, 69, 0.3);
    }
    .start-button:hover {
        background-color: #218838;
        transform: translateY(-2px);
    }

    .github-button {
        background-color: var(--color-github);
        color: white;
        box-shadow: 0 4px 6px rgba(51, 51, 51, 0.3);
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
    /* El SVG toma el color del texto del botón */
    .github-icon svg {
        fill: white;
    }

    /* Contenido Principal */
    .main-content {
        padding: 20px 20px 60px;
        max-width: 1200px;
        margin: auto;
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
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    .control-label {
        display: block;
        font-weight: 600;
        color: var(--color-text-dark);
        margin-bottom: 5px;
        font-size: 0.95em;
    }
    .controls-container select {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #ced4da;
        background-color: #fff;
        appearance: none; /* Oculta el estilo nativo */
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
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        text-align: center;
    }
    .chart-container h2 {
        color: var(--color-text-dark);
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

    /* Listado y Ordenamiento */
    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 30px 0 20px;
        padding: 10px 0;
        border-bottom: 2px solid #e9ecef;
    }
    .list-header h3 {
        margin: 0;
        color: var(--color-text-dark);
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

    /* Estilos de Tarjetas */
    .card-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 30px;
    }
    .card {
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        background: white;
        transition: transform 0.3s ease;
        border-left: 5px solid var(--color-secondary);
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    .card-header h2 {
        color: var(--color-primary);
        margin-top: 0;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 10px;
        font-size: 1.5em;
        font-weight: 700;
    }

    /* Gasto Total Display */
    .total-display {
        font-size: 1.8em;
        font-weight: 700;
        color: var(--color-total);
        margin: 15px 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .total-display .label {
        font-size: 0.7em;
        color: #6c757d;
        font-weight: 600;
    }
    .total-display .value {
        font-size: 1em;
    }

    /* Desglose de Gastos */
    .desglose-title {
        color: var(--color-text-dark);
        font-size: 1.2em;
        font-weight: 600;
        border-bottom: 1px dashed #e9ecef;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    .gastos-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .gastos-list li {
        padding: 10px 0;
        border-bottom: 1px dotted #e9ecef;
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        font-size: 1em;
        font-weight: 500;
    }
    .gastos-list li span:nth-child(2) {
        font-weight: 600;
        text-align: right;
    }
    .gastos-list li .indicator {
        margin-left: 10px;
        width: 15px;
    }

    /* Referencias INEC */
    .references {
        margin-top: 25px;
        border-top: 2px solid #f0f0f0;
        padding-top: 15px;
        font-size: 0.9em;
        color: #6c757d;
    }
    .references h3 {
        color: var(--color-text-dark);
        font-size: 1.1em;
        margin-bottom: 10px;
    }

    /* Indicadores */
    .up-arrow {
        color: #dc3545; /* Rojo de Alerta */
        font-weight: bold;
        font-size: 1.2em;
    }
    .down-arrow {
        color: var(--color-secondary); /* Verde de Ahorro */
        font-weight: bold;
        font-size: 1.2em;
    }

    /* Responsive */
    @media (max-width: 1000px) {
        .controls-container {
            grid-template-columns: repeat(2, 1fr);
        }
        .controls-container button {
            grid-column: 1 / -1;
        }
    }

    @media (max-width: 768px) {
        .controls-container {
            grid-template-columns: 1fr;
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
    }
</style>
