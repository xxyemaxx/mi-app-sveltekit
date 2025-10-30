<script>
    // @ts-nocheck
    import { scaleLinear } from "d3-scale";
    import { max } from "d3-array";

    // Propiedades originales
    export let data = [];
    export let categoria = "costo_total_estimado";
    export let promedios = {};

    // PROPIEDAD CLAVE AÑADIDA: Una función que le dice al gráfico cómo obtener el valor.
    export let valueAccessor;

    const height = 200;
    const margin = { top: 10, right: 10, bottom: 30, left: 100 };
    const width = 600;

    // --- Lógica Reactiva ---

    // Obtener valores para el gráfico usando el valueAccessor
    $: valores = data.map((d) => ({
        nombre: d.nombre_comparacion || d.canton || d.provincia,
        valor: valueAccessor(d), // USA LA FUNCIÓN PARA OBTENER EL VALOR
        isPromedio: d.provincia === d.canton, // Marcador para promedios de provincia
    }));

    // Determinar el valor máximo para la escala (incluyendo el promedio nacional si existe)
    $: maxDataValue = max(valores, (d) => d.valor);
    $: maxNationalValue = promedios[categoria] || promedios.nacional || 0;
    $: maxValue = Math.max(maxDataValue * 1.15, maxNationalValue * 1.15);

    // Escala X
    $: xScale = scaleLinear()
        .domain([0, maxValue])
        .range([0, width - margin.left - margin.right]);

    // Formato de moneda para etiquetas
    function formatCurrency(num) {
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }

    // Obtener la etiqueta de la categoría seleccionada (para la línea de promedio)
    $: categoriaKey = categoria;
    $: promedioNacional = promedios[categoriaKey] || promedios.nacional;
</script>

<div class="comparison-chart-container">
    <svg viewBox="0 0 {width} {height}" class="chart-svg">
        <g transform="translate({margin.left}, {margin.top})">
            {#each valores as item, i}
                <g
                    class="bar-group"
                    transform="translate(0, {((height -
                        margin.top -
                        margin.bottom) /
                        data.length) *
                        i})"
                >
                    <rect
                        x={0}
                        y={0}
                        width={xScale(item.valor)}
                        height={(height - margin.top - margin.bottom) /
                            data.length -
                            10}
                        class="bar-rect"
                        class:is-promedio={item.isPromedio}
                    />

                    <text
                        x={xScale(item.valor) + 5}
                        y={(height - margin.top - margin.bottom) /
                            data.length /
                            2}
                        alignment-baseline="middle"
                        class="bar-value-label"
                    >
                        {formatCurrency(item.valor)}
                    </text>

                    <text
                        x={-10}
                        y={(height - margin.top - margin.bottom) /
                            data.length /
                            2}
                        alignment-baseline="middle"
                        text-anchor="end"
                        class="bar-label"
                    >
                        {item.nombre}
                    </text>
                </g>
            {/each}

            {#if promedioNacional && promedioNacional > 0}
                <line
                    x1={xScale(promedioNacional)}
                    y1={0}
                    x2={xScale(promedioNacional)}
                    y2={height - margin.top - margin.bottom}
                    class="average-line"
                />
                <text
                    x={xScale(promedioNacional)}
                    y={height - margin.top - margin.bottom + 5}
                    text-anchor="middle"
                    class="average-label"
                >
                    Promedio Nacional
                </text>
            {/if}

            <line
                x1={0}
                y1={height - margin.top - margin.bottom}
                x2={width - margin.left - margin.right}
                y2={height - margin.top - margin.bottom}
                stroke="#ccc"
            />
        </g>
    </svg>
</div>

<style>
    .comparison-chart-container {
        font-family: Arial, sans-serif;
        margin-top: 20px;
        overflow: hidden;
    }
    .chart-svg {
        width: 100%;
        height: 100%;
        display: block;
    }
    .bar-rect {
        fill: var(--color-secondary, #007bff);
        height: 30px; /* Tamaño por defecto de las barras */
        border-radius: 4px;
        transition: all 0.5s ease-out;
    }
    .bar-rect.is-promedio {
        fill: var(--color-accent, #ffc107);
    }
    .bar-group:hover .bar-rect {
        opacity: 0.8;
    }
    .bar-label {
        font-size: 0.8em;
        font-weight: 600;
        fill: var(--text-color, #333);
        max-width: 100px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .bar-value-label {
        font-size: 0.8em;
        fill: var(--text-color, #333);
        font-weight: 500;
    }
    .average-line {
        stroke: #dc3545;
        stroke-width: 2px;
        stroke-dasharray: 4 4;
    }
    .average-label {
        font-size: 0.7em;
        fill: #dc3545;
        font-weight: 700;
    }
</style>
