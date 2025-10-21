<script>
    // @ts-nocheck

    // Se mantiene la importación de BarChart, pero ya no se usará.
    // Podrías eliminarla si no la usas en otro lugar.
    import BarChart from "$lib/components/BarChart.svelte";
    import DistributionChart from "$lib/components/DistributionChart.svelte";

    export let data;

    // 1. CONTROL DE VISTA
    let mostrarBienvenida = true;
    const entrarAPagina = () => {
        mostrarBienvenida = false;
        aplicarFiltros();
    };

    // 2. DATOS BASE
    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios;

    // 3. ESTADOS DE LOS FILTROS
    let provinciaSeleccionada = "";
    let cantonSeleccionado = "";
    let tipoGastoSeleccionado = "";
    let presentacionSeleccionada = "todas";

    // ** Estado para almacenar y mostrar los resultados después de CONSULTAR **
    let zonasFiltradasActuales = todasLasZonas;
    let mostrarResultados = false;

    // 4. LÓGICA PARA OBTENER OPCIONES ÚNICAS (Reactividad de Selectores)
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
        { key: "", label: "-- SELECCIONE --" },
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
    ];

    // 5. LÓGICA DE FILTRADO Y BOTÓN CONSULTAR
    const aplicarFiltros = () => {
        let filtrosAplicados = todasLasZonas.filter((zona) => {
            let coincideProvincia = true;
            let coincideCanton = true;

            if (provinciaSeleccionada) {
                coincideProvincia = zona.provincia === provinciaSeleccionada;
            }

            if (cantonSeleccionado) {
                coincideCanton = zona.distrito === cantonSeleccionado;
            }

            return coincideProvincia && coincideCanton;
        });

        // Ordenar los resultados (se mantiene la lógica de ordenamiento)
        zonasFiltradasActuales = filtrosAplicados.sort((a, b) => {
            let valA, valB;
            const key =
                criterioOrden === "costo" ? categoriaComparacion : "provincia";

            if (criterioOrden === "costo") {
                valA =
                    key === "costo_total_estimado"
                        ? a.costo_total_estimado
                        : a.gastos[key];
                valB =
                    key === "costo_total_estimado"
                        ? b.costo_total_estimado
                        : b.gastos[key];
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

    $: if (provinciaSeleccionada) {
        cantonSeleccionado = "";
    }

    // 6. LÓGICA DE ORDENAMIENTO (se mantiene)
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado";

    const categorias = [
        { key: "costo_total_estimado", label: "Costo Total Estimado" },
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
    ];

    const cambiarDireccion = (criterio) => {
        if (criterioOrden === criterio) {
            direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
        } else {
            criterioOrden = criterio;
            direccionOrden = "desc";
        }
        aplicarFiltros();
    };

    // 7. FUNCIONES AUXILIARES (se mantienen)

    const getSortIndicator = (criterio) => {
        if (criterioOrden !== criterio) return "";
        return direccionOrden === "asc" ? " ⬆️" : " ⬇️";
    };

    const safeFormat = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR");
    };

    const getComparisonIndicator = (zona, key) => {
        const zonaValor =
            key === "costo_total_estimado"
                ? zona.costo_total_estimado
                : zona.gastos[key];
        const promedioValor =
            key === "costo_total_estimado"
                ? promediosNacionales.costo_total_estimado
                : promediosNacionales.gastos[key];

        if (zonaValor > promedioValor * 1.05)
            return '<span class="up-arrow">⬆️</span>';
        if (zonaValor < promedioValor * 0.95)
            return '<span class="down-arrow">⬇️</span>';
        return "➖";
    };

    // 8. LÓGICA DEL GRÁFICO DE DISTRIBUCIÓN

    $: zonaParaDistribucion =
        zonasFiltradasActuales.length > 0 && cantonSeleccionado
            ? zonasFiltradasActuales[0]
            : {
                  distrito: "Nacional (Promedio)",
                  gastos: promediosNacionales?.gastos,
                  costo_total_estimado:
                      promediosNacionales?.costo_total_estimado,
              };

    $: datosDistribucion = zonaParaDistribucion.gastos
        ? Object.entries(zonaParaDistribucion.gastos).map(([key, value]) => ({
              rubro: categorias.find((c) => c.key === key)?.label || key,
              valor: value,
              clave: key,
          }))
        : [];
</script>

{#if mostrarBienvenida}
    <div class="pantalla-bienvenida">
        <div class="contenido-bienvenida">
            <h1>
                Descubra y compara el Costo de Vida en Costa Rica por Zonas
                Geográficas.
            </h1>

            <p>
                Analiza el costo promedio de Vivienda, Alimentación, Transporte
                y más en diferentes provincias y distritos del país.
            </p>
            <button on:click={entrarAPagina}>Explorar Ahora 🚀</button>
        </div>
        <div class="cargando-data">
            <p>Mi contacto: https://github.com/xxyemaxx</p>
        </div>
    </div>
{:else}
    <h1 class="main-title">Costo de Vida por Zonas en Costa Rica</h1>

    <div class="main-content-container">
        <div class="filter-group">
            <div class="filter-item">
                <label for="provincia-select">Provincia</label>
                <select
                    id="provincia-select"
                    bind:value={provinciaSeleccionada}
                >
                    <option value="">-- SELECCIONE --</option>
                    {#each todasLasProvincias as provincia (provincia)}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
            </div>

            <div class="filter-item">
                <label for="canton-select">Distrito</label>
                <select id="canton-select" bind:value={cantonSeleccionado}>
                    <option value="">-- SELECCIONE --</option>
                    {#each todosLosCantones as canton (canton)}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="filter-group">
            <div class="filter-item">
                <label for="gasto-select">Tipo de Gasto</label>
                <select id="gasto-select" bind:value={tipoGastoSeleccionado}>
                    {#each opcionesTipoGasto as op}
                        <option value={op.key}>{op.label}</option>
                    {/each}
                </select>
            </div>
            <div class="filter-item">
                <label for="presentacion-select"
                    >Presentación de Resultados</label
                >
                <select
                    id="presentacion-select"
                    bind:value={presentacionSeleccionada}
                >
                    <option value="todas">Costo Total + Desglose</option>
                    <option value="total">Solo Costo Total</option>
                </select>
            </div>
        </div>

        <button class="consultar-button" on:click={aplicarFiltros}
            >Consultar Resultados</button
        >

        {#if mostrarResultados}
            <div class="results-section">
                {#if datosDistribucion.length > 0}
                    <div class="chart-container distribution-chart">
                        <h2>
                            Distribución de Gastos en <span
                                class="highlight-text"
                                >{zonaParaDistribucion.distrito}</span
                            >
                        </h2>
                        <DistributionChart
                            data={datosDistribucion}
                            total={zonaParaDistribucion.costo_total_estimado}
                        />
                    </div>
                {/if}

                <div class="promedio-box">
                    <h3>Costo de Vida Promedio Nacional (Estimado)</h3>
                    <p class="promedio-valor">
                        ₡{safeFormat(promediosNacionales.costo_total_estimado)}
                    </p>
                </div>

                <div class="orden-box">
                    <p>
                        Mostrando **{zonasFiltradasActuales.length}** de {todasLasZonas.length}
                        zonas geográficas.
                    </p>
                    <div>
                        <button on:click={() => cambiarDireccion("costo")}>
                            Ordenar por {categorias.find(
                                (c) => c.key === categoriaComparacion,
                            ).label}{@html getSortIndicator("costo")}
                        </button>
                        <button on:click={() => cambiarDireccion("provincia")}>
                            Ordenar por Provincia{@html getSortIndicator(
                                "provincia",
                            )}
                        </button>
                    </div>
                </div>

                {#each zonasFiltradasActuales as zona}
                    <div class="card">
                        <h2>
                            Zona {zona.zona}: {zona.distrito}, {zona.provincia}
                        </h2>

                        <p class="total">
                            Costo Total Estimado: ₡{safeFormat(
                                zona.costo_total_estimado,
                            )}
                            {@html getComparisonIndicator(
                                zona,
                                "costo_total_estimado",
                            )}
                        </p>

                        {#if presentacionSeleccionada === "todas"}
                            <h3>Desglose de Gastos:</h3>
                            <ul>
                                <li>
                                    Vivienda: ₡{safeFormat(
                                        zona.gastos.vivienda,
                                    )}
                                    {@html getComparisonIndicator(
                                        zona,
                                        "vivienda",
                                    )}
                                </li>
                                <li>
                                    Alimentación: ₡{safeFormat(
                                        zona.gastos.alimentacion,
                                    )}
                                    {@html getComparisonIndicator(
                                        zona,
                                        "alimentacion",
                                    )}
                                </li>
                                <li>
                                    Transporte: ₡{safeFormat(
                                        zona.gastos.transporte,
                                    )}
                                    {@html getComparisonIndicator(
                                        zona,
                                        "transporte",
                                    )}
                                </li>
                                <li>
                                    Servicios: ₡{safeFormat(
                                        zona.gastos.servicios,
                                    )}
                                    {@html getComparisonIndicator(
                                        zona,
                                        "servicios",
                                    )}
                                </li>
                                <li>
                                    Ocio: ₡{safeFormat(zona.gastos.ocio)}
                                    {@html getComparisonIndicator(zona, "ocio")}
                                </li>
                            </ul>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="no-results-placeholder">
                Presione "Consultar Resultados" para ver los datos filtrados.
            </p>
        {/if}
    </div>

    <footer class="app-footer">
        <button
            class="boton-volver"
            on:click={() => (mostrarBienvenida = true)}
        >
            ← Volver a la Bienvenida
        </button>
        <p>
            Mi contacto: <a href="https://github.com/xxyemaxx"
                >https://github.com/xxyemaxx</a
            >
        </p>
    </footer>
{/if}

<style>
    /* Importamos la fuente para la interfaz principal */
    @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap");

    /* ---------------------------------- */
    /* 1. Variables y Estilos Globales de la Interfaz Principal */
    /* ---------------------------------- */
    :global(body) {
        /* Paleta de colores profesionales */
        --color-main-bg: #f4f7f6; /* Fondo gris muy claro */
        --color-text-dark: #2c3e50; /* Azul oscuro elegante */
        --color-text-secondary: #7f8c8d;
        --color-border-light: #ecf0f1;

        --color-action-primary: #3498db; /* Azul primario (Links, botones de orden) */
        --color-action-dark: #2980b9;

        --color-consultar-button: #2ecc71; /* Verde (Botón principal) */
        --color-consultar-dark: #27ae60;

        --color-highlight-danger: #e74c3c; /* Rojo (Valores altos) */
        --color-highlight-success: #28a745; /* Verde (Valores bajos) */

        --color-card-bg: #ffffff;

        /* Aplicar fuente a todo el cuerpo, pero la pantalla de bienvenida la sobreescribirá */
        font-family: "Roboto", sans-serif;
        background-color: var(--color-main-bg);
        color: var(--color-text-dark);
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    /* ---------------------------------- */
    /* 2. Pantalla de Bienvenida (RESTAURADO AL ORIGINAL - PRIMERA IMAGEN) */
    /* ---------------------------------- */
    .pantalla-bienvenida {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        /* Fondo degradado azul como en la imagen 1 */
        background: linear-gradient(
            160deg,
            #00bfff 0%,
            #007bff 40%,
            #004d99 100%
        );
        color: white;
        text-align: center;
        z-index: 9999;
        padding: 20px;
        box-sizing: border-box;
        /* Asegura que no use la fuente 'Roboto' */
        font-family: Arial, sans-serif;
    }

    .contenido-bienvenida {
        max-width: 700px;
        background-color: rgba(255, 255, 255, 0.15);
        padding: 40px 30px;
        border-radius: 15px;
        backdrop-filter: blur(5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .pantalla-bienvenida h1 {
        font-size: 3.5em;
        font-weight: 800;
        margin-top: 0;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    .pantalla-bienvenida h2 {
        font-size: 1.8em;
        font-weight: 400;
        margin: 10px 0 25px 0;
    }
    .pantalla-bienvenida p {
        font-size: 1.1em;
        line-height: 1.6;
        margin-bottom: 30px;
    }
    .pantalla-bienvenida button {
        background-color: #ff9900; /* Naranja/Amarillo */
        color: #2c3e50;
        border: none;
        padding: 15px 30px;
        font-size: 1.2em;
        font-weight: bold;
        border-radius: 50px;
        cursor: pointer;
        transition:
            background-color 0.3s,
            transform 0.1s;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .pantalla-bienvenida button:hover {
        background-color: #ffb84d;
        transform: scale(1.05);
    }
    .cargando-data {
        margin-top: 50px;
        opacity: 0.8;
        font-style: italic;
    }

    /* ---------------------------------- */
    /* 3. Estilos de la Interfaz Principal (Resto de la página) */
    /* ---------------------------------- */

    /* Nota: Todos los estilos de la interfaz principal (main-title, filter-group, consultar-button, card, etc.)
        se mantienen igual que en la versión anterior, utilizando las nuevas variables de color 
        y la tipografía 'Roboto'. Solo he eliminado o corregido los estilos duplicados del bloque global. */

    .main-title {
        font-size: 2.2em;
        font-weight: 900;
        color: var(--color-text-dark);
        margin: 30px auto 30px auto;
        text-align: center;
        max-width: 1000px;
        padding: 0 20px;
    }

    .main-content-container {
        flex-grow: 1;
        max-width: 1000px;
        margin: 0 auto 50px auto;
        padding: 0 20px;
    }

    .filter-group {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
    }

    .filter-item {
        flex: 1;
    }

    .filter-item label {
        display: block;
        margin-bottom: 5px;
        font-weight: 700;
        color: var(--color-text-dark);
        font-size: 0.9em;
    }

    .filter-item select,
    .filtro-box select {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--color-border-light);
        border-radius: 4px;
        font-size: 0.95em;
        box-sizing: border-box;
        appearance: none;
        background-color: white;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13.6-6.4H18.4c-5%200-9.3%201.8-13.6%206.4-4.2%204.6-6.4%2010.5-6.4%2016.9%200%206.4%202.2%2012.3%206.4%2016.9l118%20118c4.2%204.6%2010.1%206.4%2016.9%206.4s12.7-2.2%2016.9-6.4l118-118c4.4-4.6%206.6-10.5%206.6-16.9%200-6.4-2.2-12.3-6.6-16.9z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        background-size: 10px;
    }

    .consultar-button {
        background-color: var(--color-consultar-button);
        color: white;
        border: 1px solid var(--color-consultar-dark);
        padding: 10px 25px;
        font-size: 1.1em;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 700;
        transition:
            background-color 0.2s,
            box-shadow 0.2s;
        display: block;
        margin-bottom: 30px;
    }
    .consultar-button:hover {
        background-color: var(--color-consultar-dark);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .no-results-placeholder {
        text-align: center;
        font-size: 1.2em;
        color: #777;
        margin: 50px 0;
        padding: 20px;
        background-color: #fff;
        border: 1px dashed var(--color-border-light);
        border-radius: 8px;
    }

    .promedio-box {
        background: linear-gradient(135deg, #eaf4fd, #c4e1f7);
        border: 1px solid #a3d3fb;
        padding: 20px 25px;
        margin-bottom: 30px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .promedio-valor {
        font-weight: 900;
        color: var(--color-action-dark);
        font-size: 2.5em;
        margin: 10px 0 0;
    }
    .promedio-box h3 {
        color: var(--color-action-dark);
        margin-top: 0;
        font-size: 1.2em;
        opacity: 0.8;
        font-weight: 400;
    }

    .chart-container {
        background-color: var(--color-card-bg);
        border: 1px solid var(--color-border-light);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 30px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .chart-container h2 {
        font-size: 1.5em;
        margin-top: 0;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--color-border-light);
        color: var(--color-text-dark);
        font-weight: 700;
    }
    .highlight-text {
        color: var(--color-action-dark);
        font-weight: 900;
    }

    .graph-filter-box {
        padding: 15px 0;
        background-color: transparent;
        border: none;
        box-shadow: none;
        margin-bottom: 20px;
    }
    .graph-filter-box label {
        text-align: left;
    }

    .orden-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 10px 0;
        border-bottom: 2px solid var(--color-border-light);
    }
    .orden-box p {
        font-weight: 600;
        color: var(--color-text-dark);
        flex-grow: 1;
        margin-right: 20px;
    }
    .orden-box button {
        background-color: var(--color-action-primary);
        color: white;
        border: none;
        padding: 10px 18px;
        margin-left: 10px;
        border-radius: 6px;
        cursor: pointer;
        transition:
            background-color 0.2s,
            transform 0.1s;
        font-weight: bold;
        white-space: nowrap;
    }
    .orden-box button:hover {
        background-color: var(--color-action-dark);
        transform: translateY(-1px);
    }

    .card {
        background-color: var(--color-card-bg);
        border: none;
        padding: 25px;
        margin-bottom: 20px;
        border-radius: 10px;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.3s,
            box-shadow 0.3s;
        border-left: 5px solid var(--color-action-primary);
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
    .card h2 {
        color: var(--color-action-dark);
        border-bottom: 1px solid var(--color-border-light);
        padding-bottom: 10px;
        margin-top: 0;
        font-size: 1.5em;
    }
    .total {
        font-weight: 700;
        color: var(--color-text-dark);
        font-size: 1.3em;
        margin: 15px 0;
        display: flex;
        align-items: center;
    }
    .up-arrow {
        color: var(--color-highlight-danger);
        font-size: 1.2em;
    }
    .down-arrow {
        color: var(--color-highlight-success);
        font-size: 1.2em;
    }
    .card h3 {
        color: var(--color-text-dark);
        font-size: 1.1em;
        margin-top: 20px;
        margin-bottom: 10px;
        border-bottom: 1px dashed var(--color-border-light);
        padding-bottom: 5px;
    }
    .card ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .card li {
        padding: 8px 0;
        border-bottom: 1px dotted #f0f0f0;
        font-size: 1em;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .card li:last-child {
        border-bottom: none;
    }

    .app-footer {
        background-color: #e4e6e8;
        padding: 15px 5vw;
        text-align: center;
        font-size: 0.85em;
        color: #666;
        border-top: 1px solid #eee;
        margin-top: auto;
    }
    .app-footer p {
        margin: 5px 0;
    }
    .app-footer a {
        color: var(--color-action-primary);
        text-decoration: none;
    }

    .boton-volver {
        background-color: transparent;
        color: var(--color-action-primary);
        border: 1px solid var(--color-action-primary);
        padding: 5px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        margin-bottom: 10px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
    .boton-volver:hover {
        background-color: var(--color-action-primary);
        color: white;
    }
</style>
