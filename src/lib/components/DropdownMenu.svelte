<script>
    // @ts-nocheck
    import { user } from "$lib/stores/authStore";
    import Auth from "$lib/components/Auth.svelte";
    import Comparisons from "$lib/components/Comparisons.svelte";
    
    // Asumo que tienes un paquete de íconos instalado, por ejemplo, 'lucide-svelte'
    // Si no tienes íconos, puedes eliminar estas líneas o reemplazarlas con HTML simple (ej. <span>)
    import { LogIn, User, MapPin } from 'lucide-svelte'; 
    import { onMount } from "svelte";

    let isOpen = false;
    let activeTab = 'auth'; // Pestaña inicial: 'auth' o 'history'

    // --- Lógica para cerrar el menú al hacer clic fuera ---
    function handleClickOutside(event) {
        // Verifica si el clic ocurrió dentro del contenedor del menú. 
        // Si no es así y el menú está abierto, lo cierra.
        if (isOpen && event.target.closest('.dropdown-container') === null) {
            isOpen = false;
        }
    }

    onMount(() => {
        // Adjunta el listener al documento cuando el componente se monta
        document.addEventListener('click', handleClickOutside, true);
        
        // Función de limpieza para remover el listener cuando el componente se destruye
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
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
            activeTab = 'history';
        } else if (isOpen) {
            // Si no está logueado, vamos a la pestaña de Login/Registro
            activeTab = 'auth';
        }
    }
</script>

<div class="dropdown-container">
    <button on:click={toggleDropdown} class="dropdown-toggle-btn" aria-expanded={isOpen}>
        {#if $user}
            <User class="w-5 h-5" />
            <span>{$user.email.split('@')[0]}</span> {:else}
            <LogIn class="w-5 h-5" />
            <span>Acceder</span>
        {/if}
    </button>

    {#if isOpen}
        <div class="dropdown-menu">
            <div class="tab-navigation">
                <button
                    class:active={activeTab === 'auth'}
                    on:click={() => changeTab('auth')}
                >
                    <LogIn class="w-4 h-4"/>
                    { $user ? 'Cuenta' : 'Login / Registro' }
                </button>

                {#if $user}
                    <button
                        class:active={activeTab === 'history'}
                        on:click={() => changeTab('history')}
                    >
                        <MapPin class="w-4 h-4"/>
                        Historial
                    </button>
                {/if}
            </div>
            
            <div class="tab-content">
                {#if activeTab === 'auth'}
                    <Auth />
                {:else if activeTab === 'history'}
                    <Comparisons />
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* ------------------------------ */
    /* ESTILOS (Puedes adaptarlos a tu tema CSS) */
    /* ------------------------------ */
    .dropdown-container {
        position: relative;
        z-index: 1000; /* Asegura que esté por encima de todo */
        display: inline-block; /* Para que el div ocupe solo el espacio necesario */
    }

    .dropdown-toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 15px;
        background-color: var(--color-primary, #4f46e5);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.3s;
    }
    .dropdown-toggle-btn:hover {
        background-color: var(--color-primary-dark, #4338ca);
    }

    .dropdown-menu {
        position: absolute;
        /* Coloca el menú en la esquina superior derecha de la página (o donde lo coloques) */
        right: 0; 
        width: 380px; /* Ancho cómodo para formularios y listas */
        max-width: 95vw; /* Asegura responsividad */
        margin-top: 10px;
        background-color: white;
        border: 1px solid var(--border-color, #e0e7ff);
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }
    /* Estilos de Pestañas */
    .tab-navigation {
        display: flex;
        border-bottom: 1px solid var(--border-color, #e0e7ff);
        background-color: var(--background-color, #f7f9fc);
    }

    .tab-navigation button {
        flex: 1;
        padding: 12px 10px;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-color-light, #666);
        transition: color 0.2s, background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    .tab-navigation button.active {
        color: var(--color-primary, #4f46e5);
        border-bottom: 2px solid var(--color-primary, #4f46e5);
        background-color: white;
    }

    .tab-content {
        /* Es importante quitar el padding aquí, ya que los componentes anidados (Auth.svelte, Comparisons.svelte) ya tienen su propio padding interno para las cajas. */
        padding: 0; 
    }
</style>