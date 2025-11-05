<script>
    // @ts-nocheck

    // Propiedades que recibe el componente desde +page.svelte
    // Ahora recibimos el objeto de cantón completo (data = { ...cantonData... })
    export let data = {};
    export let theme = "light"; // Recibimos el tema, aunque la paleta de colores es fija por ahora

    // 1. Paleta de colores y etiquetas para cada rubro de costo
    const COLOR_PALETTE = {
        vivienda: { label: "Vivienda", color: "#007bff" }, // Azul
        alimentacion: { label: "Alimentación", color: "#28a745" }, // Verde
        transporte: { label: "Transporte", color: "#ffc107" }, // Amarillo
        servicios: { label: "Servicios", color: "#dc3545" }, // Rojo
        salud: { label: "Salud", color: "#6f42c1" }, // Morado
        educacion: { label: "Educación", color: "#17a2b8" }, // Cian
        comunicaciones: { label: "Comunicaciones", color: "#fd7e14" }, // Naranja
        ocio: { label: "Ocio", color: "#e83e8c" }, // Rosa
    };

    // 2. Cálculo Reactivo de los datos de la distribución
    $: totalCosto = data?.costo_total_estimado || 0;

    $: distributionData = (() => {
        if (!data?.gastos) return [];

        const rubros = data.gastos;

        // Mapear los rubros de gastos a la estructura del gráfico, incluyendo color y porcentaje
        return (
            Object.keys(COLOR_PALETTE)
                .map((key) => {
                    const valor = rubros[key] || 0;
                    // Excluir rubros con valor 0 para no saturar el gráfico
                    if (valor === 0) return null;

                    return {
                        key: key,
                        rubro: COLOR_PALETTE[key].label,
                        valor: valor,
                        color: COLOR_PALETTE[key].color,
                        percentage: (valor / totalCosto) * 100,
                    };
                })
                .filter((item) => item !== null)
                // Ordenar por valor descendente para que los más grandes estén arriba
                .sort((a, b) => b.valor - a.valor)
        );
    })();

    // 3. Formato de números (sin decimales para colones)
    const formatValue = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };
</script>

<div class="distribution-chart-container">
    {#if distributionData.length > 0}
        {#each distributionData as rubro (rubro.key)}
            <div class="rubro-item">
                <span class="rubro-name">{rubro.rubro}</span>

                <div class="bar-area">
                    <div
                        class="bar"
                        style="width: {rubro.percentage.toFixed(1)}%; 
                               background-color: {rubro.color};"
                        title="{rubro.rubro}: ₡{formatValue(
                            rubro.valor,
                        )} ({rubro.percentage.toFixed(1)}%)"
                    ></div>
                </div>

                <span class="rubro-value">
                    ₡{formatValue(rubro.valor)} ({rubro.percentage.toFixed(1)}%)
                </span>
            </div>
        {/each}
    {:else}
        <p class="no-data">Datos de gastos no disponibles.</p>
    {/if}
</div>

<style>
    /* Estilos generales del contenedor */
    .distribution-chart-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px;
        background: var(--card-background); /* Fondo del gráfico */
        border-radius: 8px;
    }

    /* Contenedor de cada rubro (Nombre, Barra y Valor) */
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
        font-size: 0.95em;
        color: var(--text-color);
        white-space: nowrap;
    }

    /* Contenedor de la barra (el fondo gris/claro) */
    .bar-area {
        height: 18px;
        background-color: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    /* La barra de color que indica el valor */
    .bar {
        height: 100%;
        transition: width 0.5s ease;
    }

    /* Valor y Porcentaje */
    .rubro-value {
        font-size: 0.85em;
        font-weight: 700;
        text-align: left;
        /* Usamos el color primario para el texto si no es el color de la barra */
        color: var(--color-primary);
        white-space: nowrap;
    }

    /* Mensaje de no data */
    .no-data {
        text-align: center;
        color: var(--text-color);
        font-style: italic;
    }

    /* Media Query para pantallas pequeñas */
    @media (max-width: 600px) {
        .rubro-item {
            /* Apilamos Nombre y el resto */
            grid-template-columns: 1fr;
            gap: 5px;
        }
        .rubro-name {
            text-align: left;
        }
        .bar-area {
            /* Ocupa el ancho completo */
            grid-column: 1 / -1;
        }
    }
</style>
