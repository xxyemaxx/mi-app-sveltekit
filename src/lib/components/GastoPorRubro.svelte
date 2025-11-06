<script>
    // @ts-nocheck

    import { onMount, onDestroy } from "svelte";
    // Importamos Chart.js
    import Chart from "chart.js/auto";

    // 1. Props: Recibe los datos del cantón. Los nombres deben coincidir con tu tabla.
    export let cantonData = null;

    // Referencias para Svelte y Chart.js
    let chartCanvas; // Referencia al elemento <canvas> en el HTML
    let chartInstance; // Instancia del gráfico para poder destruirlo y redibujarlo

    // 2. Función de Cálculo: Extrae los rubros y calcula sus porcentajes.
    function calculateChartData(data) {
        if (!data || !data.CostoTotal) {
            return {
                labels: [],
                data: [],
                total: 0,
                cantón: "No Seleccionado",
            };
        }

        // Definimos los rubros a analizar
        const gastos = {
            Vivienda: data.Vivienda,
            Alimentos: data.Alimentos,
            Transporte: data.Transp,
            Servicios: data.Servic,
            Salud: data.Salud,
        };

        // El costo total debe ser la suma de estos rubros para calcular el porcentaje
        // (Asumo que el CostoTotal es la suma de estos rubros. Si hay otros, usa el valor de data.CostoTotal)
        const totalGastos = Object.values(gastos).reduce(
            (sum, value) => sum + value,
            0,
        );

        const labels = Object.keys(gastos);
        const dataValues = labels.map((label) => gastos[label]); // Valores absolutos de gasto

        return {
            labels,
            data: dataValues,
            total: totalGastos,
            canton: data.Cantón,
        };
    }

    // 3. Función de Dibujo: Inicializa o actualiza el gráfico.
    function drawChart(data) {
        if (chartInstance) {
            chartInstance.destroy(); // Limpia el gráfico anterior antes de dibujar el nuevo
        }

        const {
            labels,
            data: dataValues,
            canton,
            total,
        } = calculateChartData(data);

        // Si no hay datos, salimos
        if (total === 0) return;

        const chartConfig = {
            type: "doughnut", // Gráfico de Dona (Pie chart)
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Monto de Gasto (₡)",
                        data: dataValues,
                        backgroundColor: [
                            "#4dc9f6", // Vivienda (ejemplo: azul)
                            "#f67019", // Alimentos (ejemplo: naranja)
                            "#f53794", // Transporte (ejemplo: rosa)
                            "#537bc4", // Servicios (ejemplo: azul oscuro)
                            "#acc236", // Salud (ejemplo: verde lima)
                        ],
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    title: {
                        display: true,
                        text: `Composición del Gasto en ${canton} (Total: ₡${total.toLocaleString()})`,
                    },
                    tooltip: {
                        // Personaliza el tooltip para mostrar el valor absoluto y el porcentaje
                        callbacks: {
                            label: function (context) {
                                let label = context.label || "";
                                if (label) {
                                    label += ": ";
                                }
                                if (context.parsed !== null) {
                                    const value = context.parsed;
                                    const totalDataset =
                                        context.dataset.data.reduce(
                                            (a, b) => a + b,
                                            0,
                                        );
                                    const percentage =
                                        ((value / totalDataset) * 100).toFixed(
                                            1,
                                        ) + "%";
                                    label += `₡${value.toLocaleString()} (${percentage})`;
                                }
                                return label;
                            },
                        },
                    },
                },
            },
        };

        chartInstance = new Chart(chartCanvas, chartConfig);
    }

    // 4. Reactividad: Redibuja el gráfico cuando la prop `cantonData` cambie.
    // El $ indica una declaración reactiva en Svelte.
    $: if (cantonData) {
        drawChart(cantonData);
    }

    // 5. Ciclo de Vida: Inicializa el gráfico al montar el componente.
    onMount(() => {
        if (cantonData) {
            drawChart(cantonData);
        }
    });

    // 6. Ciclo de Vida: Destruye la instancia del gráfico cuando el componente se destruye para liberar memoria.
    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
</script>

<div class="chart-container">
    {#if cantonData}
        <canvas bind:this={chartCanvas}></canvas>
    {:else}
        <p>Seleccione un Cantón para ver la distribución de gastos.</p>
    {/if}
</div>

<style>
    /* Estilos básicos para darle un tamaño fijo al contenedor del gráfico */
    .chart-container {
        max-width: 450px;
        max-height: 450px;
        margin: 20px auto;
        padding: 15px;
        background-color: #1a2233; /* Fondo oscuro similar al de tu app */
        border-radius: 8px;
    }
</style>
