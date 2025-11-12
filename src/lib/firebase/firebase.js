// src/lib/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tus credenciales reales (asegúrate de que sean correctas)
const firebaseConfig = {
    apiKey: "AIzaSyC1A_MJ0K7bzNQnEcUGJXLHT4JeDzkzagM",
    authDomain: "costo-vida-cr.firebaseapp.com",
    projectId: "costo-vida-cr",
    storageBucket: "costo-vida-cr.firebasestorage.app",
    messagingSenderId: "451955582593",
    appId: "1:451955582593:web:19defe5d02409c5977cf80",
    measurementId: "G-P9FTX2SHD2"
};

// Declarar las variables fuera del if
let app;
let analytics;
let auth;
let db;

// 🛑 SOLUCIÓN 1: Solo inicializar Firebase si el objeto 'window' existe (cliente)
if (typeof window !== 'undefined') {
    app = initializeApp(firebaseConfig);

    // Inicializar Servicios SOLO en el navegador
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
}

// Exportar todos los servicios. Serán 'undefined' durante SSR (servidor), lo cual es correcto.
export { app, analytics, auth, db };