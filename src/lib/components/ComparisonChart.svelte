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
    };

    // 2. Colores fijos para la consistencia visual
    const CHART_COLORS = {
        canton1: "#007bff", // Azul Primario (Cantón 1)
        canton2: "#dc3545", // Rojo (Cantón 2)
        average: "#ffc107", // Amarillo (Promedio Nacional)
    };

    // 3. Cálculo Reactivo del Promedio Nacional (para la línea base)
    $: nationalAverage = (() => {
        // En +page.svelte, solo calculamos promedioNacionalCosto y promedioNacionalIDH.
        // Si la categoría específica no está en el objeto `promedios`,
        // usamos el promedio de Costo Total como la línea de referencia por defecto.
        return promedios?.[category] || promedios?.costo_total_estimado || 0;
    })();

    // 4. Determinar el valor máximo para establecer la escala (eje Y)
    $: maxValue = (() => {
        const values = data.map((d) => d.valorComparacion);
        values.push(nationalAverage); // Incluir el promedio nacional

        // El valor máximo debe ser el más alto de todos, más un 10% de margen.
        const maxVal = Math.max(...values, 100);
        return maxVal * 1.1; // 10% de margen para que la barra más alta no toque el borde
    })();

    // 5. Función de formato para el eje Y y las etiquetas
    const formatValue = (value) => {
        // Para IDH, se usa formato decimal.
        if (category === "idh" || category.includes("idh")) {
            return value.toFixed(3);
        }
        // Para costos, se usa formato de moneda.
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    // 6. Obtener el valor formateado del eje Y
    const getAxisValue = (percentage) => {
        return formatValue(maxValue * percentage);
    };
</script>

<div class="comparison-chart-wrapper">
    <h3>
        Comparación de **{CATEGORY_LABELS[category] || category}**
    </h3>

    <div class="chart-area">
        <div class="y-axis">
            <div class="y-axis-label max-value" style="top: 0;">
                {getAxisValue(1)}
            </div>
            <div class="y-axis-label half-value" style="top: 50%;">
                {getAxisValue(0.5)}
            </div>
            <div class="y-axis-label zero-value" style="bottom: 0;">
                {getAxisValue(0)}
            </div>
        </div>

        <div class="bars-container">
            <div
                class="bar-group average-group"
                style="--bar-height: {(nationalAverage / maxValue) * 100}%; 
                       --bar-color: {CHART_COLORS.average};"
            >
                <div class="bar bar-average"></div>
                <span class="value-label">
                    {formatValue(nationalAverage)}
                </span>
                <span class="canton-label"> PROMEDIO NACIONAL </span>
            </div>

            {#each data as canton, index}
                <div
                    class="bar-group canton-group"
                    style="--bar-height: {(canton.valorComparacion / maxValue) *
                        100}%; 
                           --bar-color: {index === 0
                        ? CHART_COLORS.canton1
                        : CHART_COLORS.canton2};"
                >
                    <div class="bar bar-canton"></div>

                    <span class="value-label value-canton">
                        {formatValue(canton.valorComparacion)}
                    </span>
                    <span class="canton-label">
                        {canton.cantón}
                    </span>
                </div>
            {/each}
        </div>
    </div>

    <div class="legend">
        <div class="legend-item">
            <span
                class="legend-color"
                style="background-color: {CHART_COLORS.canton1};"
            ></span>
            Cantón 1 (Principal)
        </div>
        {#if data[1]}
            <div class="legend-item">
                <span
                    class="legend-color"
                    style="background-color: {CHART_COLORS.canton2};"
                ></span>
                Cantón 2 (Comparación)
            </div>
        {/if}
        <div class="legend-item">
            <span
                class="legend-color"
                style="background-color: {CHART_COLORS.average};"
            ></span>
            Promedio Nacional ({data.length} Cantones Comparados)
        </div>
    </div>
</div>

<style>
    /* Estilos del contenedor */
    .comparison-chart-wrapper {
        padding: 20px;
        background: var(--background-color);
        border-radius: 8px;
    }

    .comparison-chart-wrapper h3 {
        text-align: center;
        color: var(--color-primary);
        margin-bottom: 30px;
        font-size: 1.5em;
    }

    /* Área principal del gráfico */
    .chart-area {
        position: relative;
        height: 350px; /* Altura fija */
        padding-left: 50px; /* Espacio para el eje Y */
        border-bottom: 2px solid var(--chart-line-color);
        margin: 0 10px 40px 10px;
    }

    /* Líneas de referencia del Eje Y */
    .y-axis {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100%;
    }
    .y-axis-label {
        position: absolute;
        left: -50px;
        font-size: 0.85em;
        color: var(--text-color);
        font-weight: 600;
        pointer-events: none;
        white-space: nowrap;
        transform: translateY(-50%); /* Ajuste para centrar en la línea */
    }
    .half-value {
        border-top: 1px dashed var(--chart-line-color);
        width: 100%;
    }
    .max-value {
        transform: translateY(0);
    }
    .zero-value {
        transform: translateY(0);
    }

    /* Contenedor de Barras */
    .bars-container {
        position: absolute;
        top: 0;
        left: 50px; /* Alineado al borde del eje Y */
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: space-around;
        align-items: flex-end; /* Las barras crecen desde abajo */
        padding-bottom: 20px; /* Espacio para las etiquetas de cantón */
        gap: 20px;
    }

    /* Estilo del grupo de barras */
    .bar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100px; /* Ancho fijo para cada barra */
        height: 100%;
        position: relative;
    }

    /* La barra real */
    .bar {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: var(--bar-height); /* Altura dinámica en JS */
        background-color: var(--bar-color); /* Color dinámico en JS */
        border-radius: 4px 4px 0 0;
        transition:
            height 0.5s ease-out,
            background-color 0.3s;
        box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
    }

    /* El promedio nacional es una línea de referencia más delgada y tenue */
    .average-group {
        width: 40px;
    }
    .bar-average {
        box-shadow: none;
        opacity: 0.7;
    }

    /* Etiquetas de valor encima de la barra */
    .value-label {
        position: absolute;
        /* La etiqueta se coloca 25px POR ENCIMA del final de la barra */
        top: calc(100% - var(--bar-height) - 25px);
        color: var(--bar-color);
        font-weight: 700;
        font-size: 0.9em;
        white-space: nowrap;
        text-align: center;
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
            margin: 0;
            padding-left: 40px;
        }
        .bars-container {
            left: 40px;
        }
        .bar-group {
            width: 70px;
        }
        .average-group {
            width: 30px;
        }
        .y-axis-label {
            left: -40px;
        }
        .legend {
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
    }
</style>
