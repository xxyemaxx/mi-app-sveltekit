<script>
    // @ts-nocheck

    import { auth } from "$lib/firebase/firebase";
    // 💡 Importamos user (estado) y logout (función) de la store
    import { user, logout } from "$lib/stores/authStore";
    import {
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
    } from "firebase/auth";

    let email = "";
    let password = "";
    let errorMessage = "";
    let isLogin = true; // true: Login, false: Register
    let isLoading = false; // Estado de carga para evitar doble click

    async function handleAuth() {
        errorMessage = "";
        if (!email || !password) {
            errorMessage = "Ingresa correo y contraseña.";
            return;
        }
        isLoading = true;
        try {
            if (isLogin) {
                // Iniciar Sesión
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Registrar Nuevo Usuario
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Limpiar campos después de éxito
            email = "";
            password = "";
        } catch (error) {
            console.error(error.code, error.message);
            // Manejo de errores amigable
            if (error.code === "auth/email-already-in-use") {
                errorMessage =
                    "El correo ya está registrado. Intenta iniciar sesión.";
            } else if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password"
            ) {
                errorMessage = "Credenciales incorrectas.";
            } else if (error.code === "auth/weak-password") {
                errorMessage =
                    "La contraseña debe tener al menos 6 caracteres.";
            } else {
                errorMessage = `Error: ${error.message}`;
            }
        } finally {
            isLoading = false;
        }
    }

    // 💡 Función para cerrar sesión que usa la lógica de authStore.js
    function handleLogout() {
        logout();
    }
</script>

<div class="auth-container">
    {#if $user}
        <div class="logged-in-panel">
            <p class="user-greeting">
                <i class="fas fa-user-circle"></i> Bienvenido, **{$user.email}**
            </p>
            <button
                on:click={handleLogout}
                class="logout-btn"
                disabled={isLoading}
            >
                Cerrar Sesión
            </button>
        </div>
    {:else}
        <div class="auth-form-panel">
            <h3 class="form-title">
                {isLogin ? "Iniciar Sesión" : "Registrarse"}
            </h3>

            {#if errorMessage}
                <p class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    {errorMessage}
                </p>
            {/if}

            <input
                type="email"
                placeholder="Correo Electrónico"
                bind:value={email}
                disabled={isLoading}
            />
            <input
                type="password"
                placeholder="Contraseña (mín. 6 caracteres)"
                bind:value={password}
                disabled={isLoading}
            />

            <button on:click={handleAuth} class="auth-btn" disabled={isLoading}>
                {#if isLoading}
                    <i class="fas fa-spinner fa-spin"></i> Cargando...
                {:else}
                    {isLogin ? "Iniciar Sesión" : "Registrarse"}
                {/if}
            </button>

            <button
                on:click={() => {
                    isLogin = !isLogin;
                    errorMessage = "";
                }}
                class="toggle-mode-btn"
                disabled={isLoading}
            >
                {isLogin
                    ? "¿No tienes cuenta? Regístrate."
                    : "¿Ya tienes cuenta? Inicia Sesión."}
            </button>
        </div>
    {/if}
</div>

<style>
    /* VARIABLES (Asegúrate de que tus variables CSS estén definidas globalmente) */
    :root {
        --color-primary: #4f46e5;
        --color-accent: #10b981;
        --card-background: #ffffff;
        --text-color: #1f2937;
        --text-color-light: #6b7280;
        --border-color: #e5e7eb;
        --error-color: #e53e3e;
    }

    .auth-container {
        padding: 15px;
        background-color: var(--card-background);
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--border-color);
        max-width: 350px;
        margin-left: auto;
    }

    .form-title {
        color: var(--color-primary);
        font-size: 1.2em;
        margin-top: 0;
        margin-bottom: 15px;
        text-align: center;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 8px;
    }

    input {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        box-sizing: border-box;
        background-color: var(--card-background);
        color: var(--text-color);
    }

    .auth-btn,
    .logout-btn {
        width: 100%;
        padding: 10px;
        background-color: var(
            --color-accent
        ); /* Color diferente para destacar */
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
        margin-top: 5px;
    }

    .auth-btn:hover:not(:disabled) {
        background-color: #0d9475; /* Tono más oscuro de accent */
    }

    .auth-btn:disabled {
        background-color: var(--border-color);
        cursor: not-allowed;
    }

    .logout-btn {
        background-color: var(--error-color);
        margin-top: 10px;
    }

    .logout-btn:hover {
        background-color: #c53030;
    }

    .toggle-mode-btn {
        width: 100%;
        padding: 8px;
        margin-top: 10px;
        background: none;
        border: none;
        color: var(--color-primary);
        font-size: 0.9em;
        cursor: pointer;
        transition: color 0.3s;
    }

    .toggle-mode-btn:hover {
        color: #3b31c9;
    }

    .error-message {
        color: var(--error-color);
        background-color: #fef2f2;
        border: 1px solid var(--error-color);
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 0.9em;
    }

    .logged-in-panel {
        text-align: center;
    }

    .user-greeting {
        font-size: 1em;
        color: var(--text-color);
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px dashed var(--border-color);
    }

    .user-greeting i {
        margin-right: 8px;
        color: var(--color-primary);
    }
</style>
