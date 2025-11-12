// @ts-nocheck
// src/lib/firebase/db.js

import { db } from './firebase'; // <-- db es undefined en SSR
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
    // 🛑 AGREGAR VERIFICACIÓN DE FIREBASE 🛑
    if (!userId || !db) {
        console.warn("No hay usuario logueado o Firestore no está inicializado (SSR).");
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
    // 🛑 AGREGAR VERIFICACIÓN DE FIREBASE 🛑
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
    // 🛑 AGREGAR VERIFICACIÓN DE FIREBASE 🛑
    if (!comparisonId || !db) {
        console.warn("ID o Firestore no disponible.");
        return false;
    }
    try {
        await deleteDoc(doc(db, COMPARISON_COLLECTION, comparisonId));
        console.log(`Comparación ${comparisonId} eliminada con éxito!`);
        return true;
    } catch (error) {
        console.error("Error al eliminar la comparación:", error);
        return false;
    }
}