<script>
    // @ts-nocheck
    import { onMount, setContext } from "svelte";
    import ComparisonChart from "$lib/components/ComparisonChart.svelte";
    import DistributionChart from "$lib/components/DistributionChart.svelte";
    import CantonTooltip from "$lib/components/CantonTooltip.svelte";

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
    // ...

    // Inicialización de datos y aplicación del filtro
    const todasLasZonasRaw = data?.costos || [];
    // Integración de datos: Añadir mock data de Población e IDH
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

    // Variables de estado para la comparación
    let provinciaSeleccionada1 = "";
    let cantonSeleccionado1 = "";
    let provinciaSeleccionada2 = "";
    let cantonSeleccionado2 = "";

    // Variables de estado para la tabla y filtros
    let gastoComparacionSeleccionada = "";
    let presentacionSeleccionada = "todas";
    let idhSeleccionado = "todas";
    let zonasFiltradasActuales = todasLasZonas;
    let zonasParaComparar = [];
    let mostrarResults = true;

    // 🆕 ESTADOS para filtros de rango (Costo y Población)
    let costoMin = null;
    let costoMax = null;
    let poblacionMin = null;
    let poblacionMax = null;

    // Variables de estado para ordenamiento
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado";

    // ESTADOS para promedios nacionales (Resumen)
    let promedioNacionalIDH = 0;
    let promedioNacionalCosto = 0;

    // 🆕 ESTADO para todos los promedios de rubros (Usado en ComparisonChart)
    let promediosParaComparacion = {};

    // ESTADO PARA EL MODAL DE DETALLES
    let isModalVisible = false;
    let selectedCantonForModal = {};

    // Tema
    let theme = "light";
    setContext("theme", { theme });

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

            // 2. 🆕 Calcular Promedios por Rubro para el ComparisonChart
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

        // 🆕 FILTRADO POR RANGO DE COSTO TOTAL
        // NOTA: type="number" en Svelte bindea a number si tiene valor, o null si está vacío.
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

        // 🆕 FILTRADO POR RANGO DE POBLACIÓN (usando el campo simulado 'poblacion')
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

    // 🎯 FUNCIÓN CORREGIDA (Permite la selección y deselección correcta)
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
                // 🆕 Carga de filtros de rango
                costoMin = state.costoMin ?? null;
                costoMax = state.costoMax ?? null;
                poblacionMin = state.poblacionMin ?? null;
                poblacionMax = state.poblacionMax ?? null;
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

        // 🆕 Limpiar filtros de rango
        costoMin = null;
        costoMax = null;
        poblacionMin = null;
        poblacionMax = null;

        // 3. Reinicia el ordenamiento y la categoría del gráfico
        criterioOrden = "costo";
        direccionOrden = "desc";
        categoriaComparacion = "costo_total_estimado";
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
                // 🆕 Guardar filtros de rango
                costoMin: costoMin,
                costoMax: costoMax,
                poblacionMin: poblacionMin,
                poblacionMax: poblacionMax,
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
                <button
                    on:click={() => setOrden("canton")}
                    class="col-canton header-button"
                >
                    Cantón {getArrow("canton")}
                </button>
                <button
                    on:click={() => setOrden("provincia")}
                    class="col-provincia header-button"
                >
                    Provincia {getArrow("provincia")}
                </button>
                <button
                    on:click={() => setOrden("costo")}
                    class="col-costo-total header-button"
                >
                    Total (₡) {getArrow("costo")}
                </button>
                <button
                    on:click={() => setOrden("idh")}
                    class="col-idh header-button"
                >
                    IDH {getArrow("idh")}
                </button>
                <button
                    on:click={() => setOrden("vivienda")}
                    class="col-vivienda header-button"
                >
                    Vivienda {getArrow("vivienda")}
                </button>
                <button
                    on:click={() => setOrden("alimentacion")}
                    class="col-alimentacion header-button"
                >
                    Alimentos {getArrow("alimentacion")}
                </button>
                <button
                    on:click={() => setOrden("transporte")}
                    class="col-transporte header-button"
                >
                    Transp. {getArrow("transporte")}
                </button>
                <button
                    on:click={() => setOrden("servicios")}
                    class="col-servicios header-button"
                >
                    Servic. {getArrow("servicios")}
                </button>
                <button
                    on:click={() => setOrden("salud")}
                    class="col-otros header-button"
                >
                    Salud {getArrow("salud")}
                </button>
            </div>

            {#if mostrarResults}
                {#each zonasFiltradasActuales as zona (zona.cantón)}
                    <div
                        class="table-row-list"
                        data-canton={zona.cantón}
                        class:selected={zonaSeleccionada(zona.cantón)}
                    >
                        <div class="col-canton">
                            <button
                                on:click={() => toggleComparacion(zona)}
                                class="comparison-toggle"
                                aria-label="Agregar a comparación"
                                title="Comparar {zona.cantón}"
                            >
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <span class="canton-name">{zona.cantón}</span>
                            <span class="region-badge" title="Región INEC"
                                >{zona.region_inec}</span
                            >
                        </div>
                        <div class="col-provincia">{zona.provincia}</div>
                        <div class="col-costo-total">
                            {formatNumber(zona.costo_total_estimado)}
                        </div>
                        <div
                            class="col-idh"
                            style="--idh-color: {zona.color_idh}"
                            on:click={() => showModal(zona)}
                        >
                            {zona.idh.toFixed(3)}
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
                    </div>
                {/each}
            {:else}
                <div class="no-results">
                    No se encontraron cantones que coincidan con los filtros.
                </div>
            {/if}
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
        --text-color-light: #ffffff; /* Usado para botones deshabilitados */
        --chart-line-color: #3e4c70;
    }

    .main-container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 20px;
    }

    header {
        text-align: center;
        margin-bottom: 40px;
        position: relative;
    }

    header h1 {
        color: var(--color-primary);
        font-size: 2.5em;
        margin-bottom: 0.1em;
    }

    header p {
        color: var(--text-color);
        opacity: 0.8;
        font-size: 1.1em;
    }

    .divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 40px 0;
    }

    .theme-toggle {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--card-background);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 10px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2em;
        transition:
            background-color 0.3s,
            border-color 0.3s;
    }

    .theme-toggle:hover {
        background: var(--border-color);
    }

    h2 {
        color: var(--color-secondary);
        border-bottom: 2px solid var(--color-primary);
        padding-bottom: 5px;
        margin-top: 20px;
        font-size: 1.8em;
    }

    /* --- Sección de Resumen Estadístico --- */
    .summary-section {
        margin-bottom: 30px;
        padding: 10px 0;
    }

    .summary-section h2 {
        border-bottom: none;
        font-size: 1.5em;
        padding-bottom: 0;
        margin-bottom: 15px;
        color: var(--text-color);
    }

    .summary-card-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }

    .summary-card {
        background: var(--card-background);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px var(--shadow-color);
        border-left: 5px solid var(--color-primary);
        text-align: center;
    }

    .summary-card i {
        font-size: 2.5em;
        margin-bottom: 10px;
    }

    .summary-card p {
        margin: 0;
        font-size: 0.9em;
        color: var(--text-color);
        opacity: 0.8;
    }

    .summary-value {
        display: block;
        font-size: 1.8em;
        font-weight: 700;
        margin-top: 5px;
    }

    /* Colores específicos para los valores */
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

    .reset-button {
        background-color: var(--border-color);
        color: var(--text-color);
        border: 1px solid var(--text-color);
    }

    .reset-button:hover {
        background-color: var(--color-accent);
    }

    .chart-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 20px;
        padding: 20px;
        border-radius: 8px;
        background-color: var(--background-color);
        border: 1px dashed var(--border-color);
    }

    .chart-controls {
        display: flex;
        gap: 15px;
        align-items: center;
        justify-content: flex-start;
        font-weight: 600;
        color: var(--color-secondary);
    }

    .chart-controls select {
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background-color: var(--card-background);
        color: var(--text-color);
    }

    .distribution-chart {
        margin-top: 40px;
    }
    .distribution-chart h3 {
        text-align: center;
        color: var(--color-primary);
        margin-bottom: 20px;
    }

    /* Sección de Tabla */
    .table-section {
        padding: 20px;
    }

    .filter-bar {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
    }

    .search-input,
    .region-select,
    .idh-select {
        flex: 1;
        padding: 12px 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--card-background);
        color: var(--text-color);
        font-size: 1em;
        transition: border-color 0.3s;
    }

    .search-input:focus,
    .region-select:focus,
    .idh-select:focus {
        border-color: var(--color-primary);
        outline: none;
    }

    /* 🆕 Estilos de la nueva barra de filtros de rango */
    .filter-bar-range {
        margin-top: -5px; /* Ajuste visual */
        margin-bottom: 20px;
        /* Cambiar el layout para que se vea bien en varios grupos de input */
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
    }

    .range-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        /* Alinea mejor los grupos para que no se separen de su label */
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
    /* 📌 FIN Estilos de rango */

    .table-container {
        overflow-x: auto;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--card-background);
    }

    .table-header,
    .table-row-list {
        /* COLUMNAS ACTUALIZADAS: 1.5fr (Cantón) + 1fr (Provincia) + 0.8fr (Total) + 0.5fr (IDH) + 5 * 0.7fr (Gastos) */
        display: grid;
        grid-template-columns: 1.5fr 1fr 0.8fr 0.5fr repeat(5, 0.7fr);
        padding: 8px 20px;
        border-bottom: 1px solid var(--border-color);
        align-items: center;
        gap: 10px;
    }

    .table-header {
        background-color: var(--color-primary);
        color: white;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 10;
        text-align: left;
    }

    .header-button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        text-align: inherit;
        font-size: 1em;
        font-weight: inherit;
        cursor: pointer;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .header-button:hover {
        opacity: 0.8;
    }

    .table-row-list {
        background-color: var(--card-background);
        transition: background-color 0.2s;
        cursor: default;
    }

    .table-row-list:nth-child(even) {
        background-color: var(--background-color);
    }

    .table-row-list.selected {
        /* Cantones seleccionados para comparación */
        background-color: rgba(0, 115, 230, 0.15); /* Azul claro */
        border-left: 5px solid var(--color-primary);
        padding-left: 15px; /* Ajuste para el border-left */
        font-weight: 600;
    }
    .table-row-list.selected:nth-child(even) {
        background-color: rgba(0, 115, 230, 0.2);
    }

    /* Columna de Cantón */
    .col-canton {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: var(--text-color);
    }

    /* Indicador de región INEC */
    .region-badge {
        font-size: 0.7em;
        font-weight: 700;
        color: var(--color-primary);
        background-color: var(--border-color);
        padding: 3px 6px;
        border-radius: 4px;
        white-space: nowrap;
    }

    /* Columna de IDH */
    .col-idh {
        font-weight: 700;
        color: var(--idh-color); /* Usado el CSS variable */
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer; /* AHORA ES CLICKEABLE */
        transition: background-color 0.2s;
    }

    .col-idh:hover {
        background-color: var(
            --border-color
        ); /* Realzar la columna IDH al hacer hover */
    }

    /* Columna de Costo Total */
    .col-costo-total {
        font-weight: 700;
        color: #00a300; /* Verde para el costo total */
    }

    /* Columnas de gastos */
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

    .table-row-list.selected .comparison-toggle {
        color: #dc3545; /* Rojo para indicar que se puede quitar */
    }

    .no-results {
        padding: 20px;
        text-align: center;
        color: var(--text-color);
        font-style: italic;
    }

    /* Estilos del Botón de Comparar (Para asegurar el hover) */
    .compare-button:hover:not(:disabled) {
        background-color: #489e87;
    }

    .compare-button:disabled {
        background-color: var(--border-color, #e0e0e0);
        color: var(--text-color-light, #333);
        cursor: not-allowed;
        opacity: 0.7;
    }

    /* Media Queries Responsive */
    @media (max-width: 1000px) {
        /* Ocultamos más columnas para la vista móvil, dejando solo Cantón, Provincia, Total e IDH */
        .table-header,
        .table-row-list {
            grid-template-columns: 1.5fr 1fr 1fr 0.8fr; /* Cantón | Provincia | Total | IDH */
        }
        .col-idh {
            display: flex; /* Asegura que IDH se muestre */
        }
        .col-vivienda,
        .col-alimentacion,
        .col-transporte,
        .col-servicios,
        .col-otros {
            display: none;
        }

        .controls-container {
            grid-template-columns: 1fr;
            gap: 15px;
        }

        .filter-bar {
            flex-direction: column; /* Apilar filtros de categoría */
        }
        .filter-bar-range {
            grid-template-columns: 1fr 1fr; /* 2 columnas en móvil para los 4 rangos */
        }
    }
</style>
