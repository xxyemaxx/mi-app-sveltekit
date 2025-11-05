<script>
    // @ts-nocheck
    import { getContext } from "svelte";
    import DistributionChart from "./DistributionChart.svelte";

    // Propiedades que recibe el componente desde +page.svelte
    export let isModalVisible = false; // Controla si el modal está visible
    export let canton = {}; // Datos completos del cantón
    export let onClose = () => {}; // Función para cerrar el modal

    // Obtener el tema del contexto (para el gráfico)
    const { theme } = getContext("theme");

    // --- Utilidades de Formato ---

    // Formato de números (moneda)
    function formatMoney(num) {
        if (typeof num !== "number" || isNaN(num)) return "-";
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }

    // Formato de números (población)
    function formatPoblacion(num) {
        if (typeof num !== "number" || isNaN(num)) return "-";
        return num.toLocaleString("es-CR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }

    // Estilo de IDH
    function getIDHStyle(idh) {
        if (idh >= 0.8) return "color: #00a300;";
        if (idh >= 0.7) return "color: #ffc107;";
        return "color: #ff6347;";
    }
</script>

{#if isModalVisible}
    <div class="modal-overlay" on:click={onClose}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h3>{canton.cantón} ({canton.provincia})</h3>
                <button on:click={onClose} aria-label="Cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="metadata-summary">
                <div class="summary-item total-costo">
                    <h4>Costo Total Estimado</h4>
                    <span class="value-costo">
                        {formatMoney(canton.costo_total_estimado)}
                    </span>
                </div>
                <div class="summary-item idh-value">
                    <h4>Índice de Desarrollo Humano (IDH)</h4>
                    <span class="value-idh" style={getIDHStyle(canton.idh)}>
                        {canton.idh?.toFixed(3) || "-"}
                    </span>
                </div>
            </div>

            <div class="metadata-details">
                <p>
                    <strong>Población:</strong>
                    {formatPoblacion(canton.poblacion)}
                </p>
                <p><strong>Región INEC:</strong> {canton.region_inec}</p>
                <p>
                    <strong>CBA Per Cápita Regional:</strong>
                    {formatMoney(canton.cba_per_capita_regional)}
                </p>
            </div>

            <div class="chart-section">
                <h4>Distribución de Gastos</h4>
                <DistributionChart data={canton} {theme} />
            </div>
        </div>
    </div>
{/if}

<style>
    /* 1. Overlay (Fondo oscuro) */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s;
    }

    /* 2. Contenido del Modal (La tarjeta blanca/oscura) */
    .modal-content {
        background: var(--card-background);
        border: 2px solid var(--color-primary);
        border-radius: 12px;
        box-shadow: 0 8px 30px var(--shadow-color);
        padding: 25px;
        width: 90%;
        max-width: 600px; /* Ancho máximo para el modal */
        max-height: 90vh; /* Altura máxima para el contenido */
        overflow-y: auto; /* Scroll si el contenido es muy largo */
        position: relative;
        transform: translateY(0);
        transition:
            transform 0.3s,
            opacity 0.3s;
    }

    /* 3. Encabezado */
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--border-color);
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.5em;
        color: var(--color-secondary);
    }

    .modal-header button {
        background: none;
        border: none;
        color: var(--text-color);
        font-size: 1.5em;
        cursor: pointer;
        padding: 5px;
        transition: color 0.2s;
    }

    .modal-header button:hover {
        color: #dc3545; /* Rojo para el botón de cerrar */
    }

    /* 4. Resumen de datos */
    .metadata-summary {
        display: flex;
        justify-content: space-around;
        gap: 20px;
        margin-bottom: 20px;
        text-align: center;
    }

    .summary-item {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        background: var(--background-color);
    }

    .summary-item h4 {
        margin: 0;
        font-size: 0.9em;
        color: var(--text-color);
        opacity: 0.7;
    }

    .summary-item span {
        display: block;
        font-size: 1.4em;
        font-weight: 700;
        margin-top: 5px;
    }

    .value-costo {
        color: #00a300;
    }

    /* 5. Detalles y Gráfico */
    .metadata-details p {
        margin: 5px 0;
        font-size: 1em;
        color: var(--text-color);
    }

    .chart-section {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px dashed var(--border-color);
    }

    .chart-section h4 {
        font-size: 1.1em;
        color: var(--color-primary);
        margin-bottom: 15px;
        text-align: center;
    }

    /* Media Queries */
    @media (max-width: 500px) {
        .modal-content {
            padding: 15px;
        }
        .modal-header h3 {
            font-size: 1.3em;
        }
        .metadata-summary {
            flex-direction: column;
            gap: 10px;
        }
    }
</style>
