<script>
    // @ts-nocheck

    // Importamos el store del usuario para saber si está logueado
    import { user } from "$lib/stores/authStore";
    // Importamos las funciones de la base de datos
    import {
        saveComparison,
        loadComparisons,
        deleteComparison,
    } from "$lib/firebase/db";
    import { onMount, getContext } from "svelte"; // Eliminamos afterUpdate, no es necesario

    // 1. OBTENER EL CONTEXTO DE FORMA NO REACTIVA (referencia al objeto)
    // El objeto retornado por getContext mantiene referencias a las variables reactivas
    // del padre (+page.svelte).
    const comparisonContext = getContext("comparisonData");

    // 2. HACER LAS VARIABLES LOCALES REACTIVAS A LOS VALORES DEL CONTEXTO
    // Usamos $: para que estas variables se actualicen automáticamente cuando el padre
    // (+page.svelte) llame a $: setContext(...)
    $: zonasParaComparar = comparisonContext?.zonasParaComparar || [];
    $: categoriaComparacion =
        comparisonContext?.categoriaComparacion || "costo_total_estimado";

    // 3. Lógica para activar el botón Guardar
    // Solo se puede guardar si hay 1 o 2 zonas seleccionadas Y el usuario está logueado
    $: canSave = zonasParaComparar.length > 0 && $user;

    // --- Estado Local ---
    let savedComparisons = [];
    let isLoading = false;
    let message = "Cargando historial...";
    let status = null; // null | 'success' | 'error'

    // --- Funciones de Utilidad ---

    // Función para recargar el historial
    async function refreshComparisons() {
        if (!$user) return; // No recargar si no hay usuario

        isLoading = true;
        message = "Recargando historial...";
        try {
            // Pasamos el UID del usuario logueado
            const data = await loadComparisons($user.uid);
            savedComparisons = data;
            message = data.length > 0 ? "" : "No hay comparaciones guardadas.";
        } catch (error) {
            message = "Error al cargar el historial.";
            console.error("Error al cargar comparaciones:", error);
        } finally {
            isLoading = false;
        }
    }

    async function handleSave() {
        if (!canSave || !$user) return;

        isLoading = true;
        status = null;

        // 1. Definir el payload de datos a guardar
        const comparisonToSave = {
            zonas: zonasParaComparar.map((zona) => ({
                canton: zona.cantón,
                provincia: zona.provincia,
                // Guardamos el costo para que sea visible en el historial
                costo: zona.costo_total_estimado,
            })),
            categoria: categoriaComparacion,
            userId: $user.uid, // Aseguramos el userId en el payload
        };

        // 2. Llamar a la función de guardado
        const success = await saveComparison($user.uid, comparisonToSave);

        if (success) {
            status = "success";
            message = "¡Comparación guardada con éxito!";
            // Recargar para ver el nuevo elemento en la lista
            await refreshComparisons();
        } else {
            status = "error";
            message = "Error al guardar la comparación. Intenta de nuevo.";
        }

        isLoading = false;
        // Limpiar el mensaje de estado después de un tiempo
        setTimeout(() => (status = null), 3000);
    }

    async function handleDelete(comparisonId) {
        if (!$user) return;

        isLoading = true;
        status = null;
        message = "Eliminando...";

        const success = await deleteComparison(comparisonId);

        if (success) {
            status = "success";
            message = "Comparación eliminada.";
            // Filtra la comparación eliminada
            savedComparisons = savedComparisons.filter(
                (c) => c.id !== comparisonId,
            );
            if (savedComparisons.length === 0) {
                message = "No hay comparaciones guardadas.";
            }
        } else {
            status = "error";
            message = "Error al eliminar la comparación.";
        }

        isLoading = false;
        setTimeout(() => (status = null), 3000);
    }

    // Ejecutar al montar o cuando el usuario cambie
    $: if ($user) {
        refreshComparisons();
    } else {
        savedComparisons = [];
        message = "Inicia sesión para ver tu historial.";
        isLoading = false;
    }
</script>

