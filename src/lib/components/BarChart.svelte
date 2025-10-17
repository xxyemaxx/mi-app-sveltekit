<script>
    // @ts-nocheck

    export let data; // Array de zonas filtradas
    export let categoria; // La clave a comparar (ej. 'vivienda', 'alimentacion')
    export let promedios; // Objeto con todos los promedios (incluido el total)

    // Obtener el promedio actual basado en la categoría seleccionada
    $: currentPromedio =
        categoria === "costo_total_estimado"
            ? promedios.costo_total_estimado
            : promedios.gastos[categoria];

    // Mapear los datos para obtener el valor de la categoría seleccionada
    $: costosVisibles = data.map((zona) => ({
        ...zona,
        valor:
            categoria === "costo_total_estimado"
                ? zona.costo_total_estimado
                : zona.gastos[categoria],
    }));

    // Calcula el valor más alto para escalar las barras
    $: maxCosto = Math.max(
        ...costosVisibles.map((z) => z.valor || 0),
        currentPromedio || 0,
    );
    $: scaledMaxCosto = maxCosto * 1.1;

    // Función para obtener la altura de la barra en porcentaje
    const getBarHeight = (costo) => (costo / scaledMaxCosto) * 100;

    // Función auxiliar para formatear números
    const formatShort = (value) => {
        const num = parseFloat(value) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        return (num / 1000).toFixed(0) + "K";
    };

    const formatFull = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR");
    };

    // Título dinámico
    const titles = {
        costo_total_estimado: "Costo Total Estimado",
        vivienda: "Costo de Vivienda",
        alimentacion: "Costo de Alimentación",
        transporte: "Costo de Transporte",
        servicios: "Costo de Servicios",
        ocio: "Costo de Ocio",
    };
</script>

<div class="chart-container">
    <h3>{titles[categoria]} por Zona (comparativa)</h3>
    <div class="chart-area">
        <div
            class="average-line"
            style="bottom: {getBarHeight(currentPromedio)}%;"
        >
            <span class="average-label"
                >Promedio Nacional: ₡{formatFull(currentPromedio)}</span
            >
        </div>

        {#each costosVisibles as zona (zona.zona + zona.distrito)}
            <div class="bar-wrapper">
                <div
                    class="bar-item"
                    style="height: {getBarHeight(zona.valor)}%; 
                             background-color: {zona.valor > currentPromedio
                        ? '#dc3545'
                        : '#28a745'};"
                    title="{zona.distrito}, {zona.provincia}: ₡{formatFull(
                        zona.valor,
                    )}"
                >
                    <span class="bar-value">₡{formatShort(zona.valor)}</span>
                </div>
                <div class="bar-label">{zona.distrito}</div>
                <div class="bar-sublabel">{zona.provincia}</div>
            </div>
        {/each}
    </div>
</div>

<style>
    /* ... ESTILOS DE BARCHART.SVELTE ... */
</style>
