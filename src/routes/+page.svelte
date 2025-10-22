<script>
    // @ts-nocheck

    import DistributionChart from "$lib/components/DistributionChart.svelte";

    export let data;

    // 1. CONTROL DE VISTA
    let mostrarBienvenida = true;
    const entrarAPagina = () => {
        mostrarBienvenida = false;
        aplicarFiltros();
    };

    // 2. DATOS BASE
    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios;

    // 3. ESTADOS DE LOS FILTROS
    let provinciaSeleccionada = "";
    let cantonSeleccionado = "";
    let gastoComparacionSeleccionada = "";
    let presentacionSeleccionada = "todas";

    // ** Estado para almacenar y mostrar los resultados después de CONSULTAR **
    let zonasFiltradasActuales = todasLasZonas;
    let mostrarResultados = false;

    // 4. LÓGICA PARA OBTENER OPCIONES ÚNICAS (Reactividad de Selectores)
    $: todasLasProvincias = [
        ...new Set(todasLasZonas.map((z) => z.provincia)),
    ].sort();

    $: cantonesDisponibles = todasLasZonas
        .filter((z) => {
            if (provinciaSeleccionada) {
                return z.provincia === provinciaSeleccionada;
            }
            return true;
        })
        .map((z) => z.distrito);

    $: todosLosCantones = [...new Set(cantonesDisponibles)].sort();

    const opcionesTipoGasto = [
        { key: "", label: "-- SELECCIONE GASTO --" },
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
        // 🌟 CAMBIO: Agregar rubros de prueba
        { key: "salud", label: "Salud" },
        { key: "educacion", label: "Educación" },
    ];

    // 5. LÓGICA DE FILTRADO Y BOTÓN CONSULTAR
    const aplicarFiltros = () => {
        let filtrosAplicados = todasLasZonas.filter((zona) => {
            let coincideProvincia = true;
            let coincideCanton = true;

            if (provinciaSeleccionada) {
                coincideProvincia = zona.provincia === provinciaSeleccionada;
            }

            if (cantonSeleccionado) {
                coincideCanton = zona.distrito === cantonSeleccionado;
            }

            return coincideProvincia && coincideCanton;
        });

        // Ordenar los resultados (se mantiene la lógica de ordenamiento)
        zonasFiltradasActuales = filtrosAplicados.sort((a, b) => {
            let valA, valB;
            const key =
                criterioOrden === "costo" ? categoriaComparacion : "provincia";

            if (criterioOrden === "costo") {
                // Se debe asumir que el campo ya existe en tus datos originales o manejar un valor por defecto.
                // Aquí usamos a.gastos[key] que debe manejar los nuevos campos.
                valA =
                    key === "costo_total_estimado"
                        ? a.costo_total_estimado
                        : a.gastos[key] || 0; // Añadido || 0 por seguridad
                valB =
                    key === "costo_total_estimado"
                        ? b.costo_total_estimado
                        : b.gastos[key] || 0; // Añadido || 0 por seguridad
            } else {
                valA = a.provincia;
                valB = b.provincia;
            }

            if (valA < valB) return direccionOrden === "asc" ? -1 : 1;
            if (valA > valB) return direccionOrden === "asc" ? 1 : -1;
            return 0;
        });

        mostrarResultados = true;
    };

    $: if (provinciaSeleccionada) {
        cantonSeleccionado = "";
    }

    // 6. LÓGICA DE ORDENAMIENTO (se mantiene)
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado";

    const categorias = [
        { key: "costo_total_estimado", label: "Costo Total Estimado" },
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
        // 🌟 CAMBIO: Agregar rubros de prueba
        { key: "salud", label: "Salud" },
        { key: "educacion", label: "Educación" },
    ];

    const cambiarDireccion = (criterio) => {
        if (criterioOrden === criterio) {
            direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
        } else {
            criterioOrden = criterio;
            direccionOrden = "desc";
        }
        aplicarFiltros();
    };

    // 7. FUNCIONES AUXILIARES

    // NUEVA FUNCIÓN: Obtiene el valor principal a mostrar en la tarjeta
    const getCostoPrincipal = (zona) => {
        if (
            presentacionSeleccionada === "gasto_especifico" &&
            gastoComparacionSeleccionada
        ) {
            const label =
                opcionesTipoGasto.find(
                    (op) => op.key === gastoComparacionSeleccionada,
                )?.label || "Gasto";
            // ⚠️ AHORA SE BUSCA EL VALOR EN LOS DATOS EXISTENTES, CAYENDO EN 0 SI NO EXISTE (ej. salud/educacion)
            const value = zona.gastos[gastoComparacionSeleccionada] || 0;
            return {
                label: `Costo de ${label}:`,
                valor: value,
                key: gastoComparacionSeleccionada,
            };
        }
        return {
            label: "Costo Total Estimado:",
            valor: zona.costo_total_estimado,
            key: "costo_total_estimado",
        };
    };

    const getSortIndicator = (criterio) => {
        if (criterioOrden !== criterio) return "";
        return direccionOrden === "asc" ? " ⬆️" : " ⬇️";
    };

    const safeFormat = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR");
    };

    const getComparisonIndicator = (zona, key) => {
        // ⚠️ Se asume que tu estructura de datos es:
        // zona.gastos = { vivienda: X, alimentacion: Y, ... }
        // promediosNacionales.gastos = { vivienda: A, alimentacion: B, ... }

        const zonaValor =
            key === "costo_total_estimado"
                ? zona.costo_total_estimado
                : // ⚠️ Se usa 0 si no existe la clave de gasto (para los rubros simulados)
                  zona.gastos[key] || 0;
        const promedioValor =
            key === "costo_total_estimado"
                ? promediosNacionales.costo_total_estimado
                : // ⚠️ Se usa 0 si no existe la clave de gasto (para los rubros simulados)
                  promediosNacionales.gastos[key] || 0;

        if (zonaValor > promedioValor * 1.05)
            return '<span class="up-arrow">⬆️</span>';
        if (zonaValor < promedioValor * 0.95)
            return '<span class="down-arrow">⬇️</span>';
        return "➖";
    };

    // 8. LÓGICA DEL GRÁFICO DE DISTRIBUCIÓN

    $: zonaParaDistribucion =
        zonasFiltradasActuales.length > 0 && cantonSeleccionado
            ? zonasFiltradasActuales[0]
            : {
                  distrito: "Nacional (Promedio)",
                  gastos: promediosNacionales?.gastos,
                  costo_total_estimado:
                      promediosNacionales?.costo_total_estimado,
              };

    // 🌟 CAMBIO: Se ajusta para incluir los 5 rubros originales MÁS los rubros simulados.
    // Esto es solo para la presentación en el gráfico si los datos reales no los traen.
    $: datosDistribucion = (() => {
        // Rubros base (Vivienda, Alimentación, Transporte, Servicios, Ocio)
        let datosBase = zonaParaDistribucion.gastos
            ? Object.entries(zonaParaDistribucion.gastos).map(
                  ([key, value]) => ({
                      rubro:
                          categorias.find((c) => c.key === key)?.label || key,
                      valor: value,
                      clave: key,
                  }),
              )
            : [];

        // Simulación de valores para Salud y Educación
        // Esto solo es necesario si tu backend NO los incluye,
        // y solo para fines de visualización de cómo se vería con más datos.
        const rubrosSimulados = [
            {
                key: "salud",
                label: "Salud",
                valorSimulado:
                    (zonaParaDistribucion.costo_total_estimado ||
                        promediosNacionales?.costo_total_estimado ||
                        100000) * 0.05,
            }, // 5% del total
            {
                key: "educacion",
                label: "Educación",
                valorSimulado:
                    (zonaParaDistribucion.costo_total_estimado ||
                        promediosNacionales?.costo_total_estimado ||
                        100000) * 0.03,
            }, // 3% del total
        ];

        // Se verifica si los rubros simulados ya existen en datosBase (si tus datos reales los incluyen)
        // y se agregan si no existen.
        rubrosSimulados.forEach((simulado) => {
            if (!datosBase.some((d) => d.clave === simulado.key)) {
                datosBase.push({
                    rubro: simulado.label,
                    valor:
                        zonaParaDistribucion.gastos?.[simulado.key] ||
                        simulado.valorSimulado,
                    clave: simulado.key,
                });
            }
        });

        return datosBase;
    })();
