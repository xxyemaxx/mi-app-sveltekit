<script>
    // @ts-nocheck

    import { Pie } from "svelte-chartjs";
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        ArcElement,
    } from "chart.js";

    // ¡CRÍTICO! Registra los elementos que usará el gráfico circular
    ChartJS.register(Title, Tooltip, Legend, ArcElement);

    // Los datos que recibiremos del Modal
    export let data = []; // Esperamos un array de objetos: [{ label: 'Vivienda', value: 100000 }]

    // Colores predefinidos
    const backgroundColors = [
        "#00796B", // Principal (Vivienda)
        "#D81B60", // Alimentación
        "#FF9800", // Transporte
        "#42A5F5", // Servicios
        "#689F38", // Salud
        "#AB47BC", // Educación
        "#FFCA28", // Comunicaciones
        "#757575", // Ocio
    ];

    // Propiedad reactiva que formatea los datos para Chart.js
    $: chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                data: data.map((d) => d.value),
                backgroundColor: backgroundColors.slice(0, data.length),
                hoverOffset: 4,
            },
        ],
    };

    // Opciones del gráfico
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right", // Muestra la leyenda a la derecha
            },
            title: {
                display: false,
                text: "Desglose de Gastos",
            },
        },
    };
</script>

<div class="chart-wrapper">
    <Pie data={chartData} options={chartOptions} />
</div>

<style>
    /* Estilos para asegurar que el gráfico tenga un tamaño visible */
    .chart-wrapper {
        height: 350px;
        width: 100%;
        margin: 20px auto;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
