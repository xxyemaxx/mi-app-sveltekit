<script>
    // @ts-nocheck
    import { scaleLinear } from "d3-scale";
    import { max } from "d3-array";
    import { getContext } from "svelte";

    // Propiedades
    export let data = []; // Array de cantones a comparar (1 o 2 elementos)
    export let category = "costo_total_estimado"; // Ej: 'costo_total_estimado' o 'gastos.vivienda'
    export let promedios = {}; // Promedios nacionales/regionales

    // Acceso al tema (dark/light mode)
    const { theme } = getContext("theme");

    // Configuración SVG/Gráfico
    const height = 200;
    // Más espacio a la izquierda para las etiquetas de los cantones
    const margin = { top: 10, right: 10, bottom: 30, left: 130 };
    const width = 600;

    // Función auxiliar para obtener valores anidados (ej: 'gastos.vivienda')
    function getNestedValue(obj, path) {
        if (!obj) return 0;
        const parts = path.split(".");
        let current = obj;
        for (const part of parts) {
            if (current[part] === undefined) return 0;
            current = current[part];
        }
        return typeof current === "number" ? current : 0;
    }

    // Función de formato de moneda
    function formatNumber(num) {
        if (typeof num !== "number") return "-";
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }

    // --- Lógica Reactiva ($: ) ---

    // 1. Obtener valores para los cantones y formatear datos
    $: valoresCantones = data.map((d) => ({
        nombre: d.cantón,
        valor: getNestedValue(d, category), // Usa la función auxiliar
        isPromedio: false,
        provincia: d.provincia,
    }));

    // 2. Determinar el valor del promedio nacional/regional (si existe)
    $: promedioValue = promedios[category] || 0;
    $: promedioData = {
        nombre: "Promedio Nacional",
        valor: promedioValue,
        isPromedio: true,
        provincia: "",
    };

    // 3. Combinar datos de cantones con el promedio (si se muestran)
    $: combinedData =
        promedioValue > 0
            ? [...valoresCantones, promedioData]
            : valoresCantones;

    // 4. Determinar el valor máximo para la escala (incluyendo el promedio nacional si existe)
    $: maxDataValue = max(combinedData, (d) => d.valor) || 0;
    // Asegurar que el eje X se extienda al menos un 15% más allá del valor máximo
    $: maxValue = maxDataValue * 1.15;

    // 5. Crear la escala D3
    $: xScale = scaleLinear()
        .domain([0, maxValue])
        .range([0, width - margin.left - margin.right]);

    // 6. Configurar la altura de la banda de cada barra (para que el gráfico sea responsivo en Y)
    $: barBandHeight =
        (height - margin.top - margin.bottom) / combinedData.length;
    $: barPadding = 10; // Espacio entre barras
    $: barHeight = Math.min(30, barBandHeight - barPadding); // Altura máxima de 30px
    $: barOffset = (barBandHeight - barHeight) / 2; // Offset para centrar la barra
</script>

<div class="comparison-chart-container">
    <svg viewBox="0 0 {width} {height}" class="chart-svg">
        <g transform="translate({margin.left}, {margin.top})">
            <!-- Barras del gráfico y Etiquetas -->
            {#each combinedData as item, i}
                <g
                    class="bar-group"
                    transform="translate(0, {i * barBandHeight})"
                >
                    <!-- Rectángulo de la barra -->
                    <rect
                        class="bar-rect"
                        class:is-promedio={item.isPromedio}
                        x={0}
                        y={barOffset}
                        width={xScale(item.valor)}
                        height={barHeight}
                        ry={4}
                    />

                    <!-- Etiqueta del Cantón (Eje Y) -->
                    <text
                        class="bar-label y-label"
                        x={-10}
                        y={barOffset + barHeight / 2}
                        dominant-baseline="middle"
                        text-anchor="end"
                    >
                        {item.nombre}
                    </text>

                    <!-- Etiqueta del Valor (dentro de la barra) -->
                    <text
                        class="bar-label value-label"
                        x={xScale(item.valor) + 10}
                        y={barOffset + barHeight / 2}
                        dominant-baseline="middle"
                        text-anchor="start"
                    >
                        {formatNumber(item.valor)}
                    </text>
                </g>
            {/each}

            <!-- Etiqueta del Eje X: Cero -->
            <text
                class="axis-label"
                x={0}
                y={height - margin.top - margin.bottom + 20}
                text-anchor="start"
            >
                {formatNumber(0)}
            </text>

            <!-- Linea del Eje X -->
            <line
                x1={0}
                y1={height - margin.top - margin.bottom}
                x2={width - margin.left - margin.right}
                y2={height - margin.top - margin.bottom}
                stroke="var(--border-color)"
            />
        </g>
    </svg>
</div>

<style>
    .comparison-chart-container {
        font-family: "Inter", sans-serif;
        margin-top: 20px;
        overflow: hidden;
        border-radius: 8px;
        background-color: var(--background-color);
    }
    .chart-svg {
        width: 100%;
        height: 100%;
        display: block;
        min-height: 200px;
    }
    .bar-rect {
        /* Color principal para las barras de cantones */
        fill: var(--color-secondary, #007bff);
        transition: all 0.5s ease-out;
    }
    .bar-rect.is-promedio {
        /* Color distintivo para el promedio nacional */
        fill: var(--color-accent, #ffc107);
    }
    .bar-group:hover .bar-rect {
        opacity: 0.9;
    }
    .bar-label {
        font-size: 0.85em;
        font-weight: 500;
        fill: var(--text-color, #333);
    }
    .y-label {
        /* Etiquetas del eje Y (nombres de cantones) */
        fill: var(--text-color);
        font-weight: 600;
    }
    .value-label {
        /* Etiquetas de valor dentro/al lado de las barras */
        fill: var(--text-color);
        font-weight: 700;
    }
    .axis-label {
        font-size: 0.75em;
        fill: var(--text-color);
        opacity: 0.7;
    }
</style>
