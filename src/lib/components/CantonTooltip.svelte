<script>
    // @ts-nocheck
    import { getContext } from "svelte";
    import DistributionChart from "./DistributionChart.svelte"; // Reutilizamos el gráfico de pastel

    export let zona; // Datos del cantón actual
    export let tooltipX; // Posición X del ratón
    export let tooltipY; // Posición Y del ratón

    // Obtener el tema del contexto (para el gráfico)
    const { theme } = getContext("theme");

    // Formateo de números
    function formatNumber(num) {
        if (typeof num !== "number" || isNaN(num)) return "-";
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }
</script>

<div
    class="tooltip-container"
    style="left: {tooltipX + 15}px; top: {tooltipY - 10}px;"
>
    <div class="header-info">
        <h3>{zona.cantón} ({zona.provincia})</h3>
        <span class="total-costo"
            >{formatNumber(zona.costo_total_estimado)}</span
        >
    </div>

    <div class="metadata">
        <p><strong>Región:</strong> {zona.region_inec}</p>
        <p>
            <strong>Población (Estimada):</strong>
            {zona.poblacion.toLocaleString("es-CR")}
        </p>
        <p>
            <strong>Índice de Desarrollo Humano (IDH):</strong>
            <span class="idh-value" style="--idh-color: {zona.color_idh}"
                >{zona.idh.toFixed(3)}</span
            >
        </p>
    </div>

    <div class="chart-wrapper">
        <h4>Distribución de Gastos</h4>
        <div class="mini-chart">
            <DistributionChart data={zona} size={150} {theme} />
        </div>
    </div>
</div>

<style>
    .tooltip-container {
        position: fixed;
        width: 300px;
        background: var(--card-background);
        border: 2px solid var(--color-primary);
        border-radius: 12px;
        box-shadow: 0 8px 16px var(--shadow-color);
        padding: 15px;
        z-index: 100;
        pointer-events: none; /* Ignorar clicks para que no interfiera con la tabla */
        transition: opacity 0.1s;
    }

    .header-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid var(--border-color);
    }

    .header-info h3 {
        margin: 0;
        font-size: 1.2em;
        color: var(--color-secondary);
    }

    .total-costo {
        font-weight: bold;
        color: var(--color-primary);
        font-size: 1.1em;
    }

    .metadata p {
        margin: 4px 0;
        font-size: 0.9em;
    }

    .idh-value {
        font-weight: bold;
        color: var(--idh-color);
    }

    .chart-wrapper {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid var(--border-color);
        text-align: center;
    }

    .chart-wrapper h4 {
        margin: 0 0 10px 0;
        font-size: 1em;
        color: var(--text-color);
    }

    .mini-chart :global(svg) {
        margin: 0 auto;
        display: block;
    }
</style>
