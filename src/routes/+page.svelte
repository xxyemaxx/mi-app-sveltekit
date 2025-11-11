<script>
    // @ts-nocheck
    import { onMount, setContext } from "svelte";
    // Asegúrese de que CantonTooltip, ComparisonChart y DistributionChart existan en $lib/components/
    import ComparisonChart from "$lib/components/ComparisonChart.svelte";
    import DistributionChart from "$lib/components/DistributionChart.svelte";
    import CantonTooltip from "$lib/components/CantonTooltip.svelte"; // NOTA: El componente que muestra el detalle completo es CantonTooltip en el código de ejemplo.
    import Fuse from "fuse.js"; // Se mantiene por si se quiere añadir búsqueda difusa, aunque el código usa búsqueda simple.

    // 🌟 RUTA CORREGIDA: Apunta a $lib/components/BudgetCalculator.svelte
    import BudgetCalculator from "$lib/components/BudgetCalculator.svelte";

    export let data; // Datos cargados por SvelteKit (que contienen 'costos' y 'promedios')

    // --- Definición de Cantones Clave (20 Cantones) ---
    const cantonesClave = new Set([
        "San José", // Centro Urbano (Alto Costo)
        "Escazú", // Alto Poder Adquisitivo
        "Montes de Oca", // Universitario/Residencial
        "Pérez Zeledón", // Cabecera Brunca (Costos Medios)
        "Curridabat", // Residencial Metropolitano
        "Desamparados", // Metropolitano Denso

        "Alajuela", // Capital de Provincia
        "San Carlos", // Huetar Norte (Rural/Agrícola)
        "Orotina", // Pacífico Central (Costos Medios-Bajos)
        "Upala", // Frontera Norte (Bajo Costo)

        "Cartago", // Capital de Provincia
        "La Unión", // Residencial Cartago (Alto Costo)
        "Turrialba", // Atlántica (Costos Medios-Bajos)

        "Heredia", // Capital de Provincia
        "Belén", // Zona Comercial/Industrial (Alto IDH)
        "Sarapiquí", // Huetar Norte (Bajo Costo)

        "Liberia", // Capital Guanacaste
        "Santa Cruz", // Zona Turística (Costo Variable)

        "Puntarenas", // Capital de Provincia (Pacífico Central)
        "Corredores", // Zona Sur (Bajo Costo)

        "Limón", // Capital de Provincia (Atlántica)
        "Talamanca", // Zona Indígena/Rural (Muy Bajo Costo)
    ]);
    // Inicialización de datos y aplicación del filtro
    const todasLasZonasRaw = data?.costos || [];
    // Integración de datos: Añadir mock data de Población e IDH
    // NOTA: Se ha corregido la lógica para usar los nombres de propiedad correctos del objeto 'zona'
    const todasLasZonas = todasLasZonasRaw
        .filter((zona) => cantonesClave.has(zona.cantón))
        .map((zona) => {
            // Generar mock data basado en la provincia o costo (por simplicidad)
            let poblacion;
            let idh;

            if (zona.cantón === "San José") {
                poblacion = 350000;
                idh = 0.825;
            } else if (zona.cantón === "Escazú") {
                poblacion = 68000;
                idh = 0.91;
            } else if (zona.cantón === "Alajuela") {
                poblacion = 300000;
                idh = 0.815;
            } else if (zona.cantón === "Limón") {
                poblacion = 105000;
                idh = 0.76;
            } else if (zona.cantón === "Quepos") {
                poblacion = 25000;
                idh = 0.795;
            } else {
                // Mock general basado en costo total
                idh = 0.75 + (zona.costo_total_estimado / 1500000) * 0.15;
                idh = Math.min(idh, 0.89);
                poblacion = 50000 + Math.floor(Math.random() * 200000);
            }

            // Función para asignar color basado en IDH (Estándar de la ONU)
            const getColorIDH = (value) => {
                if (value >= 0.8) return "#00a300"; // Desarrollo Muy Alto (Verde)
                if (value >= 0.7) return "#ffc107"; // Desarrollo Alto (Amarillo)
                return "#ff6347"; // Desarrollo Medio/Bajo (Rojo/Naranja)
            };

            return {
                ...zona,
                poblacion: Math.floor(poblacion),
                idh: idh,
                color_idh: getColorIDH(idh),
            };
        });

    const promediosNacionales = data?.promedios || {};

    // --- Variables de estado para la comparación (Selects) ---
    let provinciaSeleccionada1 = "";
    let cantonSeleccionado1 = "";
    let provinciaSeleccionada2 = "";
    let cantonSeleccionado2 = "";
    // --- Variables de estado para la tabla y filtros ---
    let gastoComparacionSeleccionada = ""; // Campo de búsqueda de texto
    let presentacionSeleccionada = "todas"; // Filtro de Región INEC
    let idhSeleccionado = "todas"; // Filtro de Rango IDH
    let zonasFiltradasActuales = todasLasZonas;
    let zonasParaComparar = [];
    let mostrarResults = true;
    // --- ESTADOS para filtros de rango (Costo y Población) ---
    let costoMin = null;
    let costoMax = null;
    let poblacionMin = null;
    let poblacionMax = null;
    // --- Variables de estado para ordenamiento ---
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado"; // Categoría seleccionada para el gráfico

    // --- ESTADOS para promedios nacionales (Resumen) ---
    let promedioNacionalIDH = 0;
    let promedioNacionalCosto = 0;

    // --- ESTADO para todos los promedios de rubros (Usado en ComparisonChart) ---
    let promediosParaComparacion = {};
    // --- ESTADO PARA EL MODAL DE DETALLES ---
    let isModalVisible = false;
    let selectedCantonForModal = {};
    // --- Tema (Modo Oscuro/Claro) ---
    let theme = "light";
    setContext("theme", { theme });

    // 🌟 NUEVO ESTADO PARA EL DESPLEGABLE
    let isCalculatorOpen = true;

    // --- Lógica del Modal ---
    function showModal(zona) {
        selectedCantonForModal = zona;
        isModalVisible = true;
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        isModalVisible = false;
        selectedCantonForModal = {};
        document.body.style.overflow = "";
    }

    // --- Variables Reactivas ($: ) ---

    // Obtener lista única de provincias
    $: todasLasProvincias = [
        ...new Set(todasLasZonas.map((z) => z.provincia)),
    ].sort();
    // Obtener cantones disponibles para los Selects, filtrando por provincia
    $: cantonesDisponibles1 = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada1 === "") return true;
            return z.provincia === provinciaSeleccionada1;
        })
        .map((z) => z.cantón)
        .sort();
    $: cantonesDisponibles2 = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada2 === "") return true;
            return z.provincia === provinciaSeleccionada2;
        })
        .map((z) => z.cantón)
        .sort();
    // Lógica para limpiar el cantón si la provincia cambia y el cantón seleccionado ya no es válido.
    $: {
        if (
            provinciaSeleccionada1 &&
            cantonSeleccionado1 &&
            !cantonesDisponibles1.includes(cantonSeleccionado1)
        ) {
            cantonSeleccionado1 = cantonesDisponibles1[0] || "";
        }
    }
    $: {
        if (
            provinciaSeleccionada2 &&
            cantonSeleccionado2 &&
            !cantonesDisponibles2.includes(cantonSeleccionado2)
        ) {
            cantonSeleccionado2 = cantonesDisponibles2[0] || "";
        }
    }

    // LÓGICA REACTIVA para calcular promedios (Resumen y Gráfico)
    $: {
        if (todasLasZonas.length > 0) {
            const count = todasLasZonas.length;
            // 1. Calcular promedios simples para el resumen
            const sumaIDH = todasLasZonas.reduce((sum, z) => sum + z.idh, 0);
            promedioNacionalIDH = sumaIDH / count;
            const sumaCosto = todasLasZonas.reduce(
                (sum, z) => sum + z.costo_total_estimado,
                0,
            );
            promedioNacionalCosto = sumaCosto / count;

            // 2. Calcular Promedios por Rubro para el ComparisonChart
            const sums = todasLasZonas.reduce(
                (acc, zona) => {
                    acc.vivienda += zona.gastos?.vivienda || 0;
                    acc.alimentacion += zona.gastos?.alimentacion || 0;
                    acc.transporte += zona.gastos?.transporte || 0;
                    acc.servicios += zona.gastos?.servicios || 0;
                    acc.salud += zona.gastos?.salud || 0;
                    acc.educacion += zona.gastos?.educacion || 0;
                    acc.comunicaciones += zona.gastos?.comunicaciones || 0;
                    acc.ocio += zona.gastos?.ocio || 0;
                    return acc;
                },
                {
                    vivienda: 0,
                    alimentacion: 0,
                    transporte: 0,
                    servicios: 0,
                    salud: 0,
                    educacion: 0,
                    comunicaciones: 0,
                    ocio: 0,
                },
            );
            promediosParaComparacion = {
                costo_total_estimado: promedioNacionalCosto,
                idh: promedioNacionalIDH,
                vivienda: sums.vivienda / count,
                alimentacion: sums.alimentacion / count,
                transporte: sums.transporte / count,
                servicios: sums.servicios / count,
                salud: sums.salud / count,
                educacion: sums.educacion / count,
                comunicaciones: sums.comunicaciones / count,
                ocio: sums.ocio / count,
            };
        } else {
            promedioNacionalIDH = 0;
            promedioNacionalCosto = 0;
            promediosParaComparacion = {};
        }
    }

    // Lógica de filtrado y ordenamiento de la tabla
    $: {
        let zonasFiltradas = todasLasZonas;
        // 1. Filtrado por presentación (Región INEC)
        if (presentacionSeleccionada !== "todas") {
            zonasFiltradas = zonasFiltradas.filter(
                (zona) => zona.region_inec === presentacionSeleccionada,
            );
        }

        // FILTRADO POR IDH (Rango)
        if (idhSeleccionado !== "todas") {
            zonasFiltradas = zonasFiltradas.filter((zona) => {
                const idhValue = zona.idh;
                if (idhSeleccionado === "muy-alto") {
                    return idhValue >= 0.8;
                } else if (idhSeleccionado === "alto") {
                    return idhValue >= 0.7 && idhValue < 0.8;
                } else if (idhSeleccionado === "medio-bajo") {
                    return idhValue < 0.7;
                }
                return true;
            });
        }

        // FILTRADO POR RANGO DE COSTO TOTAL
        if (costoMin !== null && !isNaN(costoMin)) {
            zonasFiltradas = zonasFiltradas.filter(
                (zona) => zona.costo_total_estimado >= costoMin,
            );
        }
        if (costoMax !== null && !isNaN(costoMax)) {
            zonasFiltradas = zonasFiltradas.filter(
                (zona) => zona.costo_total_estimado <= costoMax,
            );
        }

        // FILTRADO POR RANGO DE POBLACIÓN (usando el campo simulado 'poblacion')
        if (poblacionMin !== null && !isNaN(poblacionMin)) {
            zonasFiltradas = zonasFiltradas.filter(
                (zona) => zona.poblacion >= poblacionMin,
            );
        }
        if (poblacionMax !== null && !isNaN(poblacionMax)) {
            zonasFiltradas = zonasFiltradas.filter(
                (zona) => zona.poblacion <= poblacionMax,
            );
        }

        // 2. Filtrado por búsqueda de cantones
        if (gastoComparacionSeleccionada !== "") {
            const busqueda = gastoComparacionSeleccionada.toLowerCase();
            zonasFiltradas = zonasFiltradas.filter((zona) =>
                zona.cantón.toLowerCase().includes(busqueda),
            );
        }

        // 3. Ordenamiento
        zonasFiltradas.sort((a, b) => {
            let valorA, valorB;

            if (criterioOrden === "canton") {
                valorA = a.cantón.toLowerCase();
                valorB = b.cantón.toLowerCase();
            } else if (criterioOrden === "provincia") {
                valorA = a.provincia.toLowerCase();
                valorB = b.provincia.toLowerCase();
            } else if (criterioOrden === "costo") {
                valorA = a.costo_total_estimado;
                valorB = b.costo_total_estimado;
            } else if (criterioOrden === "idh") {
                valorA = a.idh;
                valorB = b.idh;
            } else {
                // Acceso seguro con ?. para gastos
                valorA = a.gastos?.[criterioOrden] || 0;
                valorB = b.gastos?.[criterioOrden] || 0;
            }

            let comparacion = 0;
            if (typeof valorA === "string") {
                comparacion = valorA.localeCompare(valorB);
            } else {
                comparacion = valorA - valorB;
            }

            return direccionOrden === "asc" ? comparacion : -comparacion;
        });

        zonasFiltradasActuales = zonasFiltradas;
        mostrarResults = zonasFiltradas.length > 0;
    }

    // Lógica para que la selección en la tabla se refleje en los selects de comparación
    function toggleComparacion(zona) {
        const cantonID = zona.cantón;
        const index1 = zonasParaComparar[0]?.cantón === cantonID ? 0 : -1;
        const index2 = zonasParaComparar[1]?.cantón === cantonID ? 1 : -1;
        const isSelected = index1 !== -1 || index2 !== -1;

        if (isSelected) {
            // Lógica de Deselección
            if (index1 !== -1) {
                // Si es el slot 1, lo reemplazamos con el slot 2 (si existe)
                if (zonasParaComparar[1]) {
                    // Mueve el cantón 2 al slot 1
                    provinciaSeleccionada1 = zonasParaComparar[1].provincia;
                    cantonSeleccionado1 = zonasParaComparar[1].cantón;
                    // Limpia el slot 2
                    provinciaSeleccionada2 = "";
                    cantonSeleccionado2 = "";
                } else {
                    // Si solo estaba el 1, limpiamos el 1
                    provinciaSeleccionada1 = "";
                    cantonSeleccionado1 = "";
                }
            } else if (index2 !== -1) {
                // Si es el slot 2, solo lo limpiamos
                provinciaSeleccionada2 = "";
                cantonSeleccionado2 = "";
            }
        } else {
            // Lógica de Selección
            if (zonasParaComparar.length === 0) {
                provinciaSeleccionada1 = zona.provincia;
                cantonSeleccionado1 = zona.cantón;
            } else if (zonasParaComparar.length === 1) {
                provinciaSeleccionada2 = zona.provincia;
                cantonSeleccionado2 = zona.cantón;
            } else {
                console.warn("Solo puedes comparar un máximo de 2 cantones.");
            }
        }
    }

    // Lógica de comparación por Selects
    $: zonaComparacion1 = todasLasZonas.find(
        (z) =>
            z.provincia === provinciaSeleccionada1 &&
            z.cantón === cantonSeleccionado1,
    );
    $: zonaComparacion2 = todasLasZonas.find(
        (z) =>
            z.provincia === provinciaSeleccionada2 &&
            z.cantón === cantonSeleccionado2,
    );
    // El array de comparación principal se actualiza automáticamente
    $: {
        zonasParaComparar = [];
        if (zonaComparacion1) {
            zonasParaComparar = [...zonasParaComparar, zonaComparacion1];
        }
        if (
            zonaComparacion2 &&
            zonaComparacion2.cantón !== zonaComparacion1?.cantón
        ) {
            zonasParaComparar = [...zonasParaComparar, zonaComparacion2];
        }
    }

    // Pre-procesar los datos para el ComparisonChart
    $: datosParaChart = zonasParaComparar.map((zona) => {
        let valor;
        if (categoriaComparacion === "costo_total_estimado") {
            valor = zona.costo_total_estimado;
        } else if (categoriaComparacion === "cba_per_capita_regional") {
            valor = zona.cba_per_capita_regional;
        } else if (categoriaComparacion === "idh") {
            valor = zona.idh;
        } else {
            valor = zona.gastos?.[categoriaComparacion] || 0;
        }

        return {
            ...zona,
            valorComparacion: valor,
        };
    });
    // Funciones de utilidad para la UI
    function zonaSeleccionada(canton) {
        return zonasParaComparar.some((z) => z.cantón === canton);
    }

    function formatNumber(num) {
        if (typeof num !== "number" || isNaN(num)) return "-";
        return new Intl.NumberFormat("es-CR", {
            style: "currency",
            currency: "CRC",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }

    function setOrden(criterio) {
        if (criterio === criterioOrden) {
            direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
        } else {
            criterioOrden = criterio;
            direccionOrden = "desc";
        }
    }

    function getArrow(criterio) {
        if (criterioOrden !== criterio) return "";
        return direccionOrden === "asc" ? " ▲" : " ▼";
    }

    // Manejo de tema (modo oscuro)
    onMount(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            theme = savedTheme;
        } else if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            theme = "dark";
        }
        document.documentElement.setAttribute("data-theme", theme);

        // PERSISTENCIA DE FILTROS: Cargar estado
        const savedState = localStorage.getItem("dashboardState");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                provinciaSeleccionada1 = state.p1 ?? provinciaSeleccionada1;
                cantonSeleccionado1 = state.c1 ?? cantonSeleccionado1;
                provinciaSeleccionada2 = state.p2 ?? provinciaSeleccionada2;
                cantonSeleccionado2 = state.c2 ?? cantonSeleccionado2;
                gastoComparacionSeleccionada =
                    state.search ?? gastoComparacionSeleccionada;
                presentacionSeleccionada =
                    state.region ?? presentacionSeleccionada;
                idhSeleccionado = state.idh ?? idhSeleccionado;
                categoriaComparacion = state.category ?? categoriaComparacion;
                // Carga de filtros de rango
                costoMin = state.costoMin ?? null;
                costoMax = state.costoMax ?? null;
                poblacionMin = state.poblacionMin ?? null;
                poblacionMax = state.poblacionMax ?? null;

                // 🌟 Cargar estado del desplegable
                isCalculatorOpen = state.calculatorOpen ?? isCalculatorOpen;
            } catch (e) {
                console.error("Error al cargar el estado guardado:", e);
            }
        }
    });
    function toggleTheme() {
        theme = theme === "light" ? "dark" : "light";
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }

    function resetFilters() {
        // 1. Reinicia los selectores de comparación a valores VACÍOS
        provinciaSeleccionada1 = "";
        cantonSeleccionado1 = "";
        provinciaSeleccionada2 = "";
        cantonSeleccionado2 = "";

        // 2. Reinicia los filtros de la tabla
        gastoComparacionSeleccionada = "";
        presentacionSeleccionada = "todas";
        idhSeleccionado = "todas";

        // Limpiar filtros de rango
        costoMin = null;
        costoMax = null;
        poblacionMin = null;
        poblacionMax = null;

        // 3. Reinicia el ordenamiento y la categoría del gráfico
        criterioOrden = "costo";
        direccionOrden = "desc";
        categoriaComparacion = "costo_total_estimado";

        // 🌟 Abre el desplegable por defecto al resetear
        isCalculatorOpen = true;
    }

    const regionesINECAbrevs = [
        "Central",
        "Chorotega",
        "Pacífico Central",
        "Brunca",
        "Huetar Norte",
        "Atlántica",
    ];
    $: totalZonasParaComparar = zonasParaComparar.length;

    // PERSISTENCIA DE FILTROS: Guardar estado en localStorage
    $: {
        if (typeof localStorage !== "undefined") {
            const state = JSON.stringify({
                p1: provinciaSeleccionada1,
                c1: cantonSeleccionado1,
                p2: provinciaSeleccionada2,
                c2: cantonSeleccionado2,
                search: gastoComparacionSeleccionada,
                region: presentacionSeleccionada,
                idh: idhSeleccionado,
                category: categoriaComparacion,
                // Guardar filtros de rango
                costoMin: costoMin,
                costoMax: costoMax,
                poblacionMin: poblacionMin,
                poblacionMax: poblacionMax,
                // 🌟 Guardar estado del desplegable
                calculatorOpen: isCalculatorOpen,
            });
            localStorage.setItem("dashboardState", state);
        }
    }
