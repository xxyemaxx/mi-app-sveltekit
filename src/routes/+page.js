// @ts-nocheck
// src/routes/+page.js

// Importación directa del JSON desde el mismo directorio 'src/routes/'
import costosData from './costo-vida-cr.json';

/** @type {import('./$types').PageLoad} */
export async function load() {

    // Define las claves de gastos para el cálculo de promedios
    const gastosKeys = ['vivienda', 'alimentacion', 'transporte', 'servicios', 'salud', 'educacion', 'comunicaciones', 'ocio'];
    const promediosGastos = {};

    // 1. Calcular promedios de gastos específicos
    for (const key of gastosKeys) {
        // Recorre todos los cantones para sumar el gasto de una categoría específica
        const sumaGasto = costosData.reduce((sum, z) => sum + (z.gastos[key] || 0), 0);
        promediosGastos[key] = sumaGasto / costosData.length;
    }

    // 2. Calcular el promedio nacional del Costo Total Estimado
    const costosTotales = costosData.map(z => z.costo_total_estimado);
    const sumaCostos = costosTotales.reduce((sum, current) => sum + current, 0);
    const promedioNacional = sumaCostos / costosTotales.length;

    // 3. Calcular el promedio de la Canasta Básica Alimentaria (CBA)
    const sumaCBA = costosData.reduce((sum, z) => sum + z.cba_per_capita_regional, 0);
    const promedioCBA = sumaCBA / costosData.length;

    // 4. Compilar el objeto de promedios final
    const promedios = {
        nacional: promedioNacional,
        cba_per_capita_regional: promedioCBA,
        ...promediosGastos
    };

    // 5. Retornar los datos. El componente +page.svelte los recibirá en la variable 'data'.
    return {
        costos: costosData,
        promedios: promedios
    };
}