<div class="comparisons-container">
    {#if !$user}
        <p class="not-logged-in-msg">
            Inicia sesión en la pestaña **Login** para guardar tu historial de
            comparaciones.
        </p>
    {:else}
        <button
            class="save-btn"
            on:click={handleSave}
            disabled={!canSave || isLoading}
        >
            {#if isLoading && status !== "success" && status !== "error"}
                Guardando...
            {:else}
                Guardar Comparación Actual ({zonasParaComparar.length} Zonas)
            {/if}
        </button>

        {#if status}
            <div class="status-message {status}">{message}</div>
        {/if}

        <hr class="divider" />

        <h3>Historial Guardado</h3>

        {#if isLoading && $user && status !== "success"}
            <p class="loading-state">Cargando historial...</p>
        {:else if savedComparisons.length === 0}
            <p class="empty-list-msg">{message}</p>
        {:else}
            <ul class="comparison-list">
                {#each savedComparisons as comparison}
                    <li class="comparison-item">
                        <div class="comparison-info">
                            {#each comparison.zonas as zona, i}
                                <span class="canton-name">{zona.canton}</span>
                                {#if i === 0 && comparison.zonas.length === 2}
                                    <span class="separator-vs-mini">vs</span>
                                {/if}
                            {/each}
                            <span class="category-tag"
                                >{comparison.categoria
                                    .split("_")
                                    .join(" ")}</span
                            >
                        </div>

                        <div class="comparison-actions">
                            {#if comparison.timestamp}
                                <span class="timestamp"
                                    >{new Date(
                                        comparison.timestamp,
                                    ).toLocaleDateString()}</span
                                >
                            {/if}
                            <button
                                class="delete-btn"
                                on:click={() => handleDelete(comparison.id)}
                                title="Eliminar comparación"
                            >
                                🗑️
                            </button>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}
</div>

<style>
    /* Estilos del contenedor principal */
    .comparisons-container {
        padding: 15px;
        background-color: var(--background-color-secondary, #fff);
        min-height: 200px;
    }
    .save-btn {
        width: 100%;
        padding: 12px;
        background-color: var(--color-accent, #10b981);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
        margin-bottom: 15px;
    }
    .save-btn:hover:not(:disabled) {
        background-color: #0d9475; /* Tono más oscuro de accent */
    }
    .save-btn:disabled {
        background-color: var(--border-color);
        cursor: not-allowed;
    }
    .divider {
        border: none;
        border-top: 1px solid var(--border-color, #eee);
        margin: 15px 0;
    }
    /* Estilos de la lista */
    .comparison-list {
        list-style: none;
        padding: 0;
        margin: 10px 0 0 0;
    }
    .comparison-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px dashed var(--border-color-light, #f0f0f0);
    }
    .comparison-item:last-child {
        border-bottom: none;
    }
    .comparison-info {
        display: flex;
        align-items: center;
        font-size: 0.9em;
        color: var(--text-color, #333);
    }
    .canton-name {
        color: var(--text-color, #333);
        font-size: 1em;
    }
    .separator-vs-mini {
        color: var(--text-color-light, #666);
        margin: 0 5px;
        font-weight: normal;
    }
    .category-tag {
        font-size: 0.7em;
        padding: 2px 5px;
        background-color: var(--color-accent, #10b981);
        color: white;
        border-radius: 4px;
        margin-left: 8px;
        text-transform: capitalize;
    }
    .timestamp {
        font-size: 0.8em;
        color: var(--text-color-light, #666);
    }
    .comparison-actions {
        display: flex;
        align-items: center;
        gap: 10px;
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
        border-radius: 6px;
        margin-top: 10px;
        font-weight: bold;
    }
    .status-message.success {
        background-color: #d1e7dd;
        color: #0f5132;
    }
    .status-message.error {
        background-color: #f8d7da;
        color: #842029;
    }
    .loading-state,
    .not-logged-in-msg,
    .empty-list-msg {
        text-align: center;
        color: var(--text-color-light, #666);
        padding: 20px 10px;
        font-style: italic;
    }
</style>
