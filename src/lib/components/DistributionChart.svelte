<script>
    // @ts-nocheck

    // Propiedades que recibe el componente desde +page.svelte
    export let data = [];
    export let total = 0;

    // FUNCIÓN CORREGIDA: Fuerza el redondeo del valor monetario a 0 decimales.
    const formatValue = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0, // <<--- La clave de la solución anterior
        });
    };
</script>

<div class="distribution-chart-container">
    {#each data as rubro}
        {@const percentage = (rubro.valor / total) * 100}

        <div class="rubro-item">
            <span class="rubro-name">{rubro.rubro}</span>

            <div class="bar-area">
                <div
                    class="bar"
                    style="width: {percentage.toFixed(1)}%; 
                           background-color: var(--color-total);"
                ></div>
            </div>

            <span class="rubro-value">
                ₡{formatValue(rubro.valor)} ({percentage.toFixed(1)}%)
            </span>
        </div>
    {/each}
</div>

<style>
    /* Estilos generales del contenedor */
    .distribution-chart-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 10px 0;
        margin: 10px auto;
        max-width: 600px;
    }

    /* El grid que distribuye el nombre, la barra y el valor */
    .rubro-item {
        /* 1.5fr (Nombre) | 3fr (Barra) | 1.5fr (Valor y Porcentaje) */
        display: grid;
        grid-template-columns: 1.5fr 3fr 1.5fr;
        align-items: center;
        gap: 15px;
    }

    /* Nombre del rubro (ej. Vivienda, Alimentación) */
    .rubro-name {
        font-weight: 600;
        text-align: right;
        font-size: 0.9em;
        color: var(--text-color);
    }

    /* Contenedor de la barra */
    .bar-area {
        height: 18px;
        background-color: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
    }
    .bar {
        height: 100%;
        transition: width 0.5s ease;
    }

    /* Valor y Porcentaje */
    .rubro-value {
        font-size: 0.8em;
        font-weight: 700;
        text-align: left;
        color: var(--color-primary);
        white-space: nowrap;
    }

    /* Media Query para pantallas pequeñas */
    @media (max-width: 600px) {
        .rubro-item {
            /* Colapsar a dos columnas y ocultar la barra si es necesario */
            grid-template-columns: 1fr 1fr;
            gap: 5px;
        }
        .bar-area {
            display: none; /* Oculta la barra en móvil para ganar espacio */
        }
        .rubro-name {
            text-align: left;
            font-size: 0.85em;
        }
        .rubro-value {
            font-size: 0.75em;
            text-align: right;
        }
    }
</style>
