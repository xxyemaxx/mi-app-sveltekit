// @ts-nocheck
// src/lib/stores/authStore.js

import { writable } from 'svelte/store';
// 'auth' es undefined en SSR, por eso lo importamos como es
import { auth } from '$lib/firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const user = writable(null);

// 🛑 SOLUCIÓN 2: Solo suscribirse a la autenticación si 'window' existe Y 'auth' es válido
if (typeof window !== 'undefined' && auth) {

    // Suscribirse a los cambios de autenticación de Firebase
    onAuthStateChanged(auth, (currentUser) => {
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


// Función para cerrar sesión (también debe ser segura contra auth=undefined)
export const logout = async () => {
    // Es buena práctica verificar que 'auth' exista antes de usarlo
    if (!auth) {
        console.warn("Auth no está inicializado. No se puede cerrar sesión en SSR.");
        return;
    }
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
};