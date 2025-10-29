<script>
    // @ts-nocheck
    import { onMount } from "svelte";
    import ComparisonChart from "$lib/components/ComparisonChart.svelte";
    import DistributionChart from "$lib/components/DistributionChart.svelte";

    export let data;

    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios || {};

    let provinciaSeleccionada1 = "";
    let cantonSeleccionado1 = "";
    let provinciaSeleccionada2 = "";
    let cantonSeleccionado2 = "";

    let gastoComparacionSeleccionada = "";
    let presentacionSeleccionada = "todas";

    let zonasFiltradasActuales = todasLasZonas;
    let zonasParaComparar = [];
    let mostrarResults = true;

    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado";

    let theme = "light";

    $: todasLasProvincias = [
        ...new Set(todasLasZonas.map((z) => z.provincia)),
    ].sort();

    $: cantonesDisponibles1 = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada1) {
                return z.provincia === provinciaSeleccionada1;
            }
            return true;
        })
        .map((z) => z.distrito);
    $: todosLosCantones1 = [...new Set(cantonesDisponibles1)].sort();

    $: cantonesDisponibles2 = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada2) {
                return z.provincia === provinciaSeleccionada2;
            }
            return true;
        })
        .map((z) => z.distrito);
    $: todosLosCantones2 = [...new Set(cantonesDisponibles2)].sort();

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
    const categorias = opcionesTipoGasto.slice(1);
    categorias.unshift({
        key: "costo_total_estimado",
        label: "Costo Total Estimado",
    });
    const keysDeGasto = [
        "vivienda",
        "alimentacion",
        "transporte",
        "servicios",
        "ocio",
        "salud",
        "educacion",
        "comunicaciones",
        "otros_gastos",
    ];
    const calcularPromedioProvincia = (provincia) => {
        const distritosDeProvincia = todasLasZonas.filter(
            (z) => z.provincia === provincia,
        );
        if (distritosDeProvincia.length === 0) {
            return null;
        }

        const gastosPromedio = {};
        let costoTotalPromedio = 0;
        keysDeGasto.forEach((key) => {
            if (key === "otros_gastos") return;

            const totalGasto = distritosDeProvincia.reduce(
                (sum, zona) => sum + (zona.gastos?.[key] || 0),
                0,
            );
            const promedio = totalGasto / distritosDeProvincia.length;
            gastosPromedio[key] = promedio;
            costoTotalPromedio += promedio;
        });
        return {
            distrito: provincia,
            provincia: provincia,
            costo_total_estimado: costoTotalPromedio,
            gastos: gastosPromedio,
            referencia_ipc_nacional:
                distritosDeProvincia[0]?.referencia_ipc_nacional,
            cba_per_capita_regional:
                distritosDeProvincia[0]?.cba_per_capita_regional,
            region_inec: distritosDeProvincia[0]?.region_inec,
        };
    };

    const buscarZona = (provincia, canton) => {
        if (provincia && canton) {
            return todasLasZonas.find(
                (z) => z.provincia === provincia && z.distrito === canton,
            );
        }
        if (provincia && !canton) {
            return calcularPromedioProvincia(provincia);
        }
        return null;
    };
    const aplicarFiltros = () => {
        zonasParaComparar = [];
        let zona1 = buscarZona(provinciaSeleccionada1, cantonSeleccionado1);
        let zona2 = buscarZona(provinciaSeleccionada2, cantonSeleccionado2);
        if (zona1) {
            const isProvincia1 = zona1.distrito === zona1.provincia;
            const nombre = isProvincia1
                ? zona1.provincia
                : `${zona1.distrito}, ${zona1.provincia}`;
            zonasParaComparar.push({
                ...zona1,
                nombre_comparacion: nombre,
            });
        }
        if (zona2) {
            const isProvincia2 = zona2.distrito === zona2.provincia;
            const nombre = isProvincia2
                ? zona2.provincia
                : `${zona2.distrito}, ${zona2.provincia}`;
            zonasParaComparar.push({
                ...zona2,
                nombre_comparacion: nombre,
            });
        }

        if (zonasParaComparar.length === 2) {
            presentacionSeleccionada = "comparacion";
        } else if (zonasParaComparar.length === 1) {
            presentacionSeleccionada = "todas";
        } else {
            presentacionSeleccionada = "todas";
        }

        let filtroBaseProvincia =
            provinciaSeleccionada1 || provinciaSeleccionada2;
        let filtroBaseCanton = cantonSeleccionado1 || cantonSeleccionado2;

        let filtrosAplicados = todasLasZonas.filter((zona) => {
            if (filtroBaseCanton) {
                return zona.distrito === filtroBaseCanton;
            }

            if (filtroBaseProvincia) {
                return zona.provincia === filtroBaseProvincia;
            }

            return true;
        });
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
        mostrarResults = true;
    };

    $: if (provinciaSeleccionada1 && cantonSeleccionado1) {
    } else if (provinciaSeleccionada1) {
        cantonSeleccionado1 = "";
    }
    $: if (provinciaSeleccionada2 && cantonSeleccionado2) {
    } else if (provinciaSeleccionada2) {
        cantonSeleccionado2 = "";
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

        if (zonaValor > promedioValor * 1.05)
            return '<span class="indicator up-arrow">⬆️</span>';
        if (zonaValor < promedioValor * 0.95)
            return '<span class="indicator down-arrow">⬇️</span>';
        return '<span class="indicator">➖</span>';
    };

    $: zonaParaDistribucion = (zonasParaComparar.length === 1 &&
        zonasParaComparar[0]) || {
        distrito: "Nacional (Promedio)",
        gastos: promediosNacionales?.gastos || {},
        costo_total_estimado: promediosNacionales?.costo_total_estimado,
    };
    $: datosDistribucion = (() => {
        if (zonasParaComparar.length === 2) return [];

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
        return datosBase.sort((a, b) => b.valor - a.valor);
    })();
    const toggleTheme = () => {
        theme = theme === "light" ? "dark" : "light";
    };

    function setBodyClass(node, currentTheme) {
        function update(newTheme) {
            document.body.className = newTheme;
        }
        update(currentTheme);

        return {
            update,
            destroy() {},
        };
    }

    onMount(() => {
        aplicarFiltros();
    });
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

