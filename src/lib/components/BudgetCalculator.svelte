<script>
    // @ts-nocheck
    import { quintOut } from "svelte/easing";
    import { flip } from "svelte/animate";
    import { onMount } from "svelte";

    // 💡 FIREBASE IMPORTS (ASUME QUE ESTOS ARCHIVOS EXISTEN EN $lib)
    import { user } from "$lib/stores/authStore";
    import { saveComparison, loadComparisons } from "$lib/firebase/db";

    // 1. PROPS: Recibe los datos de los cantones y la función de formato
    export let todasLasZonas = []; // Lista completa de cantones con sus costos
    export let formatNumber = (num) => num.toLocaleString("es-CR");

    // 2. ESTADOS: Variables reactivas de Svelte para los Inputs del Usuario (ORIGINALES)
    let salary = 0; // Salario Mensual Neto del usuario
    let housing_factor = 1.0; // Factor de Ajuste Vivienda
    let transport_factor = 1.0; // Factor de Ajuste Transporte
    let additional_expenses = 0; // Gasto Adicional Personal

    // 3. ESTADO DEL RESULTADO: Lista de cantones con sus costos ajustados
    let adjustedCantones = [];

    // --- NUEVOS ESTADOS PARA FIREBASE ---
    let savedComparisons = []; // Almacena las comparaciones históricas
    let isLoading = false; // Estado de carga
    let saveMessage = ""; // Mensaje de éxito/error al guardar

    // 4. LÓGICA REACTIVA DE CÁLCULO (ORIGINAL, MANTENIDA)
    $: {
        const userSalary = Number(salary) || 0;
        const userAddExpenses = Number(additional_expenses) || 0;

        adjustedCantones = todasLasZonas
            .map((zona) => {
                const viviendaBase = zona.gastos?.vivienda || 0;
                const alimentacionBase = zona.gastos?.alimentacion || 0;
                const transporteBase = zona.gastos?.transporte || 0;
                const otrosGastosBase =
                    (zona.gastos?.servicios || 0) + (zona.gastos?.salud || 0);

                const viviendaAjustada = viviendaBase * housing_factor;
                const transporteAjustado = transporteBase * transport_factor;

                const costoTotalAjustado =
                    viviendaAjustada +
                    alimentacionBase +
                    transporteAjustado +
                    otrosGastosBase +
                    userAddExpenses;
                const diferencia = userSalary - costoTotalAjustado;
                const isViable = costoTotalAjustado <= userSalary;

                return {
                    ...zona,
                    costoAjustado: Math.round(costoTotalAjustado),
                    diferencia: Math.round(diferencia),
                    isViable: isViable,
                };
            })
            .sort((a, b) => {
                if (a.isViable !== b.isViable) {
                    return a.isViable ? -1 : 1;
                }
                return a.costoAjustado - b.costoAjustado;
            });
    }

    // --- LÓGICA DE FIREBASE (NUEVA) ---

    /** Carga los datos de la base de datos y actualiza los estados locales. */
    async function fetchComparisons() {
        if (!$user) {
            savedComparisons = [];
            return;
        }

        isLoading = true;
        const comparisons = await loadComparisons($user.uid);
        savedComparisons = comparisons;
        isLoading = false;

        // Cargar la ÚLTIMA COMPARACIÓN al iniciar o al loguearse
        if (savedComparisons.length > 0) {
            // Aseguramos que solo se cargue la última si los campos están en 0
            if (salary === 0 && additional_expenses === 0) {
                loadComparison(savedComparisons[0]);
            }
        }
    }

    /** Guarda los ajustes actuales en Firestore. */
    async function saveCurrentComparison() {
        if (!$user) {
            saveMessage = "Debes iniciar sesión para guardar tus ajustes.";
            setTimeout(() => (saveMessage = ""), 3000);
            return;
        }

        saveMessage = "Guardando...";

        const comparisonData = {
            salary: salary,
            housing_factor: housing_factor,
            transport_factor: transport_factor,
            additional_expenses: additional_expenses,
        };

        const success = await saveComparison($user.uid, comparisonData);

        if (success) {
            saveMessage = "✅ ¡Ajustes guardados con éxito!";
            await fetchComparisons();
        } else {
            saveMessage = "❌ Error al guardar.";
        }

        setTimeout(() => (saveMessage = ""), 3000);
    }

    /** Aplica una comparación guardada a los inputs de la calculadora. */
    function loadComparison(comparison) {
        salary = comparison.salary || 0;
        housing_factor = comparison.housing_factor || 1.0;
        transport_factor = comparison.transport_factor || 1.0;
        additional_expenses = comparison.additional_expenses || 0;
        saveMessage = "Ajuste cargado.";
        setTimeout(() => (saveMessage = ""), 2000);
    }

    // Ejecutar al montar y cuando el usuario cambie
    onMount(() => {
        fetchComparisons();
    });
    $: $user, fetchComparisons(); // Reactivo: se ejecuta cuando $user cambia

    // --- FUNCIONES DE UTILIDAD (ORIGINALES, MANTENIDAS) ---
    function resetCalculator() {
        salary = 0;
        additional_expenses = 0;
        housing_factor = 1.0;
        transport_factor = 1.0;
    }

    function getDifferenceClass(diff) {
        if (diff >= 100000) return "diff-great";
        if (diff > 0) return "diff-ok";
        if (diff <= -100000) return "diff-bad";
        return "diff-warning";
    }
