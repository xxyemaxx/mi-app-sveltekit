// @ts-nocheck
// src/lib/firebase/db.js

// Importación condicional del módulo principal de firebase
let db;
// Intentamos cargar la referencia a Firestore SOLO en el navegador (Cliente)
if (typeof window !== 'undefined') {
    // Esto importa dinámicamente el módulo, evitando que el servidor falle al intentar acceder a la referencia.
    import('./firebase.js').then(module => {
        db = module.db;
    }).catch(error => {
        console.error("No se pudo cargar la referencia a Firestore en el cliente:", error);
    });
}

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    orderBy,
    limit,
    serverTimestamp,
    deleteDoc,
    doc
} from 'firebase/firestore';

const COMPARISON_COLLECTION = 'userComparisons';

/**
 * Guarda una nueva comparación en Firestore.
 */
export async function saveComparison(userId, comparisonData) {
    if (!userId || !db) {
        // En SSR o si no está inicializado, no se ejecuta y retorna falso.
        console.warn("No hay usuario logueado o Firestore no está disponible (SSR).");
        return false;
    }
    try {
        await addDoc(collection(db, COMPARISON_COLLECTION), {
            userId: userId,
            timestamp: serverTimestamp(),
            ...comparisonData
        });
        console.log("Comparación guardada con éxito!");
        return true;
    } catch (error) {
        console.error("Error al guardar la comparación:", error);
        return false;
    }
}

/**
 * Carga las últimas comparaciones guardadas por un usuario.
 */
export async function loadComparisons(userId) {
    if (!userId || !db) {
        // En SSR, simplemente retornamos un array vacío
        return [];
    }
    try {
        const q = query(
            collection(db, COMPARISON_COLLECTION),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const comparisons = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            comparisons.push({
                id: doc.id,
                ...data,
                // Maneja el timestamp de forma segura
                timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
            });
        });

        return comparisons;
    } catch (error) {
        console.error("Error al cargar las comparaciones:", error);
        return [];
    }
}

/**
 * Elimina una comparación guardada por su ID.
 */
export async function deleteComparison(comparisonId) {
    if (!comparisonId || !db) {
        console.warn("ID o Firestore no disponible.");
        return false;
    }
    try {
        await deleteDoc(doc(db, COMPARISON_COLLECTION, comparisonId));
        console.log(`Comparación ${comparisonId} eliminada con éxito.`);
        return true;
    } catch (error) {
        console.error("Error al eliminar la comparación:", error);
        return false;
    }
}