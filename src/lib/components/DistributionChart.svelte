<script>
    // @ts-nocheck

    // @ts-ignore
    export let data = []; // Prop: Array de rubros { rubro: string, valor: number, clave: string }
    export let total = 1; // Prop: Costo total estimado

    // Mapeo de colores coherente con el CSS global
    const colorMap = {
        vivienda: "#4e79a7", // Azul
        alimentacion: "#f28e2b", // Naranja
        transporte: "#e15759", // Rojo
        servicios: "#76b7b2", // Turquesa
        ocio: "#59a14f", // Verde
        // Si hay otros rubros, se les puede asignar un color neutro o expandir el mapa
    };

    // Formateo de valor
    // @ts-ignore
    const safeFormat = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
        });
    };

    // Calcula el valor máximo para normalizar las barras
    // @ts-ignore
    $: maxValue = Math.max(...data.map((d) => d.valor), 1);

    // Función para obtener un color basado en la clave del rubro o un color por defecto
    // @ts-ignore
    const getColor = (clave) => colorMap[clave] || "#9d755d";
</script>

<div class="distribution-chart-viz">
    {#each data as item}
        <div class="bar-item">
            <div class="label-info">
                <span class="rubro-label">{item.rubro}</span>
                <span class="rubro-value">
                    {safeFormat(item.valor)}
                    ({((item.valor / total) * 100).toFixed(1)}%)
                </span>
            </div>

            <div class="bar-wrapper">
                <div
                    class="bar"
                    style="
                        width: {(item.valor / total) * 100}%; 
                        background-color: {getColor(item.clave)};
                        /* El 100% se basa en el total, no en el valor máximo para un desglose */
                    "
                ></div>
            </div>
        </div>
    {/each}
</div>

<style>
    .distribution-chart-viz {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 15px; /* Espacio entre cada rubro */
    }

    .bar-item {
        display: flex;
        flex-direction: column;
    }

    .label-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-weight: 500;
        font-size: 0.9em;
    }

    .rubro-label {
        color: var(--color-text-dark);
    }

    .rubro-value {
        font-weight: 700;
        color: var(--color-text-dark);
        opacity: 0.9;
    }

    .bar-wrapper {
        height: 15px; /* Altura de la barra */
        background-color: var(
            --color-border-light
        ); /* Fondo para mostrar el 100% */
        border-radius: 4px;
        overflow: hidden;
    }

    .bar {
        height: 100%;
        transition: width 0.8s ease-out; /* Animación al cargar */
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
</style>
