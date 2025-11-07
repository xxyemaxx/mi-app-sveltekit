// @ts-nocheck
// src/routes/+page.js

// 1. IMPORTACIÓN CORREGIDA DEFINITIVA: 
// Usamos el sufijo '?raw' de Vite. Esto importa el contenido del archivo 
// 'costo-vida-cr.json' como una simple cadena de texto (string).
import rawCostosData from './costo-vida-cr.json?raw';


/** @type {import('./$types').PageLoad} */
export async function load() {

    let costosData = [];

    // 2. Analizar el texto a JSON
    try {
        costosData = JSON.parse(rawCostosData);
    } catch (e) {
        console.error("Error al analizar costo-vida-cr.json (JSON.parse falló):", e);
        // Devolvemos un array vacío para evitar que la aplicación se rompa
        return { costos: [], promedios: {} };
    }

    // A partir de aquí, la lógica de cálculo es la misma:

    // Define las claves de gastos para el cálculo de promedios
    const gastosKeys = ['vivienda', 'alimentacion', 'transporte', 'servicios', 'salud', 'educacion', 'comunicaciones', 'ocio'];
    const promediosGastos = {};

    // Si no hay datos, evitamos divisiones por cero
    if (costosData.length === 0) {
        return { costos: costosData, promedios: {} };
    }

    // 1. Calcular promedios de gastos específicos (Vivienda, Alimentación, etc.)
    for (const key of gastosKeys) {
        const sumaGasto = costosData.reduce((sum, z) => sum + (z.gastos?.[key] || 0), 0);
        promediosGastos[key] = sumaGasto / costosData.length;
    }

    // 2. Calcular el promedio nacional del Costo Total Estimado
    const costosTotales = costosData.map(z => z.costo_total_estimado);
    const sumaCostos = costosTotales.reduce((sum, current) => sum + current, 0);
    const promedioNacional = sumaCostos / costosTotales.length;

    // 3. Calcular el promedio de la Canasta Básica Alimentaria (CBA)
    const sumaCBA = costosData.reduce((sum, z) => sum + z.cba_per_capita_regional, 0);
    const promedioCBA = sumaCBA / costosData.length;

    // 4. Compilar el objeto de promedios final.
    const promedios = {
        costo_total_estimado: promedioNacional,
        cba_per_capita_regional: promedioCBA,
        ...promediosGastos
    };

    // 5. Retornar los datos.
    return {
        costos: costosData,
        promedios: promedios
    };
}






















