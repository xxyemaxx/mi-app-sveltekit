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
    import { onMount, getContext, afterUpdate } from "svelte";

    // Obtener la información de los cantones seleccionados para comparación
    // Usamos getContext para obtener datos que el padre (+page.svelte) define
    // Esto es un patrón de SvelteKit/Svelte para compartir datos sin props directos.
    // 💡 NOTA: DEBES ASEGURARTE DE PASAR ESTE CONTEXTO en +page.svelte
    // Ejemplo: setContext("comparisonData", { provincias: ["Alajuela", "Cartago"], cantones: ["Alajuela", "La Unión"] });
    let comparisonData = { provincias: [], cantones: [] };

    // Definir la función para actualizar comparisonData desde el componente padre
    // Si no puedes obtenerlo por contexto, tendrás que pasar estos datos como props:
    // export let zonasParaComparar = [];
    // Por ahora, asumimos que el padre actualizará la variable `comparisonData` directamente si es necesario.

    // --- Estado Local ---
    let savedComparisons = [];
    let isLoading = false;
    let message = "Cargando historial...";
    let status = null; // null, 'success', 'error'

    // --- Función de Carga ---
    async function fetchComparisons() {
        if (!$user) {
            savedComparisons = [];
            message = "Inicia sesión para ver y guardar tus comparaciones.";
            return;
        }

        isLoading = true;
        message = "Cargando historial...";
        const data = await loadComparisons($user.uid);

        savedComparisons = data;
        if (savedComparisons.length === 0) {
            message = "No tienes comparaciones guardadas. Guarda la primera!";
        } else {
            message = null; // Limpiar mensaje si hay datos
        }
        isLoading = false;
    }

    // --- Función de Guardado ---
    async function handleSave() {
        if (!$user) {
            status = "error";
            message = "Debes iniciar sesión para guardar.";
            return;
        }

        // 1. Obtener los datos actuales de la comparación desde el localStorage
        // Ya que SvelteKit no tiene contexto global directo para variables reactivas.
        const dashboardState = JSON.parse(
            localStorage.getItem("dashboardState") || "{}",
        );

        if (!dashboardState.c1 && !dashboardState.c2) {
            status = "error";
            message = "Selecciona al menos un cantón antes de guardar.";
            return;
        }

        const dataToSave = {
            canton1: dashboardState.c1 || null,
            provincia1: dashboardState.p1 || null,
            canton2: dashboardState.c2 || null,
            provincia2: dashboardState.p2 || null,
            category: dashboardState.category || "costo_total_estimado",
            // Otros filtros importantes que quieras guardar
        };

        const success = await saveComparison($user.uid, dataToSave);
        if (success) {
            status = "success";
            message = "Comparación guardada con éxito!";
            // Recargar la lista
            await fetchComparisons();
        } else {
            status = "error";
            message = "Error al guardar la comparación.";
        }

        // Limpiar mensaje de estado después de 3 segundos
        setTimeout(() => {
            status = null;
            message = null;
            fetchComparisons();
        }, 3000);
    }

    // --- Función de Eliminación ---
    async function handleDelete(id) {
        if (
            confirm("¿Estás seguro de que quieres eliminar esta comparación?")
        ) {
            const success = await deleteComparison(id);
            if (success) {
                status = "success";
                message = "Comparación eliminada.";
                await fetchComparisons();
                // Limpiar mensaje
                setTimeout(() => {
                    status = null;
                    message = null;
                }, 3000);
            } else {
                status = "error";
                message = "Error al eliminar.";
                setTimeout(() => {
                    status = null;
                    message = null;
                }, 3000);
            }
        }
    }

    // --- Lógica de Carga y Reactividad ---
    onMount(() => {
        // Cargar al inicio si el usuario ya está logueado (ej: por sesión persistente)
        if ($user) {
            fetchComparisons();
        }
    });

    // Reactividad a cambios en el usuario (login/logout)
    $: if ($user !== undefined) {
        fetchComparisons();
    }

    // Función de ayuda para formatear la fecha
    function formatTimestamp(timestamp) {
        if (!timestamp) return "Fecha desconocida";
        if (timestamp instanceof Date) {
            return timestamp.toLocaleDateString("es-CR", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        return "Cargando fecha...";
    }

    // Función para aplicar una comparación cargada (simula la acción de cargar)
    function applyComparison(comp) {
        if (typeof localStorage !== "undefined") {
            const state = JSON.stringify({
                p1: comp.provincia1 || "",
                c1: comp.canton1 || "",
                p2: comp.provincia2 || "",
                c2: comp.canton2 || "",
                // Preservar otros filtros o resetearlos según la lógica de tu app
                // ... (mantener otros campos del dashboardState si no están en comp)
                category: comp.category || "costo_total_estimado",
                calculatorOpen: true, // Abrir calculadora
            });
            localStorage.setItem("dashboardState", state);
            // Recargar la página para que SvelteKit y +page.svelte lean el nuevo estado
            window.location.reload();
        }
    }
</script>

<div class="comparison-history-box">
    <h3><i class="fas fa-history"></i> Historial de Comparaciones</h3>

    {#if $user}
        <p>Guardar la selección actual de hasta dos cantones:</p>
        <button on:click={handleSave} class="save-btn" disabled={isLoading}>
            {#if isLoading}
                Guardando...
            {:else}
                <i class="fas fa-save"></i> Guardar Comparación Actual
            {/if}
        </button>

        {#if status && message}
            <div class="status-message {status}">
                {message}
            </div>
        {/if}

        <hr class="divider" />

        <h4>Últimas {savedComparisons.length} Comparaciones:</h4>

        {#if isLoading}
            <p class="loading-state">Cargando...</p>
        {:else if savedComparisons.length > 0}
            <ul class="comparison-list">
                {#each savedComparisons as comp (comp.id)}
                    <li>
                        <div class="comparison-info">
                            <span class="location">
                                {comp.canton1 ||
                                    comp.provincia1 ||
                                    "Cantón Desconocido"}
                                {#if comp.canton2}
                                    <span class="separator-vs-mini"> vs </span>
                                    {comp.canton2}
                                {/if}
                                <span class="category-tag"
                                    >({comp.category.replace(/_/g, " ")})</span
                                >
                            </span>
                            <span class="timestamp">
                                Guardado: {formatTimestamp(comp.timestamp)}
                            </span>
                        </div>
                        <div class="comparison-actions">
                            <button
                                on:click={() => applyComparison(comp)}
                                class="action-btn apply-btn"
                                title="Cargar y Aplicar"
                            >
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button
                                on:click={() => handleDelete(comp.id)}
                                class="action-btn delete-btn"
                                title="Eliminar"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="loading-state">{message}</p>
        {/if}
    {:else}
        <p class="not-logged-in-msg">
            Inicia sesión en el panel de arriba para ver y guardar tu historial.
        </p>
    {/if}
</div>

<style>
    .comparison-history-box {
        padding: 20px;
        background-color: var(--card-background, #fff);
        border-radius: 8px;
        border: 1px solid var(--border-color, #e0e7ff);
        box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.05));
    }
    h3 {
        margin-top: 0;
        color: var(--color-primary, #4f46e5);
        font-size: 1.2em;
        text-align: center;
    }
    h4 {
        margin-top: 15px;
        margin-bottom: 10px;
        color: var(--text-color, #333);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 5px;
        font-size: 1.1em;
    }
    .divider {
        border: 0;
        height: 1px;
        background-color: var(--border-color, #e0e7ff);
        margin: 15px 0;
    }
    .save-btn {
        width: 100%;
        padding: 10px;
        background-color: var(--color-primary, #4f46e5);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    .save-btn:hover:not(:disabled) {
        background-color: var(--color-primary-dark, #4338ca);
    }
    .save-btn:disabled {
        background-color: #a5b4fc;
        cursor: not-allowed;
    }
    .comparison-list {
        list-style: none;
        padding: 0;
    }
    .comparison-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px dashed var(--border-color, #eee);
        transition: background-color 0.2s;
    }
    .comparison-list li:hover {
        background-color: var(--background-color, #f7f9fc);
    }
    .comparison-list li:last-child {
        border-bottom: none;
    }
    .comparison-info {
        display: flex;
        flex-direction: column;
    }
    .comparison-actions {
        display: flex;
        gap: 5px;
    }
    .location {
        font-weight: 600;
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
    .not-logged-in-msg {
        text-align: center;
        color: var(--text-color-light);
        font-style: italic;
    }
    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1em;
        width: 30px;
        height: 30px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    .action-btn:hover {
        background-color: var(--border-color);
    }
    .apply-btn {
        color: var(--color-primary);
    }
    .delete-btn {
        color: var(--error-color);
    }
</style>
