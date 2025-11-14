<script>
    // @ts-nocheck

    // Importaciones existentes
    import { user } from "$lib/stores/authStore";
    import {
        saveComparison,
        loadComparisons,
        deleteComparison,
    } from "$lib/firebase/db";
    import { onMount, getContext } from "svelte";

    // 💡 Importar el history store para la reactividad
    import {
        comparisonSaveEvent,
        notifyComparisonSaved,
    } from "$lib/stores/historyStore";

    // 1. VARIABLES REACTIVAS DEL CONTEXTO
    const comparisonContext = getContext("comparisonData");
    $: zonasParaComparar = comparisonContext?.zonasParaComparar || [];
    $: categoriaComparacion =
        comparisonContext?.categoriaComparacion || "costo_total_estimado";

    // 2. ESTADO LOCAL Y REACTIVIDAD
    let savedComparisons = [];
    let statusMessage = "";
    let isLoading = false;
    let isLoadingHistory = false; // Estado de carga para el historial

    // Solo se puede guardar si hay 1 o más zonas seleccionadas Y el usuario está logueado
    $: canSave = zonasParaComparar.length > 0 && $user;

    // --- Lógica de Carga y Reactividad del Historial ---

    // Función principal para cargar el historial desde Firestore
    async function fetchComparisons() {
        if (!$user?.uid) {
            savedComparisons = []; // Limpiar si no hay usuario logueado
            return;
        }

        isLoadingHistory = true;
        try {
            // 🚨 USAMOS $user.uid para cargar solo las comparaciones de este usuario
            const data = await loadComparisons($user.uid);
            savedComparisons = data;
        } catch (error) {
            console.error("Error al cargar comparaciones:", error);
            statusMessage = "Error al cargar el historial.";
        } finally {
            isLoadingHistory = false;
        }
    }

    // 🚨 Reactividad: Recargar historial cuando cambia el usuario ($user) o se dispara un evento de guardado ($comparisonSaveEvent)
    // Esto asegura que la lista se actualice después de un login, logout, save o delete.
    $: if ($user || $comparisonSaveEvent) {
        fetchComparisons();
    }

    // --- 3. Lógica de Guardar Comparación ---

    async function handleSaveComparison() {
        if (!canSave || isLoading) return;

        isLoading = true;
        statusMessage = "Guardando comparación...";

        // Objeto de la comparación a guardar
        const comparisonData = {
            // Mapeamos las zonas a un formato simple
            zonas: zonasParaComparar.map((zona) => ({
                provincia: zona.provincia,
                canton: zona.canton,
            })),
            // Guardamos la categoría de la comparación
            category: categoriaComparacion,
        };

        try {
            // 🚨 Llamamos a la función de Firebase/Firestore
            const success = await saveComparison($user.uid, comparisonData);
            if (success) {
                statusMessage = "¡Comparación guardada con éxito!";
                // 💡 Notificar al store de historia para forzar una recarga
                notifyComparisonSaved();
            } else {
                statusMessage = "No se pudo guardar la comparación.";
            }
        } catch (error) {
            console.error("Error al guardar:", error);
            statusMessage = "Ocurrió un error inesperado al guardar.";
        } finally {
            isLoading = false;
            setTimeout(() => {
                statusMessage = "";
            }, 3000);
        }
    }

    // --- 4. Lógica de Eliminar Comparación ---

    async function handleDelete(id) {
        if (isLoading) return;

        isLoading = true;
        statusMessage = "Eliminando comparación...";

        try {
            const success = await deleteComparison(id);
            if (success) {
                statusMessage = "Comparación eliminada.";
                // 💡 Notificar al store de historia para forzar una recarga
                notifyComparisonSaved();
            } else {
                statusMessage = "No se pudo eliminar.";
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            statusMessage = "Ocurrió un error inesperado al eliminar.";
        } finally {
            isLoading = false;
            setTimeout(() => {
                statusMessage = "";
            }, 3000);
        }
    }
</script>

<div class="comparisons-container">
    <div class="current-comparison">
        <button
            class="save-btn"
            on:click={handleSaveComparison}
            disabled={!canSave || isLoading}
        >
            <i class="fas fa-save"></i>
            Guardar Comparación Actual ({zonasParaComparar.length} Zonas)
            {#if isLoading}{/if}
        </button>
        {#if statusMessage}
            <p class="status-message">{statusMessage}</p>
        {/if}
    </div>

    <div class="history-section">
        <h3>Historial</h3>

        {#if !$user}
            <p class="status-message">
                Debes iniciar sesión para ver tu historial.
            </p>
        {:else if isLoadingHistory}
            <p class="status-message">Cargando historial...</p>
        {:else if savedComparisons.length === 0}
            <p class="status-message">No hay comparaciones guardadas.</p>
        {:else}
            <ul class="comparison-list">
                {#each savedComparisons as comp (comp.id)}
                    <li class="comparison-item">
                        <div class="comparison-details">
                            {#each comp.zonas as zona, i}
                                <span class="comparison-item-name">
                                    {zona.provincia} - {zona.canton}
                                </span>
                                {#if i < comp.zonas.length - 1}
                                    <span class="separator-vs-mini">vs</span>
                                {/if}
                            {/each}
                            <span class="category-tag"
                                >{comp.category.replace(/_/g, " ")}</span
                            >
                            <span class="timestamp"
                                >{new Date(
                                    comp.timestamp,
                                ).toLocaleDateString()}</span
                            >
                        </div>
                        <div class="comparison-actions">
                            <button
                                class="delete-btn"
                                on:click={() => handleDelete(comp.id)}
                                disabled={isLoading}
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
    /* ... Tus estilos existentes ... */

    /* Estilos del botón Guardar */
    .save-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 10px 15px;
        background-color: var(
            --color-accent,
            #10b981
        ); /* Color verde que usas */
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.3s;
        margin-bottom: 15px;
    }
    .save-btn i {
        margin-right: 8px;
    }
    .save-btn:hover:not(:disabled) {
        background-color: #0d9475;
    }
    .save-btn:disabled {
        background-color: var(--border-color, #e5e7eb);
        color: var(--text-color-light, #666);
        cursor: not-allowed;
    }

    /* Estilos de la lista de historial */
    .history-section h3 {
        font-size: 1.1em;
        margin-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 5px;
    }
    .comparison-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .comparison-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
    }
    .comparison-item:last-child {
        border-bottom: none;
    }
    .comparison-details {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        flex-grow: 1;
        font-size: 0.9em;
    }
    .comparison-item-name {
        color: var(--text-color, #333);
        font-weight: 600;
        font-size: 1em;
        margin-right: 5px;
    }
    .separator-vs-mini {
        color: var(--text-color-light, #666);
        margin: 0 5px;
        font-weight: normal;
        font-style: italic;
    }
    .category-tag {
        font-size: 0.75em;
        padding: 2px 5px;
        background-color: var(
            --color-primary,
            #4f46e5
        ); /* Usa tu color primario para la categoría */
        color: white;
        border-radius: 4px;
        margin-left: 8px;
        text-transform: capitalize;
        white-space: nowrap;
    }
    .timestamp {
        font-size: 0.8em;
        color: var(--text-color-light, #666);
        margin-left: 10px;
    }
    .comparison-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: 10px;
    }
    .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1em;
        color: var(--error-color, #dc3545);
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    .delete-btn:hover {
        opacity: 1;
    }
    .status-message {
        padding: 10px;
        color: var(--text-color);
        background-color: var(--background-color-light);
        border-radius: 4px;
        text-align: center;
        font-size: 0.9em;
    }
</style>
