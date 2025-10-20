<script>
    // @ts-nocheck

    import BarChart from "$lib/components/BarChart.svelte";

    export let data;

    // 1. CONTROL DE VISTA
    let mostrarBienvenida = true;
    const entrarAPagina = () => {
        mostrarBienvenida = false;
        // Al entrar, mostramos todos los resultados (aplicamos el filtro inicial)
        aplicarFiltros();
    };

    // 2. DATOS BASE
    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios;

    // 3. ESTADOS DE LOS FILTROS
    let provinciaSeleccionada = ""; // Campo de Búsqueda de Texto
    let cantonSeleccionado = ""; // Selector de Distrito
    let tipoGastoSeleccionado = "";
    // 🚨 presentacionSeleccionada ahora es funcional
    let presentacionSeleccionada = "todas"; // Valor por defecto

    // ** NUEVO: Estado para almacenar y mostrar los resultados después de CONSULTAR **
    let zonasFiltradasActuales = todasLasZonas; // Mostrará todas al inicio
    let mostrarResultados = false;

    // 4. LÓGICA PARA OBTENER OPCIONES ÚNICAS (Reactividad de Selectores)

    // Opciones únicas de Provincia
    $: todasLasProvincias = [
        ...new Set(todasLasZonas.map((z) => z.provincia)),
    ].sort();

    // Opciones de Cantón filtradas por el texto de búsqueda.
    $: cantonesDisponibles = todasLasZonas
        .filter((z) => {
            if (!provinciaSeleccionada) return true; // Si está vacío, no filtra.
            const busquedaLower = provinciaSeleccionada.toLowerCase().trim();
            // Filtra por si el texto coincide en Provincia O Distrito
            return (
                z.provincia.toLowerCase().includes(busquedaLower) ||
                z.distrito.toLowerCase().includes(busquedaLower)
            );
        })
        .map((z) => z.distrito);

    $: todosLosCantones = [...new Set(cantonesDisponibles)].sort();

    // Opciones para "Tipo de Gasto" (Adaptado de Categorías)
    const opcionesTipoGasto = [
        { key: "", label: "-- SELECCIONE --" }, // Opción para no filtrar
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
    ];

    // 5. LÓGICA DE FILTRADO Y BOTÓN CONSULTAR

    /**
     * Función que aplica los filtros seleccionados a todasLasZonas y actualiza
     * zonasFiltradasActuales.
     */
    const aplicarFiltros = () => {
        let filtrosAplicados = todasLasZonas.filter((zona) => {
            let coincideBusqueda = true;
            let coincideCanton = true;

            // 1. Filtro de Búsqueda de Texto (Provincia / Distrito)
            if (provinciaSeleccionada) {
                const busquedaLower = provinciaSeleccionada
                    .toLowerCase()
                    .trim();
                // Coincide si el texto está incluido en Provincia O Distrito
                coincideBusqueda =
                    zona.provincia.toLowerCase().includes(busquedaLower) ||
                    zona.distrito.toLowerCase().includes(busquedaLower);
            }

            // 2. Filtro de Cantón/Distrito (Selector)
            if (cantonSeleccionado) {
                // El selector de cantón solo permite valores *exactos*
                coincideCanton = zona.distrito === cantonSeleccionado;
            }

            // El filtro de Tipo de Gasto se utiliza para la comparación y el ordenamiento, no para reducir la lista de tarjetas.

            return coincideBusqueda && coincideCanton;
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

        // Mostrar la sección de resultados (gráficos y tarjetas)
        mostrarResultados = true;
    };

    /**
     * Función para limpiar el filtro de búsqueda de texto (Provincia)
     */
    const limpiarBusqueda = () => {
        provinciaSeleccionada = "";
        // Al limpiar, también reseteamos el cantón para evitar conflictos
        cantonSeleccionado = "";
    };

    /**
     * Resetear Cantón cuando se utiliza la búsqueda de Provincia/Distrito (campo de texto)
     */
    $: if (provinciaSeleccionada) {
        cantonSeleccionado = "";
    }

    // 6. LÓGICA DE ORDENAMIENTO (se mantiene)
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado"; // Usado para ordenar por costo

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
        // Re-aplicar filtros para re-ordenar la lista
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
</script>

{#if mostrarBienvenida}
    <div class="pantalla-bienvenida">
        <div class="contenido-bienvenida">
            <h1>¡Bienvenidos!</h1>
            <h2>
                Descubra y compara el Costo de Vida en Costa Rica por Zonas
                Geográficas.
            </h2>
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
                <label for="filtro-busqueda">Provincia</label>
                <div class="input-with-button">
                    <input
                        id="filtro-busqueda"
                        type="text"
                        placeholder="Ej: San José o Alajuela"
                        bind:value={provinciaSeleccionada}
                    />
                    {#if provinciaSeleccionada}
                        <button on:click={limpiarBusqueda} class="clear-button"
                            >❌</button
                        >
                    {/if}
                </div>
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
                <div class="promedio-box">
                    <h3>Costo de Vida Promedio Nacional (Estimado)</h3>
                    <p class="promedio-valor">
                        ₡{safeFormat(promediosNacionales.costo_total_estimado)}
                    </p>
                </div>

                <div class="filtro-box graph-filter-box">
                    <label for="categoria-select"
                        >Comparar Gráfico por Gasto:</label
                    >
                    <select
                        id="categoria-select"
                        bind:value={categoriaComparacion}
                    >
                        {#each categorias as cat}
                            <option value={cat.key}>{cat.label}</option>
                        {/each}
                    </select>
                </div>

                <BarChart
                    data={zonasFiltradasActuales}
                    categoria={categoriaComparacion}
                    promedios={promediosNacionales}
                />

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
    /* ---------------------------------- */
    /* 1. Variables Globales y Fondo */
    /* ---------------------------------- */
    :global(body) {
        /* Se mantienen las variables */
        --color-main-bg: #f9f9f9;
        --color-header-bg: #ffffff;
        --color-text-dark: #333;
        --color-text-secondary: #555;
        --color-border-light: #ddd;
        --color-green-primary: #5cb85c;
        --color-green-dark: #4cae4c;
        --color-link: #007bff;
        --color-highlight-bg: #e6ffe6;
        --color-blue-primary: #007bff;
        --color-blue-dark: #0056b3;
        --color-success: #28a745;
        --color-danger: #dc3545;
        --color-card-bg: #ffffff;

        font-family: Arial, sans-serif;
        background-color: var(--color-main-bg);
        color: var(--color-text-dark);
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    /* ---------------------------------- */
    /* 2. Título Principal Ajustado */
    /* ---------------------------------- */
    .main-title {
        font-size: 2.2em;
        font-weight: bold;
        color: var(--color-text-dark);
        margin: 30px auto 30px auto;
        text-align: center;
        max-width: 1000px;
        padding: 0 20px;
    }

    /* ---------------------------------- */
    /* 3. Contenedor Principal de Contenido */
    /* ---------------------------------- */
    .main-content-container {
        flex-grow: 1;
        max-width: 1000px;
        margin: 0 auto 50px auto;
        padding: 0 20px;
    }

    /* ---------------------------------- */
    /* 4. Estilos de Filtros y Búsqueda */
    /* ---------------------------------- */
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
        font-weight: bold;
        color: var(--color-text-dark);
        font-size: 0.9em;
    }

    .input-with-button {
        position: relative;
    }

    .input-with-button input,
    .filter-item select,
    .filtro-box select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
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

    .input-with-button input:focus,
    .filter-item select:focus,
    .filtro-box select:focus {
        border-color: #888;
        outline: none;
        box-shadow: 0 0 0 1px #888;
    }

    .clear-button {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9em;
        color: #999;
        padding: 0 5px;
        z-index: 2;
    }
    .clear-button:hover {
        color: #555;
    }

    /* ---------------------------------- */
    /* 5. Estilos del Botón Consultar */
    /* ---------------------------------- */
    .consultar-button {
        background-color: var(--color-green-primary);
        color: white;
        border: 1px solid var(--color-green-dark);
        padding: 10px 25px;
        font-size: 1.1em;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition:
            background-color 0.2s,
            box-shadow 0.2s;
        display: block;
        margin-bottom: 30px;
    }
    .consultar-button:hover {
        background-color: var(--color-green-dark);
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

    /* ---------------------------------- */
    /* 6. Estilos de la Sección de Resultados de Costo de Vida */
    /* ---------------------------------- */

    .promedio-box {
        background: linear-gradient(135deg, #e6f7ff, #b3d9ff);
        border: 1px solid #91d5ff;
        padding: 20px 25px;
        margin-bottom: 30px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .promedio-valor {
        font-weight: 800;
        color: var(--color-blue-dark);
        font-size: 2.5em;
        margin: 10px 0 0;
    }
    .promedio-box h3 {
        color: var(--color-blue-dark);
        margin-top: 0;
        font-size: 1.2em;
        opacity: 0.8;
    }

    .graph-filter-box {
        padding: 15px;
        background-color: var(--color-card-bg);
        border: 1px solid var(--color-border-light);
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
        background-color: var(--color-blue-primary);
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
        background-color: var(--color-blue-dark);
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
        border-left: 5px solid var(--color-blue-primary);
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
    .card h2 {
        color: var(--color-blue-dark);
        border-bottom: 1px solid var(--color-border-light);
        padding-bottom: 10px;
        margin-top: 0;
        font-size: 1.5em;
    }
    .total {
        font-weight: 700;
        color: var(--color-success);
        font-size: 1.3em;
        margin: 15px 0;
        display: flex;
        align-items: center;
    }
    .up-arrow {
        color: var(--color-danger);
        font-size: 1.2em;
    }
    .down-arrow {
        color: var(--color-success);
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

    /* ---------------------------------- */
    /* 7. Pie de Página (Footer) */
    /* ---------------------------------- */
    .app-footer {
        background-color: #f0f0f0;
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
        color: var(--color-link);
        text-decoration: none;
    }

    .boton-volver {
        background-color: transparent;
        color: var(--color-link);
        border: 1px solid var(--color-link);
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
        background-color: var(--color-link);
        color: white;
    }

    /* ---------------------------------- */
    /* 8. Estilos de la pantalla de bienvenida (Se mantienen) */
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
        border-bottom: none;
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
        background-color: #ff9900;
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
</style>
