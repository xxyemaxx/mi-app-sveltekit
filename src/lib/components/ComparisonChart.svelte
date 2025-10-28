<script>
    // @ts-nocheck

    /**
     * @typedef {Object} ComparisonZone
     * @property {string} nombre_comparacion - Nombre de la zona o provincia (Ej: San José, Heredia Centro, Heredia)
     * @property {number} costo_total_estimado - El costo total de la zona
     * @property {Object.<string, number>} gastos - Objeto con el desglose de gastos (vivienda, alimentacion, etc.)
     *
     * @type {ComparisonZone[]}
     */
    export let data = [];

    /** @type {string} */
    export let categoria = ""; // Clave del gasto a mostrar (vivienda, alimentacion, etc.)

    // Mapeo de claves a nombres legibles para la visualización
    const categoriaLabels = {
        vivienda: "Vivienda",
        alimentacion: "Alimentación",
        transporte: "Transporte",
        servicios: "Servicios",
        ocio: "Ocio",
        salud: "Salud",
        educacion: "Educación",
        comunicaciones: "Comunicaciones",
    };

    const keysDeGasto = [
        "vivienda",
        "alimentacion",
        "transporte",
        "servicios",
        "ocio",
        "salud",
        "educacion",
        "comunicaciones",
    ];

    // Función de formato para números (igual que en +page.svelte)
    const safeFormat = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    // ====================================================================
    // LÓGICA DE DATOS PARA LA TABLA/GRÁFICO
    // ====================================================================

    $: zona1 = data[0] || null;
    $: zona2 = data[1] || null;

    // Prepara los datos para la comparación
    $: datosComparacion = (() => {
        if (!zona1 || !zona2) return [];

        let resultado = [];
        const categoriasAComparar = categoria ? [categoria] : keysDeGasto;

        categoriasAComparar.forEach((key) => {
            const valor1 = zona1.gastos?.[key] || 0;
            const valor2 = zona2.gastos?.[key] || 0;

            if (valor1 > 0 || valor2 > 0) {
                resultado.push({
                    rubro: categoriaLabels[key] || key,
                    key: key,
                    valor1: valor1,
                    valor2: valor2,
                    diferencia: valor1 - valor2,
                });
            }
        });

        // Si es una categoría específica, ordenamos por esa categoría
        if (categoria) {
            return resultado;
        }

        // Si son todas, ordenamos por el promedio (solo si es la vista de desglose completo)
        return resultado.sort(
            (a, b) => b.valor1 + b.valor2 - (a.valor1 + a.valor2),
        );
    })();

    // Calcula el valor máximo para normalizar las barras de la simulación
    $: maxValor = datosComparacion.reduce((max, item) => {
        return Math.max(max, item.valor1, item.valor2);
    }, 0);

    // Etiqueta del título basada en la selección
    $: titulo = categoria
        ? `Comparación en ${categoriaLabels[categoria]}`
        : "Desglose Completo de Gastos";
</script>

<div class="comparison-chart-container">
    <h3 class="chart-title">{titulo}</h3>

    <div class="legend">
        <span class="legend-item zone-a-name">
            <span class="color-swatch a"></span>
            {zona1 ? zona1.nombre_comparacion : "Zona A"}
        </span>
        <span class="legend-item zone-b-name">
            <span class="color-swatch b"></span>
            {zona2 ? zona2.nombre_comparacion : "Zona B"}
        </span>
    </div>

    {#if datosComparacion.length > 0}
        <div class="data-grid">
            <div class="grid-header">
                <div class="rubro-col">Rubro</div>
                <div class="value-col">
                    {zona1.nombre_comparacion}
                </div>
                <div class="bar-col">Visualización</div>
                <div class="value-col">
                    {zona2.nombre_comparacion}
                </div>
                <div class="diff-col">Diferencia (A-B)</div>
            </div>

            {#each datosComparacion as item (item.key)}
                <div class="grid-row">
                    <div class="rubro-col">
                        <strong>{item.rubro}</strong>
                    </div>

                    <div class="value-col value-a">
                        ₡{safeFormat(item.valor1)}
                    </div>

                    <div class="bar-col">
                        <div class="bar-container">
                            <div
                                class="bar bar-a"
                                style="width: {(item.valor1 / maxValor) * 100}%"
                                title="{item.rubro} A: ₡{safeFormat(
                                    item.valor1,
                                )}"
                            ></div>
                            <div
                                class="bar bar-b"
                                style="width: {(item.valor2 / maxValor) * 100}%"
                                title="{item.rubro} B: ₡{safeFormat(
                                    item.valor2,
                                )}"
                            ></div>
                        </div>
                    </div>

                    <div class="value-col value-b">
                        ₡{safeFormat(item.valor2)}
                    </div>

                    <div
                        class="diff-col"
                        class:positive={item.diferencia > 0}
                        class:negative={item.diferencia < 0}
                    >
                        {item.diferencia > 0
                            ? "⬆️"
                            : item.diferencia < 0
                              ? "⬇️"
                              : "➖"}
                        ₡{safeFormat(Math.abs(item.diferencia))}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="no-data-msg">
            Seleccione dos zonas o provincias válidas para realizar una
            comparación.
        </p>
    {/if}