</script>

{#if mostrarBienvenida}
    <div class="pantalla-bienvenida">
        <div class="contenido-bienvenida">
            <h1>
                Descubra y compara el Costo de Vida en Costa Rica por Zonas
                Geográficas.
            </h1>

            <p>
                Analiza el costo promedio de Vivienda, Alimentación, Transporte
                y más en diferentes provincias y distritos del país.
            </p>
            <button on:click={entrarAPagina}>Explorar Ahora 🚀</button>
        </div>
        <div class="cargando-data">
            <p>Mi contacto: https://github.com/xxyemaxx</p>
        </div>
    </div>
{:else}
    <h1 class="main-title">Costo de Vida por Zonas en Costa Rica</h1>

    <div class="main-content-container">
        <div class="filter-group">
            <div class="filter-item">
                <label for="provincia-select">Provincia</label>
                <select
                    id="provincia-select"
                    bind:value={provinciaSeleccionada}
                >
                    <option value="">-- SELECCIONE --</option>
                    {#each todasLasProvincias as provincia (provincia)}
                        <option value={provincia}>{provincia}</option>
                    {/each}
                </select>
            </div>

            <div class="filter-item">
                <label for="canton-select">Distrito</label>
                <select id="canton-select" bind:value={cantonSeleccionado}>
                    <option value="">-- SELECCIONE --</option>
                    {#each todosLosCantones as canton (canton)}
                        <option value={canton}>{canton}</option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="filter-group">
            <div class="filter-item">
                <label for="gasto-select">Tipo de Gasto</label>
                <select
                    id="gasto-select"
                    bind:value={gastoComparacionSeleccionada}
                >
                    {#each opcionesTipoGasto as op}
                        <option value={op.key}>{op.label}</option>
                    {/each}
                </select>
            </div>
            <div class="filter-item">
                <label for="presentacion-select"
                    >Presentación de Resultados</label
                >
                <select
                    id="presentacion-select"
                    bind:value={presentacionSeleccionada}
                    disabled={!!cantonSeleccionado}
                >
                    <option value="todas">Costo Total + Desglose</option>
                    <option value="total">Solo Costo Total</option>
                    <option
                        value="gasto_especifico"
                        disabled={!gastoComparacionSeleccionada}
                    >
                        Solo Costo de Gasto Específico
                    </option>
                </select>
            </div>
        </div>

        <button class="consultar-button" on:click={aplicarFiltros}
            >Consultar Resultados</button
        >

        {#if mostrarResultados}
            <div class="results-section">
                {#if datosDistribucion.length > 0}
                    <div class="chart-container distribution-chart">
                        <h2>
                            Distribución de Gastos en <span
                                class="highlight-text"
                                >{zonaParaDistribucion.distrito}</span
                            >
                        </h2>
                        <DistributionChart
                            data={datosDistribucion}
                            total={zonaParaDistribucion.costo_total_estimado}
                        />
                    </div>
                {/if}

                <div class="promedio-box">
                    <h3>Costo de Vida Promedio Nacional (Estimado)</h3>
                    <p class="promedio-valor">
                        ₡{safeFormat(promediosNacionales.costo_total_estimado)}
                    </p>
                </div>

                <div class="orden-box">
                    <p>
                        Mostrando **{zonasFiltradasActuales.length}** de {todasLasZonas.length}
                        zonas geográficas.
                    </p>
                    <div>
                        <button on:click={() => cambiarDireccion("costo")}>
                            Ordenar por {categorias.find(
                                (c) => c.key === categoriaComparacion,
                            ).label}{@html getSortIndicator("costo")}
                        </button>
                        <button on:click={() => cambiarDireccion("provincia")}>
                            Ordenar por Provincia{@html getSortIndicator(
                                "provincia",
                            )}
                        </button>
                    </div>
                </div>

                <div class="card-container">
                    {#each zonasFiltradasActuales as zona}
                        <div class="card">
                            <h2>
                                Zona {zona.zona}: {zona.distrito}, {zona.provincia}
                            </h2>

                            {#if getCostoPrincipal(zona).valor > 0}
                                <p class="total">
                                    {getCostoPrincipal(zona).label} ₡{safeFormat(
                                        getCostoPrincipal(zona).valor,
                                    )}
                                    {@html getComparisonIndicator(
                                        zona,
                                        getCostoPrincipal(zona).key,
                                    )}
                                </p>
                            {/if}

                            {#if presentacionSeleccionada === "todas"}
                                <h3>Desglose de Gastos:</h3>
                                <ul>
                                    <li>
                                        Vivienda: ₡{safeFormat(
                                            zona.gastos.vivienda,
                                        )}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "vivienda",
                                        )}
                                    </li>
                                    <li>
                                        Alimentación: ₡{safeFormat(
                                            zona.gastos.alimentacion,
                                        )}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "alimentacion",
                                        )}
                                    </li>
                                    <li>
                                        Transporte: ₡{safeFormat(
                                            zona.gastos.transporte,
                                        )}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "transporte",
                                        )}
                                    </li>
                                    <li>
                                        Servicios: ₡{safeFormat(
                                            zona.gastos.servicios,
                                        )}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "servicios",
                                        )}
                                    </li>
                                    <li>
                                        Ocio: ₡{safeFormat(zona.gastos.ocio)}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "ocio",
                                        )}
                                    </li>
                                    <li>
                                        Salud: ₡{safeFormat(
                                            zona.gastos.salud || 0,
                                        )}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "salud",
                                        )}
                                    </li>
                                    <li>
                                        Educación: ₡{safeFormat(
                                            zona.gastos.educacion || 0,
                                        )}
                                        {@html getComparisonIndicator(
                                            zona,
                                            "educacion",
                                        )}
                                    </li>
                                </ul>
                            {/if}

                            <div
                                style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px;"
                            >
                                <h3>📊 Referencias Oficiales (INEC)</h3>
                                <p>
                                    <strong>IPC Nacional:</strong>
                                    {safeFormat(zona.referencia_ipc_nacional)} (Base
                                    2020)
                                </p>
                                <p>
                                    <strong>CBA Regional:</strong>
                                    ₡{safeFormat(zona.cba_per_capita_regional)} (Región
                                    {zona.region_inec})
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <p class="no-results-placeholder">
                Presione "Consultar Resultados" para ver los datos filtrados.
            </p>
        {/if}
    </div>

    <footer class="app-footer">
        <button
            class="boton-volver"
            on:click={() => (mostrarBienvenida = true)}
        >
            ← Volver a la Bienvenida
        </button>
        <p>
            Mi contacto: <a href="https://github.com/xxyemaxx"
                >https://github.com/xxyemaxx</a
            >
        </p>
    </footer>
{/if}

