<script>
    // @ts-nocheck

    // Propiedades que recibe el componente
    export let data = []; // Array de cantones seleccionados (1 o 2)
    export let category = "costo_total_estimado"; // Categoría actual seleccionada
    export let promedios = {}; // Objeto que debe contener los promedios nacionales
    export let theme = "light"; // Para estilos basados en el tema

    // 1. Etiqueta amigable para cada categoría (para el título del gráfico)
    const CATEGORY_LABELS = {
        costo_total_estimado: "Costo Total Estimado",
        vivienda: "Vivienda",
        alimentacion: "Alimentación",
        transporte: "Transporte",
        servicios: "Servicios",
        salud: "Salud",
        educacion: "Educación",
        comunicaciones: "Comunicaciones",
        ocio: "Ocio",
        cba_per_capita_regional: "CBA Per Cápita Regional",
        idh: "Índice de Desarrollo Humano (IDH)", // Nueva etiqueta
    };

    // 2. Colores fijos para la consistencia visual
    const CHART_COLORS = {
        canton1: "#007bff", // Azul Primario (Cantón 1)
        canton2: "#dc3545", // Rojo (Cantón 2)
        average: "#ffc107", // Amarillo (Promedio Nacional)
    };

    // 3. Cálculo Reactivo del Promedio Nacional (para la línea de referencia)
    $: averageValue = promedios[category] || 0;

    // 4. Cálculo Reactivo del valor máximo (para escalar las barras)
    $: {
        let max = averageValue;
        if (data.length > 0) {
            max = Math.max(max, ...data.map((d) => d.valorComparacion || 0));
        }
        // Añadimos un 5% extra al máximo para que la barra no toque la parte superior del gráfico
        // Para IDH, que es un índice, usamos un máximo fijo de 1
        if (category === "idh") {
            maxValue = 1;
        } else {
            maxValue = max * 1.05;
        }
    }
    let maxValue = 0;

    // 5. Función de utilidad para formatear el valor
    function formatValue(value) {
        if (category === "idh") {
            return value.toFixed(3);
        }
        if (category === "cba_per_capita_regional") {
            return `₡${new Intl.NumberFormat("es-CR").format(value)}`;
        }
        // Formato de moneda para el resto (costos)
        return `₡${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(value)}`;
    }

    // 6. Función para calcular la altura de la barra en porcentaje
    function getBarHeight(value) {
        if (maxValue === 0) return 0;
        return (value / maxValue) * 100;
    }
</script>

<div class="comparison-chart-container">
    <h3 class="chart-title">
        {CATEGORY_LABELS[category] || "Valor Desconocido"}
    </h3>

    <div class="chart-area">
        {#if averageValue > 0 && category !== "idh"}
            <div
                class="average-line"
                style="bottom: {getBarHeight(averageValue)}%;"
            >
                <span class="average-label"
                    >Promedio Nacional: {formatValue(averageValue)}</span
                >
            </div>
        {/if}

        {#if data.length > 0}
            <div class="bar-group">
                {#each data as canton, index}
                    <div class="bar-wrapper">
                        <div
                            class="bar"
                            style="
                                height: {getBarHeight(
                                canton.valorComparacion,
                            )}%;
                                background-color: {CHART_COLORS[
                                `canton${index + 1}`
                            ]};
                            "
                        >
                            <span class="bar-value">
                                {formatValue(canton.valorComparacion)}
                            </span>
                        </div>
                        <div class="canton-label">{canton.cantón}</div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="no-data">
                Seleccione uno o dos cantones para iniciar la comparación.
            </div>
        {/if}
    </div>

    <div class="legend">
        {#if data.length > 0}
            <div class="legend-item">
                <span
                    class="legend-color"
                    style="background-color: {CHART_COLORS.canton1};"
                ></span>
                {data[0]?.cantón || "Cantón 1"}
            </div>
        {/if}
        {#if data.length > 1}
            <div class="legend-item">
                <span
                    class="legend-color"
                    style="background-color: {CHART_COLORS.canton2};"
                ></span>
                {data[1]?.cantón || "Cantón 2"}
            </div>
        {/if}
        {#if averageValue > 0 && category !== "idh"}
            <div class="legend-item">
                <span
                    class="legend-color"
                    style="background-color: {CHART_COLORS.average}; opacity: 0.5; border: 1px dashed {CHART_COLORS.average}"
                ></span>
                Promedio Nacional
            </div>
        {/if}
    </div>
</div>

<style>
    .comparison-chart-container {
        padding: 20px;
        background: var(--card-background);
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .chart-title {
        text-align: center;
        color: var(--color-primary);
        margin-bottom: 20px;
        font-size: 1.5em;
    }

    .chart-area {
        position: relative;
        height: 300px;
        border-bottom: 2px solid var(--text-color);
        margin-bottom: 35px; /* Espacio para las etiquetas */
        padding: 0 10px;
    }

    .no-data {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-color);
        font-style: italic;
    }

    /* Línea de Promedio Nacional */
    .average-line {
        position: absolute;
        width: 100%;
        height: 2px;
        background-color: var(--color-accent);
        border-top: 1px dashed var(--color-accent);
        z-index: 1;
        transition: bottom 0.5s ease;
    }

    .average-label {
        position: absolute;
        top: -20px;
        right: 0;
        background-color: var(--color-accent);
        color: var(--card-background);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: 600;
        white-space: nowrap;
        opacity: 0.9;
    }

    /* Contenedor de las Barras */
    .bar-group {
        display: flex;
        justify-content: space-around;
        align-items: flex-end; /* Alinea las barras a la base */
        height: 100%;
    }

    .bar-wrapper {
        position: relative;
        width: 100px; /* Ancho fijo para las barras */
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
    }

    .bar {
        width: 80%;
        background-color: var(--color-primary);
        border-radius: 6px 6px 0 0;
        position: relative;
        transition: height 0.5s ease-out;
        display: flex;
        justify-content: center;
    }

    /* Valor sobre la barra */
    .bar-value {
        position: absolute;
        top: -25px;
        font-size: 0.8em;
        font-weight: bold;
        color: var(--text-color);
        background-color: var(--card-background);
        padding: 2px 5px;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 1px 3px var(--shadow-color);
        z-index: 2; /* Sobre la línea promedio */
        opacity: 0.9;
        transition: top 0.5s ease-out;
    }

    /* Etiqueta de cantón debajo de la barra */
    .canton-label {
        position: absolute;
        bottom: -25px;
        font-size: 0.9em;
        font-weight: 600;
        color: var(--text-color);
        text-align: center;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Leyenda */
    .legend {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-top: 40px;
        padding-top: 15px;
        border-top: 1px solid var(--border-color);
    }

    .legend-item {
        display: flex;
        align-items: center;
        font-size: 0.9em;
        color: var(--text-color);
    }

    .legend-color {
        display: inline-block;
        width: 15px;
        height: 15px;
        margin-right: 8px;
        border-radius: 3px;
    }

    /* Media Query Responsive */
    @media (max-width: 768px) {
        .chart-area {
            height: 250px;
            margin-bottom: 40px;
        }
        .bar-wrapper {
            width: 80px;
        }
        .average-label {
            top: -30px;
            font-size: 0.75em;
        }
        .bar-value {
            font-size: 0.75em;
            top: -20px;
        }
        .legend {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
    }
</style>
