// @ts-nocheck
// src/lib/stores/authStore.js

import { writable } from 'svelte/store';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const user = writable(null);

// Referencia global para 'auth'. Se inicializa solo en el navegador.
let authReference;

// 🛑 INICIALIZACIÓN DIFERIDA (Solo Cliente) 🛑
if (typeof window !== 'undefined') {
    // Importación dinámica que se ejecuta SOLO en el lado del cliente
    import('$lib/firebase/firebase').then(module => {
        authReference = module.auth;

        // 🚨 La suscripción debe ocurrir SOLO después de que 'auth' se haya cargado.
        if (authReference) {
            onAuthStateChanged(authReference, (currentUser) => {
                if (currentUser) {
                    user.set({
                        uid: currentUser.uid,
                        email: currentUser.email,
                    });
                } else {
                    user.set(null);
                }
            });
        }
    }).catch(error => {
        console.error("No se pudo cargar la referencia a Firebase Auth:", error);
    });
}


// Función para cerrar sesión (Ahora usa la referencia cargada dinámicamente)
export const logout = async () => {
    // Verifica si la referencia se cargó correctamente en el cliente
    if (!authReference) {
        console.warn("Auth no está inicializado. No se puede cerrar sesión.");
        return;
    }
    try {
        await signOut(authReference);
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
};