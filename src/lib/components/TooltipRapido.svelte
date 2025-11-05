<script>
    import { fade } from "svelte/transition";
    export let isVisible;
    export let content = ""; // Explicación rápida
    export let x = 0; // Posición X
    export let y = 0; // Posición Y
</script>

{#if isVisible}
    <div
        class="tooltip-rapido"
        style={`top: ${y + 20}px; left: ${x}px;`}
        transition:fade|local
    >
        <p>ℹ️ **IDH Rápido**</p>
        <p class="contenido">{content}</p>
        <small>Click para ver detalle.</small>
    </div>
{/if}

<style>
    /* *** ESTILOS ÚNICOS DEL TOOLTIP RÁPIDO *** */
    .tooltip-rapido {
        position: fixed;
        padding: 10px 15px;
        background: #333;
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        z-index: 1500;
        max-width: 200px;
        font-size: 0.8rem;
        pointer-events: none; /* Crucial: ignora el mouse */
        transform: translate(-50%, 0); /* Centra sobre el ratón */
    }
    .contenido {
        margin: 5px 0 0 0;
        font-weight: 300;
    }
</style>
