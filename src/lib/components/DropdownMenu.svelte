<script>
    // @ts-nocheck
    import { user } from "$lib/stores/authStore";
    import Auth from "$lib/components/Auth.svelte";
    import Comparisons from "$lib/components/Comparisons.svelte";
    import { onMount } from "svelte";

    // ❌ LÍNEA ELIMINADA: Ya no se necesita la importación de lucide-svelte
    // import { LogIn, User, MapPin } from "lucide-svelte";

    let isOpen = false;
    let activeTab = "auth"; // Pestaña inicial: 'auth' o 'history'

    // --- Lógica para cerrar el menú al hacer clic fuera ---
    function handleClickOutside(event) {
        if (isOpen && event.target.closest(".dropdown-container") === null) {
            isOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside, true);

        return () => {
            document.removeEventListener("click", handleClickOutside, true);
        };
    });

    // Cambia la pestaña activa (Login/Registro o Historial)
    function changeTab(tab) {
        activeTab = tab;
    }

    // Alterna la apertura/cierre del menú
    function toggleDropdown() {
        isOpen = !isOpen;
        // Al abrir, si el usuario está logueado, vamos directo al historial
        if (isOpen && $user) {
            activeTab = "history";
        } else if (isOpen) {
            // Si no está logueado, vamos a la pestaña de Login/Registro
            activeTab = "auth";
        }
    }
</script>

<div class="dropdown-container">
    <button
        on:click={toggleDropdown}
        class="dropdown-toggle-btn"
        aria-expanded={isOpen}
    >
        {#if $user}
            <i class="fas fa-user-circle icon-size"></i>
            <span>{$user.email.split("@")[0]}</span>
        {:else}
            <i class="fas fa-sign-in-alt icon-size"></i>
            <span>Acceder</span>
        {/if}
    </button>

    {#if isOpen}
        <div class="dropdown-menu">
            <div class="tab-navigation">
                <button
                    class:active={activeTab === "auth"}
                    on:click={() => changeTab("auth")}
                >
                    <i class="fas fa-user icon-small"></i>
                    {$user ? "Cuenta" : "Login / Registro"}
                </button>

                {#if $user}
                    <button
                        class:active={activeTab === "history"}
                        on:click={() => changeTab("history")}
                    >
                        <i class="fas fa-history icon-small"></i>
                        Historial
                    </button>
                {/if}
            </div>

            <div class="tab-content">
                {#if activeTab === "auth"}
                    <Auth />
                {:else if activeTab === "history"}
                    <Comparisons />
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* ------------------------------ */
    /* ESTILOS (Ajustes para los íconos) */
    /* ------------------------------ */

    /* Variables de estilo (Asegúrate de que existan en tu app.css) */
    :root {
        --color-primary: #4f46e5;
        --color-primary-dark: #4338ca;
        --border-color: #e0e7ff;
        --background-color: #f7f9fc;
        --text-color-light: #666;
    }

    .icon-size {
        font-size: 1.2em; /* Equivalente a w-5 h-5 */
    }

    .icon-small {
        font-size: 1em; /* Equivalente a w-4 h-4 */
    }

    .dropdown-container {
        position: relative;
        z-index: 1000;
        display: inline-block;
    }

    .dropdown-toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 15px;
        background-color: var(--color-primary);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.3s;
    }
    .dropdown-toggle-btn:hover {
        background-color: var(--color-primary-dark);
    }

    .dropdown-menu {
        position: absolute;
        right: 0;
        width: 380px;
        max-width: 95vw;
        margin-top: 10px;
        background-color: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }
    /* Estilos de Pestañas */
    .tab-navigation {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--background-color);
    }

    .tab-navigation button {
        flex: 1;
        padding: 12px 10px;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-color-light);
        transition:
            color 0.2s,
            background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    .tab-navigation button.active {
        color: var(--color-primary);
        border-bottom: 2px solid var(--color-primary);
        background-color: white;
    }

    .tab-content {
        padding: 0;
    }
</style>
