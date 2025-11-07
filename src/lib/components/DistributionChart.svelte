<script>
    // @ts-nocheck

    // Propiedades que recibe el componente desde +page.svelte
    // Ahora recibimos el objeto de cantón completo (data = { ...cantonData... })
    export let data = {};
    export let theme = "light"; // Recibimos el tema

    // 1. Paleta de colores y etiquetas para cada rubro de costo
    const COLOR_PALETTE = {
        vivienda: { label: "Vivienda", color: "#007bff" }, // Azul
        alimentacion: { label: "Alimentación", color: "#28a745" }, // Verde
        transporte: { label: "Transporte", color: "#ffc107" }, // Amarillo
        servicios: { label: "Servicios", color: "#dc3545" }, // Rojo
        salud: { label: "Salud", color: "#6f42c1" }, // Morado
        educacion: { label: "Educación", color: "#17a2b8" }, // Cian
        comunicaciones: { label: "Comunicaciones", color: "#fd7e14" }, // Naranja
        ocio: { label: "Ocio", color: "#e83e8c" }, // Rosa
    };

    // 2. Cálculo Reactivo de los datos de la distribución
    $: totalCosto = data?.costo_total_estimado || 0;

    $: distributionData = (() => {
        if (!data || !data.gastos || totalCosto === 0) return [];

        // Mapear los gastos y calcular el porcentaje
        return (
            Object.keys(data.gastos)
                .map((key) => {
                    const value = data.gastos[key] || 0;
                    const percentage = (value / totalCosto) * 100;
                    const { label, color } = COLOR_PALETTE[key] || {
                        label: key,
                        color: "#6c757d",
                    };
                    return {
                        key,
                        label,
                        value,
                        percentage: Math.min(percentage, 100), // Evitar más del 100%
                        color,
                    };
                })
                // Opcional: Filtrar rubros con valor cero para limpiar la visualización
                .filter((item) => item.value > 0)
                .sort((a, b) => b.value - a.value)
        ); // Ordenar de mayor a menor gasto
    })();

    // 3. Función de utilidad para formatear el valor
    function formatCurrency(value) {
        return `₡${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(value)}`;
    }
</script>

<div class="distribution-chart-container">
    {#if distributionData.length > 0}
        <div class="chart-grid">
            <div class="header-row">
                <span class="rubro-name">Rubro</span>
                <span class="bar-area">Distribución del Gasto</span>
                <span class="rubro-value">Valor / %</span>
            </div>

            {#each distributionData as rubro (rubro.key)}
                <div class="data-row">
                    <span class="rubro-name">{rubro.label}</span>
                    <span class="bar-area">
                        <div
                            class="bar"
                            style="width: {rubro.percentage.toFixed(
                                1,
                            )}%; background-color: {rubro.color};"
                            title="{rubro.percentage.toFixed(
                                1,
                            )}% ({formatCurrency(rubro.value)})"
                        ></div>
                    </span>
                    <span class="rubro-value">
                        {formatCurrency(rubro.value)}
                        ({rubro.percentage.toFixed(1)}%)
                    </span>
                </div>
            {/each}
        </div>
    {:else}
        <div class="no-data">
            No hay datos de gastos disponibles para el cantón seleccionado.
        </div>
    {/if}
</div>

<style>
    /* Estilo del contenedor principal */
    .distribution-chart-container {
        padding: 10px;
    }

    /* Grid que organiza Rubro | Barra | Valor */
    .chart-grid {
        display: grid;
        /* Define 3 columnas: Nombre (1.2fr), Barra (3fr), Valor/Porcentaje (1fr) */
        grid-template-columns: 1.2fr 3fr 1fr;
        gap: 10px 15px; /* Separación entre filas y columnas */
        align-items: center;
    }

    /* Estilo del encabezado */
    .header-row {
        font-weight: bold;
        color: var(--color-primary);
        padding-bottom: 5px;
        border-bottom: 2px solid var(--border-color);
        display: contents; /* Permite que los spans se alineen directamente en el grid */
    }
    .header-row span {
        padding-top: 10px;
    }

    /* Estilo de la fila de datos */
    .data-row {
        display: contents; /* Permite que los spans se alineen directamente en el grid */
        padding: 5px 0;
    }

    /* Nombre del rubro (ej. Vivienda, Alimentación) */
    .rubro-name {
        font-weight: 600;
        text-align: right;
        font-size: 0.95em;
        color: var(--text-color);
        white-space: nowrap;
    }

    /* Contenedor de la barra (el fondo gris/claro) */
    .bar-area {
        height: 18px;
        background-color: var(
            --border-color
        ); /* Usamos la variable de borde para el fondo */
        border-radius: 4px;
        overflow: hidden;
        box-shadow: inset 0 1px 3px var(--shadow-color);
    }
    /* La barra de color que indica el valor */
    .bar {
        height: 100%;
        transition: width 0.5s ease;
    }

    /* Valor y Porcentaje */
    .rubro-value {
        font-size: 0.85em;
        font-weight: 700;
        text-align: left;
        /* Usamos el color primario para el texto si no es el color de la barra */
        color: var(--color-primary);
        white-space: nowrap;
    }

    /* Mensaje de no data */
    .no-data {
        text-align: center;
        padding: 20px;
        font-style: italic;
        color: var(--text-color);
    }

    /* Media Query Responsive */
    @media (max-width: 768px) {
        .chart-grid {
            /* En móvil, apilamos el nombre y la barra/valor juntos */
            grid-template-columns: 1.5fr 1fr;
        }

        .header-row span:nth-child(2) {
            /* Ocultamos la columna de "Distribución del Gasto" */
            display: none;
        }

        .rubro-name {
            /* Alineación a la izquierda */
            text-align: left;
        }

        .bar-area {
            /* Permitimos que la barra y el valor compartan la columna 2 */
            display: none;
        }

        .data-row {
            /* Hacemos que la fila se comporte de nuevo como grid para 2 columnas */
            grid-template-columns: 1.5fr 1fr;
            padding: 10px 0;
            border-bottom: 1px dotted var(--border-color);
        }
    }
</style>
