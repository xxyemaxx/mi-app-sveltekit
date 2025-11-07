<script>
    // @ts-nocheck

    // --------------------------------------------------------------------------
    // 1. IMPORTACIÓN CRÍTICA: El componente de gráfico que acabas de crear.
    import PieChart from "$lib/components/PieChart.svelte";
    // --------------------------------------------------------------------------

    // Props requeridas para el componente
    export let selectedCanton = null; // El objeto del cantón seleccionado
    export let promedios = {}; // Los promedios nacionales
    export let onClose; // Función para cerrar el modal

    // --- Utilitarios ---
    const formatNumber = (num, decimals = 0) => {
        // Usa 'es-CR' para el formato de colones (₡)
        return new Intl.NumberFormat("es-CR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(num);
    };

    // Mapeo de claves para etiquetas legibles
    const gastosMapping = {
        vivienda: "Vivienda",
        alimentacion: "Alimentación",
        transporte: "Transporte",
        servicios: "Servicios",
        salud: "Salud",
        educacion: "Educación",
        comunicaciones: "Comunicaciones",
        ocio: "Ocio",
        cba_per_capita_regional: "Canasta Básica Alimentaria (CBA)", // Clave incluida en tu JSON
    };

    // Propiedad Reactiva: Prepara los datos de gastos para la lista y el gráfico
    $: pieData = selectedCanton
        ? Object.keys(selectedCanton.gastos)
              .filter((key) => selectedCanton.gastos[key] > 0)
              .map((key) => ({
                  label: gastosMapping[key] || key,
                  value: selectedCanton.gastos[key],
                  key: key, // Mantener la clave para la comparación
              }))
        : [];

    // Función para comparar con el promedio nacional
    function getComparisonText(gasto, key) {
        // Si el costo total, usamos la clave 'promedio_nacional' del objeto 'promedios'.
        // Si es un gasto, la clave es la misma (ej: 'vivienda').
        const promedioKey =
            key === "costo_total_estimado" ? "promedio_nacional" : key;
        const promedio = promedios[promedioKey] || 0;

        if (promedio === 0) return "";

        const diff = gasto - promedio;
        const percent = Math.abs(diff / promedio) * 100;

        if (diff > 0) {
            return ` (⬆️ ${formatNumber(percent, 1)}% más alto que el promedio nacional)`;
        } else if (diff < 0) {
            return ` (⬇️ ${formatNumber(percent, 1)}% más bajo que el promedio nacional)`;
        }
        return " (Igual al promedio nacional)";
    }
</script>

{#if selectedCanton}
    <div class="modal-backdrop" on:click={onClose}>
        <div class="modal-content" on:click|stopPropagation>
            <header class="modal-header">
                <button
                    class="close-button"
                    on:click={onClose}
                    aria-label="Cerrar detalles del cantón">×</button
                >

                <h1>Detalles de **{selectedCanton.canton_nombre}**</h1>
                <p class="subtitle">
                    Provincia de {selectedCanton.provincia_nombre} | Región {selectedCanton.region_nombre}
                </p>
            </header>

            <div class="summary-card">
                <span class="label">Costo Total Estimado (Mensual)</span>
                <span class="value"
                    >₡{formatNumber(selectedCanton.costo_total_estimado)}</span
                >
                <span class="comparison">
                    {getComparisonText(
                        selectedCanton.costo_total_estimado,
                        "costo_total_estimado",
                    )}
                </span>
            </div>

            <div class="main-content-layout">
                <section class="chart-section">
                    <h2>Desglose de Gastos</h2>
                    <div class="chart-container">
                        <PieChart data={pieData} />
                    </div>
                </section>

                <section class="details-section">
                    <h2>Detalles por Categoría</h2>
                    <ul class="details-list">
                        {#each pieData as item}
                            <li>
                                <strong>{item.label}:</strong> ₡{formatNumber(
                                    item.value,
                                )}
                                <small class="comparison-detail"
                                    >{getComparisonText(
                                        item.value,
                                        item.key,
                                    )}</small
                                >
                            </li>
                        {/each}

                        <li>
                            <strong
                                >{gastosMapping.cba_per_capita_regional}:</strong
                            >
                            ₡{formatNumber(
                                selectedCanton.cba_per_capita_regional,
                            )}
                            <small class="comparison-detail">
                                {getComparisonText(
                                    selectedCanton.cba_per_capita_regional,
                                    "cba_per_capita_regional",
                                )}
                            </small>
                        </li>
                    </ul>

                    <h2 class="mt-4">Otras Métricas</h2>
                    <ul class="details-list">
                        <li>
                            <strong>IDH (Simulado):</strong>
                            {selectedCanton.idh.toFixed(3)}
                        </li>
                        <li>
                            <strong>Población (Simulada):</strong>
                            {formatNumber(selectedCanton.poblacion)} habitantes
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
{/if}

<style>
    /* ------------------- Estilos del Modal ------------------- */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* Asegura que esté por encima de todo */
        backdrop-filter: blur(4px);
    }
    .modal-content {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 90%;
        width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }
    .close-button {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 2em;
        cursor: pointer;
        color: var(--text-color-light, #666);
        line-height: 1;
        padding: 5px;
        transition: color 0.2s;
    }
    .close-button:hover {
        color: var(--primary-color, #00796b);
    }

    /* ------------------- Estilos de Contenido ------------------- */
    .modal-header {
        border-bottom: 2px solid var(--border-color, #eee);
        padding-bottom: 20px;
        margin-bottom: 15px;
    }
    h1 {
        font-size: 2em;
        margin: 0;
    }
    .subtitle {
        color: var(--text-color-light, #666);
        font-size: 1em;
    }
    .summary-card {
        background-color: var(--card-bg, #f9f9f9);
        border-left: 5px solid var(--primary-color, #00796b);
        padding: 15px;
        margin-top: 15px;
        border-radius: 8px;
    }
    .summary-card .label {
        font-size: 0.9em;
        color: var(--text-color-light, #666);
    }
    .summary-card .value {
        font-size: 2.5em;
        font-weight: bold;
        display: block;
        margin: 5px 0;
    }
    .summary-card .comparison {
        font-size: 1em;
    }

    .main-content-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-top: 20px;
    }

    .chart-container {
        /* Asegura que el contenedor tenga la altura definida en PieChart.svelte */
        margin: 20px 0;
    }

    h2 {
        color: var(--primary-color, #00796b);
        border-bottom: 1px dashed var(--border-color, #ddd);
        padding-bottom: 5px;
    }

    .details-list {
        list-style: none;
        padding: 0;
        font-size: 0.95em;
    }
    .details-list li {
        padding: 10px 0;
        border-bottom: 1px dotted var(--border-color, #ddd);
        line-height: 1.4;
    }
    .details-list li:last-child {
        border-bottom: none;
    }
    .details-list strong {
        display: inline-block;
        min-width: 150px;
    }
    .comparison-detail {
        font-size: 0.9em;
        color: var(--text-color-light, #666);
    }

    @media (max-width: 768px) {
        .main-content-layout {
            grid-template-columns: 1fr;
        }
        .modal-content {
            padding: 20px;
            width: 95%;
        }
    }
</style>