</div>

<style>
    /* ---------------------------------------------------------------------- */
    /* HEREDA VARIABLES DE TEMA DEL PADRE (+page.svelte) */
    /* ---------------------------------------------------------------------- */

    .comparison-chart-container {
        padding: 20px;
        background: var(--card-bg-color);
        border-radius: 8px;
        margin-top: 20px;
        box-shadow: 0 4px 10px var(--shadow-color);
    }

    .chart-title {
        text-align: center;
        color: var(--color-primary);
        margin-bottom: 25px;
        font-size: 1.4em;
        font-weight: 700;
    }

    /* Leyenda */
    .legend {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-bottom: 20px;
        font-size: 0.9em;
    }
    .legend-item {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: var(--text-color);
    }
    .color-swatch {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        margin-right: 8px;
    }
    .color-swatch.a {
        background-color: var(--color-zone-a);
    }
    .color-swatch.b {
        background-color: var(--color-zone-b);
    }

    /* ---------------------------------------------------------------------- */
    /* ESTRUCTURA DE LA TABLA/GRID DE COMPARACIÓN */
    /* ---------------------------------------------------------------------- */

    .data-grid {
        display: grid;
        /* Definición de Columnas: Rubro | Valor A | Barra | Valor B | Diferencia */
        grid-template-columns: 1.5fr 1fr 2.5fr 1fr 1.2fr;
        font-size: 0.9em;
        text-align: center;
    }

    .grid-header,
    .grid-row {
        display: contents; /* Permite que los hijos se coloquen directamente en las celdas del grid */
    }

    .grid-header {
        font-weight: 700;
        text-transform: uppercase;
        background-color: var(--header-bg-color);
        color: white;
        padding: 8px 0;
        border-radius: 4px 4px 0 0;
        font-size: 0.75em;
    }
    .grid-header > div {
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .grid-row > div {
        padding: 10px 10px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        word-break: break-word; /* Para nombres largos */
    }
    .grid-row:nth-child(even) > div {
        background-color: var(--hover-row-bg); /* Zebra striping */
    }

    .rubro-col {
        justify-content: flex-start !important;
        font-weight: 600;
        padding-left: 20px !important;
    }
    .value-col {
        font-weight: 500;
    }

    /* ---------------------------------------------------------------------- */
    /* ESTILOS DE BARRA SIMULADA */
    /* ---------------------------------------------------------------------- */
    .bar-col {
        padding: 5px 10px !important;
    }
    .bar-container {
        width: 100%;
        height: 35px; /* Altura fija para el contenedor de las dos barras */
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding: 3px 0;
    }
    .bar {
        height: 12px;
        border-radius: 3px;
        transition: width 0.5s ease-out;
    }
    .bar-a {
        background-color: var(--color-zone-a);
        margin-bottom: 2px;
    }
    .bar-b {
        background-color: var(--color-zone-b);
    }

    /* ---------------------------------------------------------------------- */
    /* ESTILOS DE DIFERENCIA */
    /* ---------------------------------------------------------------------- */
    .diff-col {
        font-weight: 700;
        font-size: 1em;
    }
    .diff-col.positive {
        color: #dc3545; /* Rojo para A > B */
    }
    .diff-col.negative {
        color: var(--color-secondary); /* Verde para A < B */
    }

    .no-data-msg {
        text-align: center;
        padding: 30px;
        color: #6c757d;
        font-style: italic;
    }
</style>
