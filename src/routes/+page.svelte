<script>
    // @ts-nocheck
    import { onMount, setContext } from "svelte";
    import ComparisonChart from "$lib/components/ComparisonChart.svelte";
    import DistributionChart from "$lib/components/DistributionChart.svelte";

    export let data; // Datos cargados por SvelteKit (que contienen 'costos' y 'promedios')

    // Inicialización de datos
    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios || {};

    // Variables de estado para la comparación
    let provinciaSeleccionada1 = "";
    let cantonSeleccionado1 = "";
    let provinciaSeleccionada2 = "";
    let cantonSeleccionado2 = "";

    // Variables de estado para la tabla y filtros
    let gastoComparacionSeleccionada = "";
    let presentacionSeleccionada = "todas";
    let zonasFiltradasActuales = todasLasZonas;
    let zonasParaComparar = [];
    let mostrarResults = true;

    // Variables de estado para ordenamiento
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado";

    // Tema
    let theme = "light";
    setContext("theme", { theme });

    // --- Variables Reactivas ($: ) ---

    // Obtener lista única de provincias
    $: todasLasProvincias = [
        ...new Set(todasLasZonas.map((z) => z.provincia)),
    ].sort();

    // Obtener cantones disponibles para el Select 1, filtrando por provincia
    $: cantonesDisponibles1 = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada1 === "") return true;
            return z.provincia === provinciaSeleccionada1;
        })
        .map((z) => z.cantón) // Usamos 'cantón' con tilde
        .sort();

    // Obtener cantones disponibles para el Select 2, filtrando por provincia
    $: cantonesDisponibles2 = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada2 === "") return true;
            return z.provincia === provinciaSeleccionada2;
        })
        .map((z) => z.cantón) // Usamos 'cantón' con tilde
        .sort();

    // Lógica de filtrado y ordenamiento de la tabla
    $: {
        let zonasFiltradas = todasLasZonas;

        // 1. Filtrado por presentación (Región INEC)
        if (presentacionSeleccionada !== "todas") {
            zonasFiltradas = todasLasZonas.filter(
                (zona) => zona.region_inec === presentacionSeleccionada,
            );
        }

        // 2. Filtrado por búsqueda de cantones
        if (gastoComparacionSeleccionada !== "") {
            const busqueda = gastoComparacionSeleccionada.toLowerCase();
            zonasFiltradas = zonasFiltradas.filter((zona) =>
                zona.cantón.toLowerCase().includes(busqueda),
            );
        }

        // 3. Ordenamiento
        zonasFiltradas.sort((a, b) => {
            let valorA, valorB;

            if (criterioOrden === "canton") {
                valorA = a.cantón.toLowerCase();
                valorB = b.cantón.toLowerCase();
            } else if (criterioOrden === "provincia") {
                valorA = a.provincia.toLowerCase();
                valorB = b.provincia.toLowerCase();
            } else if (criterioOrden === "costo") {
                valorA = a.costo_total_estimado;
                valorB = b.costo_total_estimado;
            } else {
                // Ordenar por gasto específico (vivienda, alimentación, etc.)
                valorA = a.gastos[criterioOrden];
                valorB = b.gastos[criterioOrden];
            }

            let comparacion = 0;
            if (typeof valorA === "string") {
                comparacion = valorA.localeCompare(valorB);
            } else {
                comparacion = valorA - valorB;
            }

            return direccionOrden === "asc" ? comparacion : -comparacion;
        });

        zonasFiltradasActuales = zonasFiltradas;
        mostrarResults = zonasFiltradas.length > 0;
    }

    // Lógica para comparación rápida (añadir/quitar de 'zonasParaComparar')
    function toggleComparacion(zona) {
        const index = zonasParaComparar.findIndex(
            (z) => z.cantón === zona.cantón,
        );
        if (index > -1) {
            zonasParaComparar.splice(index, 1);
        } else {
            if (zonasParaComparar.length < 2) {
                zonasParaComparar = [...zonasParaComparar, zona];
            } else {
                alert("Solo puedes comparar un máximo de 2 cantones.");
            }
        }
        // Necesario para que Svelte detecte el cambio en el array
        zonasParaComparar = zonasParaComparar;
    }

    // Lógica para comparación por Selects
    $: zonaComparacion1 = todasLasZonas.find(
        (z) =>
            z.provincia === provinciaSeleccionada1 &&
            z.cantón === cantonSeleccionado1,
    );

    $: zonaComparacion2 = todasLasZonas.find(
        (z) =>
            z.provincia === provinciaSeleccionada2 &&
            z.cantón === cantonSeleccionado2,
    );

    // Actualizar el array de comparación principal
    $: {
        zonasParaComparar = [];
        if (zonaComparacion1) {
            zonasParaComparar = [...zonasParaComparar, zonaComparacion1];
        }
        if (
            zonaComparacion2 &&
            zonaComparacion2.cantón !== zonaComparacion1?.cantón
        ) {
            zonasParaComparar = [...zonasParaComparar, zonaComparacion2];
        }
    }

    // Funciones de utilidad para la UI
    function zonaSeleccionada(canton) {
        return zonasParaComparar.some((z) => z.cantón === canton);
    }

    function formatNumber(num) {
        if (typeof num !== "number") return "-";
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }

    function setOrden(criterio) {
        if (criterio === criterioOrden) {
            direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
        } else {
            criterioOrden = criterio;
            direccionOrden = "desc";
        }
    }

    function getArrow(criterio) {
        if (criterioOrden !== criterio) return "";
        return direccionOrden === "asc" ? " ▲" : " ▼";
    }

    // Manejo de tema (modo oscuro)
    onMount(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            theme = savedTheme;
        } else if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            theme = "dark";
        }
        document.documentElement.setAttribute("data-theme", theme);
    });

    function toggleTheme() {
        theme = theme === "light" ? "dark" : "light";
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }

    // Resetear filtros
    function resetFilters() {
        provinciaSeleccionada1 = "";
        cantonSeleccionado1 = "";
        provinciaSeleccionada2 = "";
        cantonSeleccionado2 = "";
        gastoComparacionSeleccionada = "";
        presentacionSeleccionada = "todas";
        zonasParaComparar = [];
    }

    const regionesINECAbrevs = [
        "Central",
        "Chorotega",
        "Pacífico Central",
        "Brunca",
        "Huetar Norte",
        "Atlántica",
    ];

    $: totalZonasParaComparar = zonasParaComparar.length;