</script>

<svelte:head>
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
    />
</svelte:head>

<div class="main-container">
    <header>
        <h1>Costo de Vida por Cantón de Costa Rica</h1>
        <p>
            Análisis comparativo del costo de vida estimado en **{todasLasZonas.length}
            cantones clave** del país. Ahora incluye datos simulados de **Población**
            e **IDH**.
        </p>
        <button
            on:click={toggleTheme}
            class="theme-toggle"
            title="Cambiar tema"
        >
            {#if theme === "light"}
                <i class="fas fa-moon"></i>
            {:else}
                <i class="fas fa-sun"></i>
            {/if}
        </button>
    </header>

    <section class="summary-section">
        <h2>📊 Resumen Nacional de Cantones Clave</h2>
        <div class="summary-card-container">
            <div class="summary-card">
                <i class="fas fa-hand-holding-usd icon-costo"></i>
                <p>Costo Total Promedio</p>
                <span class="summary-value value-costo">
                    {formatNumber(promedioNacionalCosto)}
                </span>
            </div>
            <div class="summary-card">
                <i class="fas fa-graduation-cap icon-idh"></i>
                <p>IDH Promedio (Simulado)</p>
                <span class="summary-value value-idh">
                    {promedioNacionalIDH.toFixed(3)}
                </span>
            </div>
            <div class="summary-card">
                <i class="fas fa-globe-americas icon-cantones"></i>
                <p>Cantones en Análisis</p>
                <span class="summary-value value-cantones">
                    {todasLasZonas.length}
                </span>
            </div>
        </div>
    </section>

    <section class="comparison-section">
        <h2>Comparación de Cantones</h2>
        <div class="controls-container">
            <div class="comparison-group">
                <select
                    bind:value={provinciaSeleccionada1}
                    on:change={() => (cantonSeleccionado1 = "")}
                >
                    <option value="">Provincia 1</option>
                    {#each todasLasProvincias as provincia}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
                <select
                    bind:value={cantonSeleccionado1}
                    disabled={!provinciaSeleccionada1}
                >
                    <option value="">Cantón 1</option>
                    {#each cantonesDisponibles1 as canton}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </div>

            <div class="separator-vs">VS</div>

            <div class="comparison-group">
                <select
                    bind:value={provinciaSeleccionada2}
                    on:change={() => (cantonSeleccionado2 = "")}
                >
                    <option value="">Provincia 2</option>
                    {#each todasLasProvincias as provincia}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
                <select
                    bind:value={cantonSeleccionado2}
                    disabled={!provinciaSeleccionada2}
                >
                    <option value="">Cantón 2</option>
                    {#each cantonesDisponibles2 as canton}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </div>

            <button
                on:click={() =>
                    document
                        .querySelector(".chart-container")
                        .scrollIntoView({ behavior: "smooth" })}
                class="compare-button"
                disabled={!(cantonSeleccionado1 || cantonSeleccionado2)}
            >
                <i class="fas fa-chart-bar"></i> Ver Gráficos
            </button>

            <button on:click={resetFilters} class="reset-button">
                <i class="fas fa-redo"></i> Resetear
            </button>
        </div>

        {#if totalZonasParaComparar > 0}
            <div class="chart-container">
                <div class="chart-controls">
                    <label for="categoria-comparacion"
                        >Categoría a Comparar:</label
                    >
                    <select
                        id="categoria-comparacion"
                        bind:value={categoriaComparacion}
                    >
                        <option value="costo_total_estimado"
                            >Costo Total Estimado</option
                        >
                        <option value="idh">IDH</option>
                        <option value="vivienda">Vivienda</option>
                        <option value="alimentacion">Alimentación</option>
                        <option value="transporte">Transporte</option>
                        <option value="servicios">Servicios</option>
                        <option value="salud">Salud</option>
                        <option value="educacion">Educación</option>
                        <option value="comunicaciones">Comunicaciones</option>
                        <option value="ocio">Ocio</option>
                        <option value="cba_per_capita_regional"
                            >CBA Per Cápita</option
                        >
                    </select>
                </div>
                <ComparisonChart
                    data={datosParaChart}
                    category={categoriaComparacion}
                    promedios={promediosParaComparacion}
                    {theme}
                />
            </div>
        {/if}

        {#if totalZonasParaComparar === 1}
            <div class="chart-container distribution-chart">
                <h3>Distribución de Gastos en {zonasParaComparar[0].cantón}</h3>
                <DistributionChart data={zonasParaComparar[0]} {theme} />
            </div>
        {/if}
    </section>

    <div class="divider"></div>

    <section class="budget-calculator-section">
        <div
            class="collapsible-header"
            on:click={() => (isCalculatorOpen = !isCalculatorOpen)}
        >
            <h2>
                <i class="fas fa-calculator"></i> Calculadora de Presupuesto Personalizado
            </h2>
            <i
                class="fas"
                class:fa-chevron-up={isCalculatorOpen}
                class:fa-chevron-down={!isCalculatorOpen}
            ></i>
        </div>

        {#if isCalculatorOpen}
            <div class="collapsible-content">
                <BudgetCalculator {todasLasZonas} {formatNumber} />
            </div>
        {/if}
    </section>
    <div class="divider"></div>

    <section class="table-section">
        <h2>
            Exploración por Cantón ({zonasFiltradasActuales.length} Resultados)
        </h2>

        <div class="filter-bar">
            <input
                type="text"
                bind:value={gastoComparacionSeleccionada}
                placeholder="Buscar cantón..."
                class="search-input"
            />
            <select bind:value={presentacionSeleccionada} class="region-select">
                <option value="todas">Todas las Regiones (INEC)</option>
                {#each regionesINECAbrevs as region}
                    <option value={region}>{region}</option>
                {/each}
            </select>
            <select bind:value={idhSeleccionado} class="idh-select">
                <option value="todas">IDH (Todas las Categorías)</option>
                <option value="muy-alto">Muy Alto (0.8+)</option>
                <option value="alto">Alto (0.7 - 0.799)</option>
                <option value="medio-bajo">Medio/Bajo (Menos de 0.7)</option>
            </select>
        </div>

        <div class="filter-bar filter-bar-range">
            <div class="range-group">
                <label for="costo-min">Costo Total (Min):</label>
                <input
                    id="costo-min"
                    type="number"
                    bind:value={costoMin}
                    placeholder="Min. Costo"
                    min="0"
                    class="range-input"
                />
            </div>
            <div class="range-group">
                <label for="costo-max">Costo Total (Max):</label>
                <input
                    id="costo-max"
                    type="number"
                    bind:value={costoMax}
                    placeholder="Max. Costo"
                    min="0"
                    class="range-input"
                />
            </div>
            <div class="range-group">
                <label for="pob-min">Población (Min):</label>
                <input
                    id="pob-min"
                    type="number"
                    bind:value={poblacionMin}
                    placeholder="Min. Pob."
                    min="0"
                    class="range-input"
                />
            </div>
            <div class="range-group">
                <label for="pob-max">Población (Max):</label>
                <input
                    id="pob-max"
                    type="number"
                    bind:value={poblacionMax}
                    placeholder="Max. Pob."
                    min="0"
                    class="range-input"
                />
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <button on:click={() => setOrden("canton")} class="col-canton">
                    Cantón{getArrow("canton")}
                </button>
                <button
                    on:click={() => setOrden("provincia")}
                    class="col-provincia"
                >
                    Provincia{getArrow("provincia")}
                </button>
                <button
                    on:click={() => setOrden("costo")}
                    class="col-costo-total"
                >
                    Total (₡){getArrow("costo")}
                </button>
                <button on:click={() => setOrden("idh")} class="col-idh">
                    Población{getArrow("idh")}
                </button>
                <button
                    on:click={() => setOrden("vivienda")}
                    class="col-vivienda"
                >
                    Viv.{getArrow("vivienda")}
                </button>
                <button
                    on:click={() => setOrden("alimentacion")}
                    class="col-alimentacion"
                >
                    Aliment.{getArrow("alimentacion")}
                </button>
                <button
                    on:click={() => setOrden("transporte")}
                    class="col-transporte"
                >
                    Transp.{getArrow("transporte")}
                </button>
                <button
                    on:click={() => setOrden("servicios")}
                    class="col-servicios"
                >
                    Servic.{getArrow("servicios")}
                </button>
                <div class="col-otros">Salud</div>
                <div class="col-select">Sel.</div>
            </div>

            <div class="table-list-body">
                {#if mostrarResults}
                    {#each zonasFiltradasActuales as zona (zona.cantón)}
                        <div
                            class="table-row-list"
                            class:selected={zonaSeleccionada(zona.cantón)}
                            on:click={() => showModal(zona)}
                            on:keydown={(e) => {
                                if (e.key === "Enter") showModal(zona);
                            }}
                            tabindex="0"
                        >
                            <div class="col-canton">
                                <span
                                    class="idh-badge"
                                    style="background-color: {zona.color_idh}"
                                    title="Categoría IDH"
                                >
                                    {zona.idh.toFixed(3)}
                                </span>
                                <span class="region-badge" title="Región INEC"
                                    >{zona.region_inec}</span
                                >
                                {zona.cantón}
                            </div>
                            <div class="col-provincia">{zona.provincia}</div>
                            <div class="col-costo-total">
                                {formatNumber(zona.costo_total_estimado)}
                            </div>
                            <div class="col-idh">
                                {zona.poblacion.toLocaleString("es-CR")}
                            </div>
                            <div class="col-vivienda">
                                {formatNumber(zona.gastos?.vivienda)}
                            </div>
                            <div class="col-alimentacion">
                                {formatNumber(zona.gastos?.alimentacion)}
                            </div>
                            <div class="col-transporte">
                                {formatNumber(zona.gastos?.transporte)}
                            </div>
                            <div class="col-servicios">
                                {formatNumber(zona.gastos?.servicios)}
                            </div>
                            <div class="col-otros">
                                {formatNumber(zona.gastos?.salud)}
                            </div>
                            <div class="col-select">
                                <button
                                    on:click|stopPropagation={() =>
                                        toggleComparacion(zona)}
                                    class="comparison-toggle"
                                    title={zonaSeleccionada(zona.cantón)
                                        ? "Quitar de comparación"
                                        : "Añadir a comparación"}
                                >
                                    <i
                                        class="fas"
                                        class:fa-check-square={zonaSeleccionada(
                                            zona.cantón,
                                        )}
                                        class:fa-square={!zonaSeleccionada(
                                            zona.cantón,
                                        )}
                                    ></i>
                                </button>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <div class="no-results">
                        No se encontraron cantones que coincidan con los
                        filtros.
                    </div>
                {/if}
            </div>
        </div>

        <CantonTooltip
            {isModalVisible}
            canton={selectedCantonForModal}
            onClose={closeModal}
        />
    </section>
</div>

<style>
    /* 💡 INICIO DE VARIABLES CSS - Tema claro y oscuro */
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: "Inter", sans-serif;
        background-color: var(--background-color);
        color: var(--text-color);
        transition:
            background-color 0.3s,
            color 0.3s;
    }

    :global(html[data-theme="light"]) {
        --background-color: #f7f9fc;
        --card-background: #ffffff;
        --text-color: #333333;
        --color-primary: #0056b3;
        --color-secondary: #007bff;
        --color-accent: #ffc107;
        --border-color: #e0e0e0;
        --shadow-color: rgba(0, 0, 0, 0.08);
        --text-color-light: #333; /* Usado para botones deshabilitados */
        --chart-line-color: #cccccc;
    }

    :global(html[data-theme="dark"]) {
        --background-color: #1a1a2e;
        --card-background: #1f4068;
        --text-color: #ffffff;
        --color-primary: #45a29e;
        --color-secondary: #57b39a;
        --color-accent: #f9d342;
        --border-color: #3e4c70;
        --shadow-color: rgba(0, 0, 0, 0.4);
        --text-color-light: #aaa;
        --chart-line-color: #4c6888;
    }

    /* --- Estilos Generales --- */

    .main-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
    }

    header {
        text-align: center;
        margin-bottom: 40px;
        padding: 20px;
        position: relative;
    }

    header h1 {
        color: var(--color-primary);
        font-size: 2.5em;
        margin-bottom: 5px;
    }

    header p {
        color: var(--text-color);
        font-size: 1.1em;
        max-width: 800px;
        margin: 0 auto;
    }

    .theme-toggle {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--card-background);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2em;
        transition:
            background-color 0.3s,
            border-color 0.3s,
            color 0.3s;
    }

    .theme-toggle:hover {
        background-color: var(--background-color);
    }

    .divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 50px 0;
    }

    h2 {
        text-align: center;
        margin-bottom: 25px;
        font-size: 1.8em;
        color: var(--color-primary);
    }

    /* --- Sección de Resumen Estadístico --- */
    .summary-section {
        margin-bottom: 40px;
    }

    .summary-card-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }

    .summary-card {
        background: var(--card-background);
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        text-align: center;
        border-left: 5px solid var(--color-primary);
    }

    .summary-card i {
        font-size: 2.5em;
        margin-bottom: 10px;
    }

    .summary-card p {
        margin: 0;
        font-size: 1em;
        color: var(--text-color);
    }

    .summary-value {
        font-size: 2.2em;
        font-weight: bold;
        display: block;
        margin-top: 5px;
    }

    /* Colores específicos para las métricas */
    .icon-costo,
    .value-costo {
        color: #00a300; /* Verde */
    }

    .icon-idh,
    .value-idh {
        color: var(--color-primary); /* Azul/Principal */
    }

    .icon-cantones,
    .value-cantones {
        color: #ffc107; /* Amarillo */
    }

    /* Media Query Responsive para el resumen */
    @media (max-width: 768px) {
        .summary-card-container {
            grid-template-columns: 1fr; /* Apilar las tarjetas en móviles */
        }
    }

    /* --- FIN Sección de Resumen Estadístico --- */

    /* Sección de Comparación */
    .comparison-section {
        background: var(--card-background);
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        margin-bottom: 40px;
        border: 1px solid var(--border-color);
    }

    .controls-container {
        display: grid;
        grid-template-columns: 2fr max-content 2fr 1fr 1fr;
        gap: 20px;
        align-items: center;
        margin-bottom: 30px;
    }

    .comparison-group {
        display: flex;
        gap: 10px;
    }

    .controls-container select,
    .controls-container button {
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 1em;
    }

    .comparison-group select {
        flex: 1;
        border: 1px solid var(--border-color);
        background-color: var(--background-color);
        color: var(--text-color);
        transition: border-color 0.3s;
    }

    .comparison-group select:focus {
        border-color: var(--color-primary);
        outline: none;
    }

    .separator-vs {
        font-weight: bold;
        color: var(--color-primary);
        font-size: 1.2em;
    }

    .compare-button,
    .reset-button {
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition:
            background-color 0.3s,
            opacity 0.3s;
    }

    .compare-button {
        background-color: #00a300; /* Verde de comparación */
        color: white;
        border: none;
    }

    .compare-button:hover:not(:disabled) {
        background-color: #007f00;
    }

    .reset-button {
        background-color: var(--color-secondary);
        color: white;
        border: none;
    }

    .reset-button:hover {
        background-color: #0056b3;
    }

    .compare-button:disabled {
        background-color: var(--border-color);
        color: var(--text-color-light);
        cursor: not-allowed;
    }

    .chart-container {
        margin-top: 30px;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
    }

    .chart-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
    }

    .chart-controls label {
        font-weight: 600;
        color: var(--text-color);
    }

    .chart-controls select {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background-color: var(--background-color);
        color: var(--text-color);
    }

    /* Media Query para la sección de comparación */
    @media (max-width: 1000px) {
        .controls-container {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .comparison-group {
            flex-direction: column;
            gap: 10px;
        }

        .separator-vs {
            margin: 10px 0;
        }

        .chart-controls {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    /* --- Sección de Exploración (Tabla) --- */
    .table-section {
        margin-top: 40px;
    }

    .filter-bar {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }

    .search-input,
    .region-select,
    .idh-select {
        padding: 10px 15px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 1em;
        flex: 1;
        min-width: 150px;
        background-color: var(--card-background);
        color: var(--text-color);
    }

    .search-input:focus,
    .region-select:focus,
    .idh-select:focus {
        border-color: var(--color-primary);
        outline: none;
    }

    /* 📌 Estilos para los inputs de rango */
    .filter-bar-range {
        /* Permite que los 4 inputs de rango se muestren en varios grupos de input */
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
    }

    .range-group {
        display: flex;
        flex-direction: column;
        gap: 5px; /* Alinea mejor los grupos para que no se separen de su label */
        background-color: var(--card-background);
        padding: 5px;
        border-radius: 8px;
    }

    .range-group label {
        font-size: 0.9em;
        font-weight: 600;
        color: var(--color-secondary);
    }

    .range-input {
        /* Reutilizamos el estilo del input principal */
        flex: 1;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--background-color);
        color: var(--text-color);
        font-size: 1em;
        /* Para ocultar flechas de inputs numéricos */
        -moz-appearance: textfield;
    }

    .range-input::-webkit-outer-spin-button,
    .range-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    @media (max-width: 700px) {
        .filter-bar-range {
            grid-template-columns: 1fr;
        }
    }

    /* Estilos de la Tabla */
    .table-container {
        background: var(--card-background);
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        overflow-x: auto; /* Permite scroll horizontal en móviles */
    }

    .table-header,
    .table-row-list {
        display: grid;
        /* Definición de columnas para el layout de la tabla */
        grid-template-columns: 2fr 1.2fr 1.5fr 1.2fr 1fr 1fr 1fr 1fr 1fr 0.5fr;
        gap: 15px;
        padding: 15px 20px;
        align-items: center;
        min-width: 1000px; /* Asegura que se desborde en pantallas pequeñas */
    }

    .table-header {
        background-color: var(--background-color);
        font-weight: bold;
        border-bottom: 2px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .table-header button {
        background: none;
        border: none;
        color: var(--color-primary);
        font-weight: bold;
        text-align: left;
        padding: 0;
        cursor: pointer;
        font-size: 1em;
        transition: color 0.2s;
    }

    .table-header button:hover {
        color: var(--color-secondary);
    }

    .col-costo-total,
    .col-idh,
    .col-vivienda,
    .col-alimentacion,
    .col-transporte,
    .col-servicios,
    .col-otros {
        text-align: right;
    }

    .table-list-body {
        max-height: 60vh;
        overflow-y: auto;
    }

    .table-row-list {
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .table-row-list:hover {
        background-color: var(--background-color);
    }

    .table-row-list.selected {
        background-color: rgba(
            0,
            86,
            179,
            0.1
        ); /* Color claro para la fila seleccionada */
        border-left: 5px solid var(--color-primary);
        padding-left: 15px; /* Compensa el padding por el borde */
    }

    .no-results {
        padding: 20px;
        text-align: center;
        color: var(--text-color);
        font-style: italic;
    }

    /* Estilos de Insignias (Badges) */
    .col-canton {
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .idh-badge,
    .region-badge {
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 0.7em;
        font-weight: bold;
        color: white;
    }

    .region-badge {
        background-color: var(
            --color-secondary
        ); /* Color secundario para región */
    }

    /* Formato de valores en la fila */
    .col-costo-total {
        font-weight: bold;
        color: #00a300;
    }

    .col-provincia,
    .col-idh,
    .col-vivienda,
    .col-alimentacion,
    .col-transporte,
    .col-servicios,
    .col-otros {
        font-size: 0.9em;
        opacity: 0.9;
        color: var(--text-color);
        white-space: nowrap;
    }

    .comparison-toggle {
        background: none;
        border: none;
        color: var(--color-secondary);
        cursor: pointer;
        padding: 0;
        font-size: 1.2em;
        transition: color 0.2s;
    }

    .comparison-toggle:hover {
        color: var(--color-primary);
    }

    .comparison-toggle .fa-check-square {
        color: #00a300; /* Verde si está seleccionado */
    }

    /* Media Query para la Tabla (Móvil) */
    @media (max-width: 900px) {
        .table-header,
        .table-row-list {
            /* Cantón | Total | Vivienda | Aliment. | Select */
            grid-template-columns: 1.5fr 1fr 0.8fr 0.8fr 0.5fr;
            font-size: 0.85em;
        }

        .col-provincia,
        .col-idh,
        .col-transporte,
        .col-servicios,
        .col-otros {
            display: none;
        }

        .table-container {
            border-radius: 0;
        }
    }

    /* 💡 NUEVOS ESTILOS PARA EL DESPLEGABLE */

    .budget-calculator-section {
        background: var(--card-background);
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        margin-bottom: 40px;
        border: 1px solid var(--border-color);
        overflow: hidden;
    }

    .collapsible-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 30px;
        cursor: pointer;
        background-color: var(--background-color);
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.3s;
    }

    .collapsible-header:hover {
        background-color: var(--border-color);
    }

    /* Remover el margen del H2 en la cabecera */
    .collapsible-header h2 {
        margin: 0;
        font-size: 1.5em;
        color: var(--color-primary);
        text-align: left;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 0;
    }

    .collapsible-header i {
        font-size: 1.2em;
        color: var(--color-secondary);
        transition: transform 0.3s;
    }

    /* El contenido solo necesita el padding, la visibilidad la controla Svelte con #if */
    .collapsible-content {
        padding: 20px 30px;
    }
</style>
