<script>
    // @ts-nocheck

    import { quintOut } from "svelte/easing";
    // Importamos 'flip' para una animación suave en los resultados
    import { flip } from "svelte/animate";
    // 1. PROPS: Recibe los datos de los cantones y la función de formato
    export let todasLasZonas = [];
    // Lista completa de cantones con sus costos
    // Recibe la función de formato para mantener el estilo de moneda consistente
    export let formatNumber = (num) => num.toLocaleString("es-CR");
    // 2. ESTADOS: Variables reactivas de Svelte para los Inputs del Usuario
    let salary = 0;
    // Salario Mensual Neto del usuario
    // Factores de Ajuste (multiplicadores para los gastos base)
    let housing_factor = 1.0;
    let transport_factor = 1.0;
    let additional_expenses = 0; // Gasto Adicional Personal

    // 3. ESTADO DEL RESULTADO: Lista de cantones con sus costos ajustados
    let adjustedCantones = [];
    // 4. LÓGICA REACTIVA DE CÁLCULO
    // Este bloque se ejecuta automáticamente cada vez que cualquiera de las variables reactivas (salary, factors, expenses) cambia.
    $: {
        // Convertir inputs a número (0 si están vacíos o nulos)
        const userSalary = Number(salary) || 0;
        const userAddExpenses = Number(additional_expenses) || 0;

        adjustedCantones = todasLasZonas
            .map((zona) => {
                // Obtener los gastos base
                const viviendaBase = zona.gastos?.vivienda || 0;
                const alimentacionBase = zona.gastos?.alimentacion || 0;

                const transporteBase = zona.gastos?.transporte || 0;

                // Sumamos otros gastos (Servicios + Salud)
                const otrosGastosBase =
                    (zona.gastos?.servicios || 0) + (zona.gastos?.salud || 0);

                // Calcular rubros ajustados

                const viviendaAjustada = viviendaBase * housing_factor;
                const transporteAjustado = transporteBase * transport_factor;

                // Calcular el Costo Total Ajustado para el usuario
                const costoTotalAjustado =
                    viviendaAjustada +
                    alimentacionBase +
                    transporteAjustado +
                    otrosGastosBase +
                    userAddExpenses;
                // Calcular la diferencia (Positivo = Ahorro / Negativo = Déficit)
                const diferencia = userSalary - costoTotalAjustado;
                // Determinar si el cantón es viable
                const isViable = costoTotalAjustado <= userSalary;
                return {
                    ...zona,
                    costoAjustado: Math.round(costoTotalAjustado),
                    diferencia: Math.round(diferencia),
                    isViable: isViable,
                };
            })
            // Ordenar: Viables primero, y luego por Costo Ajustado ascendente
            .sort((a, b) => {
                if (a.isViable !== b.isViable) {
                    return a.isViable ? -1 : 1; // Cantones viables van primero
                }
                return a.costoAjustado - b.costoAjustado; // Luego por costo ascendente
            });
    }

    // --- NUEVA FUNCIÓN DE RESET (REINICIO) ---
    function resetCalculator() {
        salary = 0;
        additional_expenses = 0;
        housing_factor = 1.0; // Valor por defecto
        transport_factor = 1.0; // Valor por defecto
    }

    // Función de utilidad para colorear la diferencia en la UI
    function getDifferenceClass(diff) {
        if (diff >= 100000) return "diff-great";
        // Ahorro significativo
        if (diff > 0) return "diff-ok";
        // Ahorro leve
        if (diff <= -100000) return "diff-bad";
        // Déficit significativo
        return "diff-warning";
        // Déficit leve o neutro
    }
</script>

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
            Ingresa tu salario neto para ver qué cantones se ajustan a tus
            necesidades.
        </p>
    {:else}
        <div class="results-header">
            <div class="col-canton-name">Cantón</div>
            <div class="col-original-cost">Costo Promedio Original</div>
            <div class="col-adjusted-cost">Costo Ajustado (Tú)</div>
            <div class="col-difference">Diferencia (Ahorro/Déficit)</div>
        </div>

        <div class="results-list">
            {#each adjustedCantones as zona (zona.cantón)}
                <div
                    class="result-row"
                    class:viable={zona.isViable}
                    class:unviable={!zona.isViable}
                    animate:flip={{
                        duration: 500,
                        easing: quintOut,
                    }}
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
                        class:diff-ok={getDifferenceClass(zona.diferencia) ===
                            "diff-ok"}
                        class:diff-warning={getDifferenceClass(
                            zona.diferencia,
                        ) === "diff-warning"}
                        class:diff-bad={getDifferenceClass(zona.diferencia) ===
                            "diff-bad"}
                    >
                        {formatNumber(zona.diferencia)}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Estilos del contenedor principal */
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

    /* Controles de Input (Salario y Gastos Adicionales) */
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

    /* 🌟 NUEVO ESTILO PARA EL BOTÓN DE RESET */
    .reset-button-calc {
        width: 100%;
        padding: 10px;
        margin-top: -10px; /* Ajuste para pegarlo a los inputs */
        margin-bottom: 25px;
        background-color: #ff6347; /* Rojo para reset (Color de peligro) */
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
    /* FIN NUEVO ESTILO */

    /* Fieldsets (Radio buttons) */
    fieldset {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
        transition: border-color 0.3s;
    }
    fieldset:focus-within {
        border-color: var(--color-primary);
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

    /* --- Resultados --- */
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
        grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr; /* 4 columnas de datos */
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
        /* Estilos del contenedor de la lista si son necesarios */
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
    }

    .result-row {
        background-color: var(--card-background);
        border-bottom: 1px solid var(--border-color);
        font-size: 0.9em;
    }

    .result-row:last-child {
        border-bottom: none;
        border-radius: 0 0 8px 8px;
    }

    /* Color de la fila basado en la viabilidad */
    .result-row.viable {
        background-color: var(--card-background);
        border-left: 4px solid #00a300; /* Verde */
    }
    .result-row.unviable {
        background-color: var(--card-background);
        border-left: 4px solid #ff6347; /* Rojo */
        opacity: 0.8;
    }
    .result-row:hover {
        background-color: var(--background-color);
    }

    /* Columna de Diferencia */
    .col-difference {
        font-weight: bold;
        text-align: right;
    }
    .diff-great {
        color: #00a300;
        /* Verde fuerte (Ahorro grande) */
    }
    .diff-ok {
        color: #57b39a;
        /* Verde medio (Ahorro leve) */
    }
    .diff-warning {
        color: #ffc107;
        /* Amarillo (Déficit leve) */
    }
    .diff-bad {
        color: #ff6347;
        /* Rojo (Déficit grande) */
    }

    /* Status Dot */
    .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
    }
    .viable-dot {
        background-color: #00a300;
        /* Verde */
    }
    .unviable-dot {
        background-color: #ff6347;
        /* Rojo */
    }
    .col-canton-name {
        font-weight: 600;
    }

    /* Media Queries para Responsividad */
    @media (max-width: 800px) {
        .input-controls {
            grid-template-columns: 1fr;
            /* Apilar inputs de salario y gastos */
        }
        .results-header,
        .result-row {
            grid-template-columns: 1fr 1fr;
            /* Cantón, Costo Ajustado */
        }
        .col-original-cost {
            display: none;
            /* Ocultar costo original en móvil */
        }
        .results-header,
        .result-row {
            padding: 10px;
        }
    }
</style>