<div class="main-content">
    <div class="header-group">
        <h1 class="main-title">Costo de Vida por Zonas en Costa Rica</h1>
    </div>

    <div class="intro-text">
        <h2 class="intro-title">
            ¡Compara y Descubra el Costo de Vida en Costa Rica por sus Zonas
            Geográficas!
        </h2>
        <p class="intro-paragraph">
            Analiza el costo promedio de Vivienda, Alimentación, Transporte y
            más en sus diferentes provincias y distritos del país.
        </p>
    </div>

    <div class="controls-container comparison-controls">
        <div class="comparison-group zone-a">
            <h4 class="comparison-title">Provincia A</h4>
            <label class="control-label">
                Provincia A:
                <select bind:value={provinciaSeleccionada1}>
                    <option value="">-- SELECCIONE --</option>
                    {#each todasLasProvincias as provincia}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
            </label>

            <label class="control-label">
                Distrito A:
                <select
                    bind:value={cantonSeleccionado1}
                    disabled={!provinciaSeleccionada1}
                >
                    <option value="">-- SELECCIONE --</option>
                    {#each todosLosCantones1 as canton}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </label>
        </div>

        <div class="separator-vs">
            <span class="vs-text">y</span>
        </div>

        <div class="comparison-group zone-b">
            <h4 class="comparison-title">Provincia B</h4>
            <label class="control-label">
                Provincia B:
                <select bind:value={provinciaSeleccionada2}>
                    <option value="">-- SELECCIONE --</option>
                    {#each todasLasProvincias as provincia}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
            </label>

            <label class="control-label">
                Distrito B:
                <select
                    bind:value={cantonSeleccionado2}
                    disabled={!provinciaSeleccionada2}
                >
                    <option value="">-- SELECCIONE --</option>
                    {#each todosLosCantones2 as canton}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </label>
        </div>

        <div class="presentation-options">
            <label class="control-label">
                Tipo de Gasto:
                <select bind:value={gastoComparacionSeleccionada}>
                    {#each opcionesTipoGasto as opcion}
                        <option value={opcion.key}>{opcion.label}</option>
                    {/each}
                </select>
            </label>
        </div>

        <button on:click={aplicarFiltros}>
            Consultar Resultados
            {#if zonasParaComparar.length === 2}
                (Comparar Zonas)
            {:else}
                (Filtrar Tabla)
            {/if}
        </button>
    </div>
    {#if mostrarResults}
        {#if presentacionSeleccionada === "comparacion" && zonasParaComparar.length === 2}
            <div class="chart-container comparison-view">
                <h2>
                    Comparación de Costo Total Estimado:
                    <span class="zone-a-name"
                        >{zonasParaComparar[0].nombre_comparacion}</span
                    >
                    vs
                    <span class="zone-b-name"
                        >{zonasParaComparar[1].nombre_comparacion}</span
                    >
                    <span class="flag">🇨🇷</span>
                </h2>
                <div class="comparison-total-boxes">
                    <div class="comparison-box box-a">
                        <span class="box-label"
                            >{zonasParaComparar[0].nombre_comparacion}</span
                        >
                        <span class="box-value"
                            >₡{safeFormat(
                                zonasParaComparar[0].costo_total_estimado,
                            )}</span
                        >
                    </div>
                    <div class="comparison-box box-b">
                        <span class="box-label"
                            >{zonasParaComparar[1].nombre_comparacion}</span
                        >
                        <span class="box-value"
                            >₡{safeFormat(
                                zonasParaComparar[1].costo_total_estimado,
                            )}</span
                        >
                    </div>
                </div>

                <ComparisonChart
                    data={zonasParaComparar}
                    categoria={gastoComparacionSeleccionada}
                />

                {#if gastoComparacionSeleccionada === "" || gastoComparacionSeleccionada === "costo_total_estimado"}
                    <div class="detailed-comparison-table-container">
                        <h3>Desglose de Gastos por Categoría</h3>

                        <table class="comparison-details-table">
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th
                                        >{zonasParaComparar[0]
                                            .nombre_comparacion}</th
                                    >
                                    <th
                                        >{zonasParaComparar[1]
                                            .nombre_comparacion}</th
                                    >
                                    <th>Diferencia Absoluta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each categorias.filter((c) => c.key !== "costo_total_estimado") as categoria}
                                    {@const valorA =
                                        zonasParaComparar[0].gastos?.[
                                            categoria.key
                                        ] || 0}
                                    {@const valorB =
                                        zonasParaComparar[1].gastos?.[
                                            categoria.key
                                        ] || 0}
                                    {@const diferencia = valorA - valorB}
                                    {@const diferenciaAbsoluta =
                                        Math.abs(diferencia)}

                                    <tr>
                                        <td>{categoria.label}</td>
                                        <td>₡{safeFormat(valorA)}</td>
                                        <td>₡{safeFormat(valorB)}</td>
                                        <td
                                            class:gasto-mas-alto={diferencia >
                                                0}
                                            class:gasto-mas-bajo={diferencia <
                                                0}
                                        >
                                            {#if diferencia !== 0}
                                                {@html diferencia > 0
                                                    ? "⬆️"
                                                    : "⬇️"}
                                                ₡{safeFormat(
                                                    diferenciaAbsoluta,
                                                )}
                                            {:else}
                                                ➖
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="chart-container">
                <h2>
                    Gráfico y Distribución de Gastos (
                    {zonaParaDistribucion.distrito}
                    ) 📊
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
        {/if}

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
                {#if presentacionSeleccionada !== "solo_total"}
                    <span class="col-vivienda">Vivienda</span>
                    <span class="col-alimentacion">Alimentación</span>
                    <span class="col-transporte">Transporte</span>
                    <span class="col-servicios">Servicios</span>
                    <span class="col-otros">Otros Gastos</span>
                {/if}
                {#if presentacionSeleccionada === "gasto_especifico" && gastoComparacionSeleccionada}{/if}
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

                    {#if presentacionSeleccionada !== "solo_total"}
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
    /* DEFINICIÓN DE VARIABLES DE TEMA (MODO CLARO Y OSCURO) */
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
        /* Colores de Comparación */
        --color-zone-a: #007bff; /* Azul */
        --color-zone-b: #ff5722; /* Naranja */
    }

    /* Variables para el Modo Oscuro (Se aplica cuando <body> tiene la clase 'dark') */
    :global(body.dark) {
        --bg-color: #1a1a2e;
        --card-bg-color: #242440;
        --text-color: #e6e6e6;
        --border-color: #3f3f5a;
        --shadow-color: rgba(0, 0, 0, 0.5);
        --header-bg-color: #3f3f5a;
        --hover-row-bg: #3f3f5a;

        --color-primary: #5078ff;
        --color-secondary: #58d68d;
        --color-total: #4dd0e1;
        --color-github: #bbbbbb;

        /* Colores de Comparación */
        --color-zone-a: #5078ff; /* Azul Claro */
        --color-zone-b: #ff9800; /* Naranja Claro */
    }

    /* ---------------------------------------------------------------------- */
    /* ESTILOS GLOBALES Y DE TEMA */
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

    /* Estilos de Texto y Encabezados */
    .intro-text {
        text-align: center;
        max-width: 900px;
        margin: -10px auto 40px;
        padding: 0 15px;
    }
    .intro-title {
        font-size: 1.5em;
        font-weight: 600;
        color: var(--color-secondary);
        margin: 0;
        line-height: 1.3;
    }
    .intro-paragraph {
        font-size: 1em;
        color: var(--text-color);
        opacity: 0.9;
        margin-top: 5px;
        font-weight: 400;
    }

    /* Tema y Botón */
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
        width: 100%;
    }

    /* ---------------------------------------------------------------------- */
    /* NUEVOS ESTILOS PARA LA COMPARACIÓN EN CONTROLES */
    /* ---------------------------------------------------------------------- */
    .controls-container {
        /* Se ajusta el grid para la vista de comparación */
        display: grid;
        grid-template-columns: 2fr 0.2fr 2fr 1.6fr; /* 4 columnas para 2 bloques de 2, separador y presentación */
        gap: 20px;
        margin-bottom: 30px;
        padding: 25px;
        background: var(--card-bg-color);
        border-radius: 12px;
        box-shadow: 0 4px 15px var(--shadow-color);
    }

    .comparison-group {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 0 10px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px;
    }
    .comparison-title {
        font-size: 1.1em;
        font-weight: 700;
        margin: 0 0 10px 0;
        text-align: center;
    }
    .zone-a .comparison-title {
        color: var(--color-zone-a);
    }
    .zone-b .comparison-title {
        color: var(--color-zone-b);
    }

    .separator-vs {
        display: flex;
        align-items: center;
        justify-content: center;
        /* Ocupa el espacio entre los grupos */
        grid-column: 2 / 3;
    }
    .vs-text {
        font-size: 1.5em;
        font-weight: 800;
        color: var(--color-total);
        padding: 5px;
        border-radius: 4px;
    }
    .presentation-options {
        /* Posiciona las opciones de gasto */
        grid-column: 4 / 5;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    /* El botón de consulta ahora ocupa todo el ancho inferior */
    .controls-container button {
        grid-column: 1 / -1;
        padding: 12px;
        background-color: var(--color-secondary);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1em;
        font-weight: 600;
        transition: background-color 0.3s;
        margin-top: 5px;
    }
    .controls-container button:hover {
        background-color: #218838;
    }
    .controls-container select {
        /* Estilos de select se mantienen */
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--card-bg-color);
        color: var(--text-color);
        appearance: none;
        font-size: 0.95em;
    }
    .control-label {
        display: block;
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 5px;
        font-size: 0.9em;
    }

    /* ---------------------------------------------------------------------- */
    /* NUEVOS ESTILOS PARA EL GRÁFICO DE COMPARACIÓN (Total) */
    /* ---------------------------------------------------------------------- */
    .chart-container {
        margin: 25px 0 15px;
        padding: 15px;
        background: var(--card-bg-color);
        border-radius: 12px;
        box-shadow: 0 4px 15px var(--shadow-color);
        text-align: center;
    }
    .comparison-view h2 {
        font-size: 1.6em;
        margin-bottom: 20px;
        font-weight: 700;
    }
    .zone-a-name {
        color: var(--color-zone-a);
    }
    .zone-b-name {
        color: var(--color-zone-b);
    }

    .comparison-total-boxes {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-bottom: 30px;
    }

    .comparison-box {
        flex: 0 0 45%;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 10px var(--shadow-color);
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .box-a {
        background-color: color-mix(
            in srgb,
            var(--color-zone-a) 15%,
            var(--card-bg-color)
        );
        border: 2px solid var(--color-zone-a);
        color: var(--text-color);
    }
    .box-b {
        background-color: color-mix(
            in srgb,
            var(--color-zone-b) 15%,
            var(--card-bg-color)
        );
        border: 2px solid var(--color-zone-b);
        color: var(--text-color);
    }
    .box-label {
        font-size: 1.1em;
        font-weight: 600;
        margin-bottom: 5px;
        opacity: 0.8;
    }
    .box-value {
        font-size: 2.2em;
        font-weight: 800;
        color: var(--color-total);
    }
    .chart-disclaimer {
        margin-top: 15px;
        font-style: italic;
        color: #6c757d;
        font-size: 0.9em;
    }

    /* --- ESTILOS PARA LA TABLA DE DESGLOSE DE GASTOS ESPECÍFICOS (NUEVO) --- */
    .detailed-comparison-table-container {
        margin: 30px auto;
        padding: 20px;
        background-color: var(--card-bg-color); /* Fondo de tarjeta */
        border-radius: 12px;
        box-shadow: 0 4px 10px var(--shadow-color);
    }
    .detailed-comparison-table-container h3 {
        text-align: center;
        color: var(--color-primary);
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 1.4em;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
    }

    .comparison-details-table {
        width: 100%;
        border-collapse: collapse;
    }

    .comparison-details-table th,
    .comparison-details-table td {
        padding: 12px;
        text-align: right;
        border-bottom: 1px solid var(--border-color);
    }
    .comparison-details-table th:first-child,
    .comparison-details-table td:first-child {
        text-align: left;
    }

    .comparison-details-table thead th {
        background-color: var(--header-bg-color);
        color: white;
        font-weight: 700;
    }

    .comparison-details-table tbody tr:nth-child(even) {
        background-color: var(--hover-row-bg);
    }

    /* ---------------------------------------------------------------------- */
    /* ESTILOS DEL GRÁFICO DE DISTRIBUCIÓN (Se mantienen) */
    /* ---------------------------------------------------------------------- */
    .chart-container h2 {
        color: var(--color-primary);
        font-size: 1.5em;
        margin: 0 0 5px 0;
        font-weight: 700;
    }
    .chart-subtitle {
        color: var(--color-secondary);
        font-size: 1.1em;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 20px;
    }
    .chart-area {
        height: 350px;
        width: 100%;
        margin: auto;
    }
    /* El estilo de los gráficos de distribución (si fuera una librería como Chart.js) se manejaría aquí. */

    /* --- FIX: TEMAS OSCUROS PARA LIBRERÍAS DE GRÁFICOS (Chart.js) --- */
    /* Asegura que el texto y las líneas del gráfico sean visibles en modo oscuro */
    :global(body.dark .chartjs-render-monitor) {
        color: var(--text-color);
    }
    :global(body.dark .chartjs-render-monitor *) {
        color: var(--text-color) !important;
    }
    :global(body.dark canvas) {
        background-color: transparent !important;
    }

    /* ---------------------------------------------------------------------- */
    /* ESTILOS DE LA TABLA (LISTA) */
    /* ---------------------------------------------------------------------- */
    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 25px 0 15px;
        padding: 0 10px;
        flex-wrap: wrap;
    }
    .list-header h3 {
        font-size: 1.2em;
        color: var(--text-color);
        font-weight: 600;
        margin: 5px 0;
    }
    .orden-group {
        display: flex;
        gap: 15px;
        align-items: center;
    }
    .orden-group label {
        font-size: 0.9em;
        font-weight: 600;
    }
    .orden-group select {
        padding: 8px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background-color: var(--card-bg-color);
        color: var(--text-color);
    }
    .sort-button {
        padding: 8px 15px;
        background-color: var(--color-total);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9em;
        transition: background-color 0.3s;
    }
    .sort-button:hover {
        background-color: #117a8b;
    }

    .table-list-container {
        background: var(--card-bg-color);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px var(--shadow-color);
    }
    .table-header,
    .table-row-list {
        display: grid;
        grid-template-columns: 1.5fr 1fr 1.5fr repeat(5, 1fr); /* 8 Columnas */
        align-items: center;
        padding: 12px 15px;
        text-align: center;
        font-size: 0.9em;
    }
    .table-header {
        background-color: var(--header-bg-color);
        color: white;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .table-row-list {
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s;
    }
    .table-row-list:last-child {
        border-bottom: none;
    }
    .table-row-list:hover {
        background-color: var(--hover-row-bg);
    }
    .col-zona {
        text-align: left;
        font-weight: 600;
    }
    .col-provincia {
        text-align: left;
    }
    .value {
        font-weight: 500;
    }
    .value-total {
        font-weight: 700;
        color: var(--color-total);
        font-size: 1.1em;
    }

    /* Indicadores de Comparación (Flechas) */
    .indicator {
        margin-left: 5px;
        font-size: 0.8em;
    }
    :global(.up-arrow) {
        color: #dc3545; /* Rojo - Más caro que el promedio */
    }
    :global(.down-arrow) {
        color: var(--color-secondary); /* Verde - Más barato que el promedio */
    }
    /* Reutilizar para la tabla comparativa */
    .gasto-mas-alto {
        color: #dc3545;
        font-weight: bold;
    }
    .gasto-mas-bajo {
        color: var(--color-secondary);
        font-weight: bold;
    }

    /* Referencias */
    .references-table {
        padding: 15px;
        background-color: color-mix(
            in srgb,
            var(--border-color) 40%,
            var(--card-bg-color)
        );
        border-top: 1px solid var(--border-color);
        text-align: left;
        font-size: 0.85em;
        line-height: 1.6;
    }
    .references-table h3 {
        margin-top: 0;
        font-size: 1em;
        font-weight: 600;
        color: var(--color-primary);
    }

    /* Media Queries */
    @media (max-width: 1000px) {
        .table-header,
        .table-row-list {
            grid-template-columns: 1.5fr 1fr 1fr 1fr; /* Colapso de algunas columnas */
        }
        .col-vivienda,
        .col-alimentacion,
        .col-transporte,
        .col-servicios,
        .col-otros {
            display: none;
        }
    }
    @media (max-width: 768px) {
        .controls-container {
            grid-template-columns: 1fr; /* Una columna en móvil */
        }
        .separator-vs {
            display: none; /* Ocultar el separador VS */
        }
        .controls-container button {
            grid-column: auto;
        }
        .comparison-group,
        .presentation-options {
            padding: 10px;
        }

        .main-title {
            font-size: 1.8em;
        }
        .intro-title {
            font-size: 1.3em;
        }

        .comparison-total-boxes {
            flex-direction: column;
            gap: 20px;
        }
        .comparison-box {
            flex: 1;
            width: 100%;
        }
    }
</style>