</script>

<div class="main-container">
    <header>
        <h1>Costo de Vida por Cantón de Costa Rica</h1>
        <p>
            Análisis comparativo del costo de vida estimado (Vivienda,
            Alimentación, Transporte y más) basado en datos del INEC y
            estimaciones de mercado.
        </p>
        <button
            on:click={toggleTheme}
            class="theme-toggle"
            title="Cambiar tema"
        >
            {#if theme === "light"}
                <i class="fas fa-moon"></i>
            {:else}
                <i class="fas fa-sun"></i>
            {/if}
        </button>
    </header>

    <section class="comparison-section">
        <h2>Comparación de Cantones</h2>
        <div class="controls-container">
            <div class="comparison-group">
                <select
                    bind:value={provinciaSeleccionada1}
                    on:change={() => (cantonSeleccionado1 = "")}
                >
                    <option value="">Provincia 1</option>
                    {#each todasLasProvincias as provincia}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
                <select
                    bind:value={cantonSeleccionado1}
                    disabled={!provinciaSeleccionada1}
                >
                    <option value="">Cantón 1</option>
                    {#each cantonesDisponibles1 as canton}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </div>
            <div class="separator-vs">VS</div>
            <div class="comparison-group">
                <select
                    bind:value={provinciaSeleccionada2}
                    on:change={() => (cantonSeleccionado2 = "")}
                >
                    <option value="">Provincia 2</option>
                    {#each todasLasProvincias as provincia}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
                <select
                    bind:value={cantonSeleccionado2}
                    disabled={!provinciaSeleccionada2}
                >
                    <option value="">Cantón 2</option>
                    {#each cantonesDisponibles2 as canton}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </div>
            <button on:click={resetFilters} class="reset-button">
                <i class="fas fa-redo"></i> Resetear Filtros
            </button>
        </div>

        {#if zonasParaComparar.length > 0}
            <div class="chart-container">
                <div class="chart-controls">
                    <label for="categoria-comparacion"
                        >Categoría a Comparar:</label
                    >
                    <select
                        id="categoria-comparacion"
                        bind:value={categoriaComparacion}
                    >
                        <option value="costo_total_estimado"
                            >Costo Total Estimado</option
                        >
                        <option value="gastos.vivienda">Vivienda</option>
                        <option value="gastos.alimentacion">Alimentación</option
                        >
                        <option value="gastos.transporte">Transporte</option>
                        <option value="gastos.servicios">Servicios</option>
                        <option value="gastos.salud">Salud</option>
                        <option value="gastos.educacion">Educación</option>
                        <option value="gastos.comunicaciones"
                            >Comunicaciones</option
                        >
                        <option value="gastos.ocio">Ocio</option>
                        <option value="cba_per_capita_regional"
                            >CBA Per Cápita</option
                        >
                    </select>
                </div>
                <ComparisonChart
                    data={zonasParaComparar}
                    category={categoriaComparacion}
                    promedios={promediosNacionales}
                    {theme}
                />
            </div>
        {/if}

        {#if totalZonasParaComparar === 1}
            <div class="chart-container distribution-chart">
                <h3>Distribución de Gastos en {zonasParaComparar[0].cantón}</h3>
                <DistributionChart data={zonasParaComparar[0]} {theme} />
            </div>
        {/if}
    </section>

    <div class="divider"></div>

    <section class="table-section">
        <h2>
            Exploración por Cantón ({zonasFiltradasActuales.length} Resultados)
        </h2>
        <div class="filter-bar">
            <input
                type="text"
                bind:value={gastoComparacionSeleccionada}
                placeholder="Buscar cantón..."
                class="search-input"
            />
            <select bind:value={presentacionSeleccionada} class="region-select">
                <option value="todas">Todas las Regiones (INEC)</option>
                {#each regionesINECAbrevs as region}
                    <option value={region}>{region}</option>
                {/each}
            </select>
        </div>

        <div class="table-container">
            <div class="table-header">
                <button
                    on:click={() => setOrden("canton")}
                    class="col-canton header-button"
                >
                    Cantón {getArrow("canton")}
                </button>
                <button
                    on:click={() => setOrden("provincia")}
                    class="col-provincia header-button"
                >
                    Provincia {getArrow("provincia")}
                </button>
                <button
                    on:click={() => setOrden("costo")}
                    class="col-costo-total header-button"
                >
                    Costo Total {getArrow("costo")}
                </button>
                <button
                    on:click={() => setOrden("vivienda")}
                    class="col-vivienda header-button"
                >
                    Vivienda {getArrow("vivienda")}
                </button>
                <button
                    on:click={() => setOrden("alimentacion")}
                    class="col-alimentacion header-button"
                >
                    Alimentación {getArrow("alimentacion")}
                </button>
                <button
                    on:click={() => setOrden("transporte")}
                    class="col-transporte header-button"
                >
                    Transporte {getArrow("transporte")}
                </button>
                <button
                    on:click={() => setOrden("servicios")}
                    class="col-servicios header-button"
                >
                    Servicios {getArrow("servicios")}
                </button>
                <button
                    on:click={() => setOrden("salud")}
                    class="col-otros header-button"
                >
                    Salud {getArrow("salud")}
                </button>
            </div>

            {#if mostrarResults}
                {#each zonasFiltradasActuales as zona (zona.cantón)}
                    <div
                        class="table-row-list"
                        data-canton={zona.cantón}
                        class:selected={zonaSeleccionada(zona.cantón)}
                    >
                        <div class="col-canton">
                            <button
                                on:click={() => toggleComparacion(zona)}
                                class="comparison-toggle"
                                aria-label="Agregar a comparación"
                                title="Comparar {zona.cantón}"
                            >
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <span class="canton-name">{zona.cantón}</span>
                            <span class="region-badge" title="Región INEC"
                                >{zona.region_inec}</span
                            >
                        </div>
                        <div class="col-provincia">{zona.provincia}</div>
                        <div class="col-costo-total">
                            {formatNumber(zona.costo_total_estimado)}
                        </div>
                        <div class="col-vivienda">
                            {formatNumber(zona.gastos.vivienda)}
                        </div>
                        <div class="col-alimentacion">
                            {formatNumber(zona.gastos.alimentacion)}
                        </div>
                        <div class="col-transporte">
                            {formatNumber(zona.gastos.transporte)}
                        </div>
                        <div class="col-servicios">
                            {formatNumber(zona.gastos.servicios)}
                        </div>
                        <div class="col-otros">
                            {formatNumber(zona.gastos.salud)}
                        </div>
                    </div>
                {/each}
            {:else}
                <div class="no-results">
                    No se encontraron cantones que coincidan con los filtros.
                </div>
            {/if}
        </div>

        <div class="references-table">
            <h3>Referencias y Métodos de Cálculo</h3>
            <p>
                <strong>Costo Total Estimado:</strong> Suma de todos los gastos (Vivienda,
                Alimentación, Transporte, Servicios, Salud, Educación, Comunicaciones,
                Ocio).
            </p>
            <p>
                <strong>CBA Per Cápita Regional:</strong> Costo de la Canasta Básica
                Alimentaria promedio por persona en la región, según el INEC.
            </p>
            <p>
                <strong>Referencia IPC Nacional:</strong> Índice de Precios al Consumidor
                Nacional (base 2021 = 100), utilizado para ajustar estimaciones.
            </p>
        </div>
    </section>
</div>

<style lang="css">
    /* Estilos globales y variables de tema */
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: "Inter", sans-serif;
        background-color: var(--background-color);
        color: var(--text-color);
        transition:
            background-color 0.3s,
            color 0.3s;
    }

    :global(html[data-theme="light"]) {
        --background-color: #f7f9fc;
        --card-background: #ffffff;
        --text-color: #333333;
        --color-primary: #0056b3;
        --color-secondary: #007bff;
        --color-accent: #ffc107;
        --border-color: #e0e0e0;
        --shadow-color: rgba(0, 0, 0, 0.08);
    }

    :global(html[data-theme="dark"]) {
        --background-color: #1a1a2e;
        --card-background: #1f4068;
        --text-color: #ffffff;
        --color-primary: #45a29e;
        --color-secondary: #57b39a;
        --color-accent: #f9d342;
        --border-color: #3e4c70;
        --shadow-color: rgba(0, 0, 0, 0.4);
    }

    /* Contenedor principal */
    .main-container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 20px;
    }

    /* Encabezado */
    header {
        text-align: center;
        margin-bottom: 40px;
        position: relative;
    }

    header h1 {
        color: var(--color-primary);
        font-size: 2.5em;
        margin-bottom: 0.1em;
    }

    header p {
        color: var(--text-color);
        opacity: 0.8;
        font-size: 1.1em;
    }

    .divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 40px 0;
    }

    /* Botón de tema */
    .theme-toggle {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--card-background);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 10px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2em;
        transition:
            background-color 0.3s,
            border-color 0.3s;
    }

    .theme-toggle:hover {
        background: var(--border-color);
    }

    /* Títulos de sección */
    h2 {
        color: var(--color-secondary);
        border-bottom: 2px solid var(--color-primary);
        padding-bottom: 5px;
        margin-top: 20px;
        font-size: 1.8em;
    }

    /* --- Sección de Comparación --- */
    .comparison-section {
        background: var(--card-background);
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        margin-bottom: 40px;
        border: 1px solid var(--border-color);
    }

    .controls-container {
        display: grid;
        grid-template-columns: 2fr max-content 2fr 1fr;
        gap: 20px;
        align-items: center;
        margin-bottom: 30px;
    }

    .comparison-group {
        display: flex;
        gap: 10px;
    }

    .controls-container select,
    .controls-container button {
        padding: 10px 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--background-color);
        color: var(--text-color);
        font-size: 1em;
        cursor: pointer;
        transition: all 0.3s;
    }

    .controls-container select:hover:not(:disabled),
    .controls-container button:hover {
        border-color: var(--color-primary);
    }

    .controls-container select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .separator-vs {
        font-weight: bold;
        color: var(--color-primary);
        font-size: 1.2em;
    }

    .reset-button {
        background-color: #dc3545;
        color: white;
        border: none;
    }

    .reset-button:hover {
        background-color: #c82333;
    }

    .chart-container {
        margin-top: 20px;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--background-color);
    }

    .chart-controls {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
    }

    .chart-controls label {
        font-weight: 600;
    }

    .chart-controls select {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background-color: var(--card-background);
        color: var(--text-color);
    }

    .distribution-chart h3 {
        color: var(--color-primary);
        font-size: 1.4em;
        margin-bottom: 15px;
        text-align: center;
    }

    /* --- Sección de Tabla --- */
    .filter-bar {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
    }

    .search-input,
    .region-select {
        flex: 1;
        padding: 12px 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--card-background);
        color: var(--text-color);
        font-size: 1em;
        transition: border-color 0.3s;
    }

    .search-input:focus,
    .region-select:focus {
        border-color: var(--color-primary);
        outline: none;
    }

    .table-container {
        overflow-x: auto;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--card-background);
    }

    .table-header,
    .table-row-list {
        display: grid;
        /* Definición de las columnas de la tabla: 8 en total */
        grid-template-columns: 1.5fr 1fr 1fr repeat(5, 0.8fr);
        padding: 12px 20px;
        border-bottom: 1px solid var(--border-color);
        align-items: center;
        gap: 10px;
    }

    .table-header {
        background-color: var(--color-primary);
        color: white;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 10;
        text-align: left;
    }

    .header-button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        text-align: inherit;
        font-size: 1em;
        font-weight: inherit;
        cursor: pointer;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .header-button:hover {
        opacity: 0.8;
    }

    .table-row-list {
        background-color: var(--card-background);
        transition:
            background-color 0.2s,
            box-shadow 0.2s;
        cursor: default;
    }

    .table-row-list:hover {
        background-color: var(--background-color);
    }

    .table-row-list.selected {
        background-color: var(--color-accent);
        color: #1a1a2e; /* Contraste para el fondo amarillo */
        font-weight: 600;
        border-left: 5px solid var(--color-secondary);
        padding-left: 15px;
    }

    /* Estilos de las celdas */
    .col-canton {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .canton-name {
        font-weight: 600;
    }

    .region-badge {
        font-size: 0.75em;
        padding: 3px 6px;
        border-radius: 4px;
        background-color: var(--color-secondary);
        color: white;
        white-space: nowrap;
    }

    .col-costo-total {
        font-weight: bold;
        color: var(--color-primary);
    }

    .comparison-toggle {
        background: none;
        border: none;
        color: var(--color-secondary);
        cursor: pointer;
        padding: 0;
        font-size: 1.1em;
    }

    .table-row-list.selected .comparison-toggle {
        color: #1a1a2e; /* Ajuste para el contraste en selección */
    }

    .no-results {
        padding: 20px;
        text-align: center;
        color: var(--text-color);
        opacity: 0.7;
    }

    /* Referencias */
    .references-table {
        margin-top: 40px;
        padding: 20px;
        background: var(--card-background);
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .references-table p {
        margin: 5px 0;
        padding-left: 10px;
        border-left: 3px solid var(--border-color);
        text-align: left;
        font-size: 0.9em;
        line-height: 1.6;
    }

    .references-table h3 {
        margin-top: 0;
        font-size: 1.4em;
        font-weight: 600;
        color: var(--color-primary);
    }

    /* Media Queries */
    @media (max-width: 1000px) {
        /* Ajuste el grid para 4 columnas en vista colapsada: Cantón, Provincia, Costo Total, 1 Gasto */
        .table-header,
        .table-row-list {
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
        }
        .col-vivienda,
        .col-alimentacion,
        .col-transporte,
        .col-servicios,
        .col-otros {
            display: none;
        }

        .controls-container {
            grid-template-columns: 1fr;
            gap: 15px;
        }

        .comparison-group {
            flex-direction: column;
            gap: 8px;
        }

        .separator-vs {
            display: none;
        }

        .reset-button {
            order: 3;
        }

        .theme-toggle {
            top: 10px;
            right: 10px;
        }
    }

    @media (max-width: 600px) {
        header h1 {
            font-size: 2em;
        }

        .filter-bar {
            flex-direction: column;
            gap: 10px;
        }
    }
</style>