<style>
    /* ---------------------------------- */
    /* 1. Variables y Estilos Globales con la Paleta INEC */
    /* ---------------------------------- */
    :global(body) {
        /* Paleta de colores profesionales de INEC (Basado en CR bandera) */
        --color-main-bg: #f4f7f6; /* Fondo gris muy claro */
        --color-text-dark: #004d99; /* AZUL INEC: Principal para títulos, texto fuerte, elementos clave */
        --color-text-secondary: #7f8c8d;
        --color-border-light: #ecf0f1;

        --color-action-primary: #c60c30; /* ROJO INEC: Énfasis, flechas, botones de orden/volver */
        --color-action-dark: #990022;

        --color-consultar-button: #004d99; /* AZUL INEC: Botón principal */
        --color-consultar-dark: #003366;

        --color-highlight-danger: #c60c30; /* Rojo INEC para indicar valores altos */
        --color-highlight-success: #28a745; /* Mantener verde estándar para valores bajos (bueno) */

        --color-card-bg: #ffffff;

        /* Tipografía oficial y sobria para un aspecto de "Informe" */
        font-family: "Arial", "Helvetica Neue", Helvetica, sans-serif;
        background-color: var(--color-main-bg);
        color: var(--color-text-dark);
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    /* ---------------------------------- */
    /* 2. Pantalla de Bienvenida (Ajustada al Azul INEC) */
    /* ---------------------------------- */
    .pantalla-bienvenida {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        /* Degradado usando el Azul INEC corporativo */
        background: linear-gradient(
            160deg,
            #004d99 0%,
            #003366 40%,
            #001a33 100%
        );
        color: white;
        text-align: center;
        z-index: 9999;
        padding: 20px;
        box-sizing: border-box;
        font-family: "Arial", "Helvetica Neue", Helvetica, sans-serif;
    }

    .contenido-bienvenida {
        max-width: 700px;
        background-color: rgba(255, 255, 255, 0.15);
        padding: 40px 30px;
        border-radius: 15px;
        backdrop-filter: blur(5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .pantalla-bienvenida h1 {
        font-size: 3.5em;
        font-weight: 800;
        margin-top: 0;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    /* ... el resto de la bienvenida se mantiene ... */
    .pantalla-bienvenida button {
        /* Color de acento para el botón de inicio */
        background-color: #ff9900; /* Mantiene el naranja/amarillo como contraste */
        color: var(--color-consultar-dark);
        border: none;
        padding: 15px 30px;
        font-size: 1.2em;
        font-weight: bold;
        border-radius: 50px;
        cursor: pointer;
        transition:
            background-color 0.3s,
            transform 0.1s;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .pantalla-bienvenida button:hover {
        background-color: #ffb84d;
        transform: scale(1.05);
    }
    .cargando-data {
        margin-top: 50px;
        opacity: 0.8;
        font-style: italic;
    }

    /* ---------------------------------- */
    /* 3. Estilos de la Interfaz Principal (Resto de la página) */
    /* ---------------------------------- */

    .main-title {
        font-size: 2.2em;
        font-weight: 900;
        color: var(--color-text-dark); /* Azul INEC */
        margin: 30px auto 30px auto;
        text-align: center;
        max-width: 1000px;
        padding: 0 20px;
    }

    .main-content-container {
        flex-grow: 1;
        max-width: 1000px;
        margin: 0 auto 50px auto;
        padding: 0 20px;
    }

    .filter-group {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
    }

    .filter-item {
        flex: 1;
    }

    .filter-item label {
        display: block;
        margin-bottom: 5px;
        font-weight: 700;
        color: var(--color-text-dark); /* Azul INEC */
        font-size: 0.9em;
    }

    .filter-item select,
    .filtro-box select {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--color-border-light);
        border-radius: 4px;
        font-size: 0.95em;
        box-sizing: border-box;
        appearance: none;
        background-color: white;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13.6-6.4H18.4c-5%200-9.3%201.8-13.6%206.4-4.2%204.6-6.4%2010.5-6.4%2016.9%200%206.4%202.2%2012.3%206.4%2016.9l118%20118c4.2%204.6%2010.1%206.4%2016.9%206.4s12.7-2.2%2016.9-6.4l118-118c4.4-4.6%206.6-10.5%206.6-16.9%200-6.4-2.2-12.3-6.6-16.9z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        background-size: 10px;
        color: #2c3e50; /* Color de texto más oscuro para la legibilidad de los selectores */
    }

    .consultar-button {
        background-color: var(--color-consultar-button); /* Azul INEC */
        color: white;
        border: 1px solid var(--color-consultar-dark);
        padding: 10px 25px;
        font-size: 1.1em;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 700;
        transition:
            background-color 0.2s,
            box-shadow 0.2s;
        display: block;
        margin-bottom: 30px;
    }
    .consultar-button:hover {
        background-color: var(--color-consultar-dark);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .no-results-placeholder {
        text-align: center;
        font-size: 1.2em;
        color: #777;
        margin: 50px 0;
        padding: 20px;
        background-color: #fff;
        border: 1px dashed var(--color-border-light);
        border-radius: 8px;
    }

    .promedio-box {
        /* Usar degradado de azules claros para el fondo de promedio */
        background: linear-gradient(135deg, #e0e9f1, #c0d8ef);
        border: 1px solid #a3d3fb;
        padding: 20px 25px;
        margin-bottom: 30px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .promedio-valor {
        font-weight: 900;
        color: var(--color-text-dark); /* Azul INEC */
        font-size: 2.5em;
        margin: 10px 0 0;
    }
    .promedio-box h3 {
        color: var(--color-text-dark); /* Azul INEC */
        margin-top: 0;
        font-size: 1.2em;
        opacity: 0.8;
        font-weight: 400;
    }

    .chart-container {
        background-color: var(--color-card-bg);
        border: 1px solid var(--color-border-light);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 30px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .chart-container h2 {
        font-size: 1.5em;
        margin-top: 0;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--color-border-light);
        color: var(--color-text-dark);
        font-weight: 700;
    }
    .highlight-text {
        color: var(--color-action-dark); /* Rojo INEC */
        font-weight: 900;
    }

    .orden-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 10px 0;
        border-bottom: 2px solid var(--color-border-light);
    }
    .orden-box p {
        font-weight: 600;
        color: var(--color-text-dark);
        flex-grow: 1;
        margin-right: 20px;
    }
    .orden-box button {
        background-color: var(--color-action-primary); /* Rojo INEC */
        color: white;
        border: none;
        padding: 10px 18px;
        margin-left: 10px;
        border-radius: 6px;
        cursor: pointer;
        transition:
            background-color 0.2s,
            transform 0.1s;
        font-weight: bold;
        white-space: nowrap;
    }
    .orden-box button:hover {
        background-color: var(--color-action-dark);
        transform: translateY(-1px);
    }

    .card-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
    }

    .card {
        width: calc(50% - 10px);
        box-sizing: border-box;
        background-color: var(--color-card-bg);
        border: none;
        padding: 25px;
        margin-bottom: 0px;
        border-radius: 10px;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.3s,
            box-shadow 0.3s;
        border-left: 5px solid var(--color-action-primary); /* Rojo INEC */
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
    .card h2 {
        color: var(--color-text-dark); /* Azul INEC */
        border-bottom: 1px solid var(--color-border-light);
        padding-bottom: 10px;
        margin-top: 0;
        font-size: 1.5em;
    }
    .total {
        font-weight: 700;
        color: #2c3e50; /* Negro/Azul muy oscuro para contraste */
        font-size: 1.3em;
        margin: 15px 0;
        display: flex;
        align-items: center;
    }
    .up-arrow {
        color: var(--color-highlight-danger); /* Rojo INEC */
        font-size: 1.2em;
    }
    .down-arrow {
        color: var(--color-highlight-success);
        font-size: 1.2em;
    }
    .card h3 {
        color: var(--color-text-dark);
        font-size: 1.1em;
        margin-top: 20px;
        margin-bottom: 10px;
        border-bottom: 1px dashed var(--color-border-light);
        padding-bottom: 5px;
    }
    .card ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .card li {
        padding: 8px 0;
        border-bottom: 1px dotted #f0f0f0;
        font-size: 1em;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .card li:last-child {
        border-bottom: none;
    }

    /* ---------------------------------- */
    /* MEDIA QUERY PARA HACERLO RESPONSIVE */
    /* ---------------------------------- */
    @media (max-width: 768px) {
        /* En pantallas pequeñas, volvemos a una sola columna */
        .card-container {
            display: block; /* Vuelve al flujo normal (vertical) */
            gap: 0; /* Elimina el gap de flexbox */
        }
        .card {
            width: 100%; /* Ocupa todo el ancho */
            margin-bottom: 20px; /* Restaura el margen inferior */
        }
        .filter-group {
            flex-direction: column;
            gap: 10px;
        }
        .orden-box {
            flex-direction: column;
            align-items: flex-start;
        }
        .orden-box div {
            margin-top: 10px;
        }
        .orden-box button {
            margin-left: 0;
            margin-right: 10px;
            margin-bottom: 5px;
        }
        .main-title {
            font-size: 1.8em;
        }
    }

    .app-footer {
        background-color: #e4e6e8;
        padding: 15px 5vw;
        text-align: center;
        font-size: 0.85em;
        color: #666;
        border-top: 1px solid #eee;
        margin-top: auto;
    }
    .app-footer p {
        margin: 5px 0;
    }
    .app-footer a {
        color: var(--color-action-primary); /* Rojo INEC */
        text-decoration: none;
    }

    .boton-volver {
        background-color: transparent;
        color: var(--color-action-primary); /* Rojo INEC */
        border: 1px solid var(--color-action-primary);
        padding: 5px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        margin-bottom: 10px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
    .boton-volver:hover {
        background-color: var(--color-action-primary);
        color: white;
    }
</style>
