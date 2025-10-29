// @ts-nocheck
import costoVidaData from "./costo-vida-cr.json"; // Asegúrate que el nombre del archivo sea correcto

// Función para calcular la suma de una clave específica (total o gasto individual)
// @ts-ignore
function calcularSuma(dataArray, key) {
    if (!dataArray || dataArray.length === 0) return 0;

    // Si la clave es el total, accede a 'costo_total_estimado'
    if (key === 'costo_total_estimado') {
        // @ts-ignore
        return dataArray.reduce((acc, zona) => acc + (zona.costo_total_estimado || 0), 0);
    }

    // Si la clave es un gasto específico (vivienda, alimentacion, etc.), accede a zona.gastos[key]
    // @ts-ignore
    return dataArray.reduce((acc, zona) => acc + (zona.gastos?.[key] || 0), 0);
}

export async function load() {
    const totalZonas = costoVidaData.length;

    // Claves de los gastos individuales para calcular promedios
    const clavesGastos = ['vivienda', 'alimentacion', 'transporte', 'servicios', 'ocio'];

    // 1. Calcular promedio del costo total
    const sumaTotal = calcularSuma(costoVidaData, 'costo_total_estimado');
    const promedioTotal = sumaTotal / totalZonas;

    // 2. Calcular promedios por categorías de gasto
    const promediosGastos = {};
    clavesGastos.forEach(key => {
        const suma = calcularSuma(costoVidaData, key);
        // @ts-ignore
        promediosGastos[key] = suma / totalZonas;
    });

    // Objeto consolidado de promedios para pasar a Svelte
    const promedios = {
        costo_total_estimado: promedioTotal,
        gastos: promediosGastos,
    };

    return {
        costos: costoVidaData, // La lista completa de zonas
        costoPromedio: promedioTotal, // El promedio total (opcional, pero se mantiene)
        promedios: promedios,       // ¡El objeto que tu BarChart y +page.svelte necesitan!
    };
}











