// @ts-nocheck
// src/lib/stores/historyStore.js

import { writable } from 'svelte/store';

// Un store simple que emitirá un evento (un cambio de número) cada vez que
// se guarde una comparación. Esto permite que los componentes, como 
// Comparisons.svelte, se suscriban a este evento y recarguen la lista.

export const comparisonSaveEvent = writable(0);

/**
 * Notifica a todos los componentes suscritos que una nueva comparación ha sido guardada.
 * Esto se hace incrementando el valor del store.
 */
export function notifyComparisonSaved() {
    // Incrementa el valor para forzar la notificación del cambio a los suscriptores.
    comparisonSaveEvent.update(n => n + 1);
}