</script>

<div class="main-layout">
    <div class="sidebar-auth">
        <slot name="auth"></slot>

        {#if $user}
            <div class="saved-comparisons-box">
                <h4>💾 Tus Ajustes Guardados</h4>

                <button
                    on:click={saveCurrentComparison}
                    class="save-button"
                    disabled={!$user}
                >
                    <i class="fas fa-save"></i> Guardar Ajustes Actuales
                </button>
                {#if saveMessage}
                    <p class="save-message">{saveMessage}</p>
                {/if}

                {#if isLoading}
                    <p>Cargando historial...</p>
                {:else if savedComparisons.length > 0}
                    <p class="history-prompt">Historial (clic para cargar):</p>
                    <ul class="comparison-history">
                        {#each savedComparisons as comparison (comparison.id)}
                            <li on:click={() => loadComparison(comparison)}>
                                <span class="history-date"
                                    >{comparison.timestamp
                                        ?.toDate()
                                        .toLocaleDateString() || "N/A"}</span
                                >
                                <span class="history-detail"
                                    >Salario: {formatNumber(
                                        comparison.salary,
                                    )}</span
                                >
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="no-history-prompt">
                        No tienes ajustes guardados.
                    </p>
                {/if}
            </div>
        {/if}
    </div>

    <div class="calculator-content">
        <div class="calculator-container">
            <h3 class="calc-header">
                <i class="fas fa-calculator"></i> Calculadora de Presupuesto Personalizado
            </h3>

            <div class="input-controls">
                <label for="salary" class="input-group">
                    Salario Mensual Neto (₡):
                    <input
                        id="salary"
                        type="number"
                        min="0"
                        bind:value={salary}
                        placeholder="Ej: 1,000,000"
                    />
                </label>
                <label for="additional_expenses" class="input-group">
                    Gasto Adicional (Ocio, Ahorro, etc. ₡):
                    <input
                        id="additional_expenses"
                        type="number"
                        min="0"
                        bind:value={additional_expenses}
                        placeholder="Ej: 50,000"
                    />
                </label>
            </div>

            <button on:click={resetCalculator} class="reset-button-calc">
                <i class="fas fa-undo"></i> Reiniciar Calculadora
            </button>

            <fieldset>
                <legend>Ajuste de Vivienda</legend>
                <label>
                    <input
                        type="radio"
                        name="housing"
                        bind:group={housing_factor}
                        value={1.5}
                    />
                    Vivienda Lujosa/Grande (+50% Vivienda)
                </label>
                <label>
                    <input
                        type="radio"
                        name="housing"
                        bind:group={housing_factor}
                        value={1.0}
                    />
                    Vivienda Promedio (Sin Ajuste)
                </label>
                <label>
                    <input
                        type="radio"
                        name="housing"
                        bind:group={housing_factor}
                        value={0.7}
                    />
                    Vivienda Pequeña/Compartida (-30% Vivienda)
                </label>
            </fieldset>

            <fieldset>
                <legend>Ajuste de Transporte</legend>
                <label>
                    <input
                        type="radio"
                        name="transport"
                        bind:group={transport_factor}
                        value={1.5}
                    />
                    Vehículo Propio/Viajes Largos (+50% Transporte)
                </label>
                <label>
                    <input
                        type="radio"
                        name="transport"
                        bind:group={transport_factor}
                        value={1.0}
                    />
                    Uso Mixto/Promedio (Sin Ajuste)
                </label>
                <label>
                    <input
                        type="radio"
                        name="transport"
                        bind:group={transport_factor}
                        value={0.7}
                    />
                    Solo Transporte Público (-30% Transporte)
                </label>
            </fieldset>
        </div>

        <div class="results-container">
            <h4>Cantones Sugeridos por tu Presupuesto:</h4>

            {#if salary <= 0}
                <p class="initial-prompt">
                    Ingresa tu salario neto para ver qué cantones se ajustan a
                    tus necesidades.
                </p>
            {:else}
                <div class="results-header">
                    <div class="col-canton-name">Cantón</div>
                    <div class="col-original-cost">Costo Promedio Original</div>
                    <div class="col-adjusted-cost">Costo Ajustado (Tú)</div>
                    <div class="col-difference">
                        Diferencia (Ahorro/Déficit)
                    </div>
                </div>

                <div class="results-list">
                    {#each adjustedCantones as zona (zona.cantón)}
                        <div
                            class="result-row"
                            class:viable={zona.isViable}
                            class:unviable={!zona.isViable}
                            animate:flip={{ duration: 500, easing: quintOut }}
                        >
                            <div class="col-canton-name">
                                <span
                                    class="status-dot"
                                    class:viable-dot={zona.isViable}
                                    class:unviable-dot={!zona.isViable}
                                ></span>
                                {zona.cantón} ({zona.provincia})
                            </div>
                            <div class="col-original-cost">
                                {formatNumber(zona.costo_total_estimado)}
                            </div>
                            <div class="col-adjusted-cost">
                                {formatNumber(zona.costoAjustado)}
                            </div>
                            <div
                                class="col-difference"
                                class:diff-great={getDifferenceClass(
                                    zona.diferencia,
                                ) === "diff-great"}
                                class:diff-ok={getDifferenceClass(
                                    zona.diferencia,
                                ) === "diff-ok"}
                                class:diff-warning={getDifferenceClass(
                                    zona.diferencia,
                                ) === "diff-warning"}
                                class:diff-bad={getDifferenceClass(
                                    zona.diferencia,
                                ) === "diff-bad"}
                            >
                                {formatNumber(zona.diferencia)}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* --- NUEVOS ESTILOS DE LAYOUT (DOS COLUMNAS) --- */
    .main-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 30px;
    }
    .calculator-content {
        grid-column: 2;
    }
    .sidebar-auth {
        grid-column: 1;
    }

    /* Estilos del Historial Guardado */
    .saved-comparisons-box {
        margin-top: 20px;
        padding: 20px;
        background-color: var(--card-background);
        border: 1px solid var(--border-color);
        border-radius: 8px;
    }
    .save-button {
        width: 100%;
        padding: 10px;
        background-color: var(--color-success, #28a745);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-bottom: 15px;
    }
    .save-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
    .save-message {
        text-align: center;
        font-weight: bold;
        padding: 5px;
        margin-bottom: 10px;
        font-size: 0.9em;
    }
    .comparison-history {
        list-style: none;
        padding: 0;
    }
    .comparison-history li {
        padding: 8px;
        border-bottom: 1px dotted var(--border-color);
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.1s;
        display: flex;
        justify-content: space-between;
    }
    .comparison-history li:hover {
        background-color: var(--background-color);
    }
    .history-prompt {
        font-weight: bold;
        font-size: 0.9em;
    }
    .no-history-prompt {
        font-style: italic;
        color: var(--text-color-light);
        font-size: 0.9em;
    }
    /* FIN DE ESTILOS NUEVOS DE LAYOUT */

    /* --- ESTILOS ORIGINALES (MANTENIDOS) --- */
    .calculator-container {
        background: var(--card-background);
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        margin-top: 40px;
        border: 1px solid var(--border-color);
    }
    .calc-header {
        margin-top: 0;
        color: var(--color-primary);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .input-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
    }
    .input-group {
        display: block;
        font-weight: 600;
        color: var(--text-color);
    }
    input[type="number"] {
        width: 100%;
        padding: 10px;
        margin-top: 5px;
        box-sizing: border-box;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--background-color);
        color: var(--text-color);
    }
    .reset-button-calc {
        width: 100%;
        padding: 10px;
        margin-top: -10px;
        margin-bottom: 25px;
        background-color: #ff6347;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: background-color 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .reset-button-calc:hover {
        background-color: #e04e38;
    }
    fieldset {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
        transition: border-color 0.3s;
    }
    legend {
        font-weight: bold;
        padding: 0 10px;
        color: var(--color-secondary);
    }
    fieldset label {
        display: flex;
        align-items: center;
        margin-top: 8px;
        font-weight: normal;
        cursor: pointer;
    }
    fieldset input[type="radio"] {
        margin-right: 10px;
        transform: scale(1.1);
    }
    .results-container {
        margin-top: 40px;
    }
    .initial-prompt {
        text-align: center;
        padding: 30px;
        background: var(--card-background);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        color: var(--text-color);
        font-style: italic;
    }
    .results-header,
    .result-row {
        display: grid;
        grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr;
        gap: 15px;
        padding: 12px 15px;
        align-items: center;
    }
    .results-header {
        background-color: var(--color-primary);
        color: white;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
        text-transform: uppercase;
        font-size: 0.85em;
    }
    .results-list {
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
    }
    .result-row {
        background-color: var(--card-background);
        border-bottom: 1px solid var(--border-color);
        font-size: 0.9em;
    }
    .result-row.viable {
        border-left: 4px solid #00a300;
    }
    .result-row.unviable {
        border-left: 4px solid #ff6347;
        opacity: 0.8;
    }
    .col-difference {
        font-weight: bold;
        text-align: right;
    }
    .diff-great {
        color: #00a300;
    }
    .diff-ok {
        color: #57b39a;
    }
    .diff-warning {
        color: #ffc107;
    }
    .diff-bad {
        color: #ff6347;
    }
    .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
    }
    .viable-dot {
        background-color: #00a300;
    }
    .unviable-dot {
        background-color: #ff6347;
    }
    .col-canton-name {
        font-weight: 600;
    }

    /* Media Queries para Responsividad */
    @media (max-width: 1000px) {
        .main-layout {
            grid-template-columns: 1fr;
        }
        .calculator-content {
            grid-column: 1;
        }
        .sidebar-auth {
            grid-column: 1;
        }
        .input-controls {
            grid-template-columns: 1fr;
        }
        .results-header,
        .result-row {
            grid-template-columns: 1fr 1fr;
        }
        .col-original-cost {
            display: none;
        }
    }
</style>
