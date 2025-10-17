<script>
    // @ts-nocheck

    import BarChart from "$lib/components/BarChart.svelte";

    export let data;

    // 1. VARIABLE DE ESTADO que es para controlar la bienvenida
    let mostrarBienvenida = true; // Empieza en true para mostrar la bienvenida

    // 2. FUNCIÓN que oculta la bienvenida
    const entrarAPagina = () => {
        mostrarBienvenida = false;
    };

    // Datos que estan cargados desde +page.js
    const todasLasZonas = data?.costos || [];
    const promediosNacionales = data?.promedios;

    // Estado para la Interacción
    let terminoBusqueda = "";
    let criterioOrden = "costo";
    let direccionOrden = "desc";
    let categoriaComparacion = "costo_total_estimado"; // Estado de comparacion para la categoría

    // Definición de categorías para el selector
    const categorias = [
        { key: "costo_total_estimado", label: "Costo Total Estimado" },
        { key: "vivienda", label: "Vivienda" },
        { key: "alimentacion", label: "Alimentación" },
        { key: "transporte", label: "Transporte" },
        { key: "servicios", label: "Servicios" },
        { key: "ocio", label: "Ocio" },
    ];

    // Esta función lo que hace es alternar la dirección de ordenamiento
    const cambiarDireccion = (criterio) => {
        if (criterioOrden === criterio) {
            direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
        } else {
            criterioOrden = criterio;
            direccionOrden = "desc";
        }
    };

    // Función para borrar el filtro de busqueda
    const limpiarFiltro = () => {
        terminoBusqueda = "";
    };

    // La lógica del filtrado y ordenamiento
    $: zonasFiltradas = todasLasZonas
        .filter((zona) => {
            if (!terminoBusqueda) return true;
            const termino = terminoBusqueda.toLowerCase();
            return (
                zona.provincia.toLowerCase().includes(termino) ||
                zona.distrito.toLowerCase().includes(termino)
            );
        })
        .sort((a, b) => {
            let valA, valB;
            // Ordena por el valor que se está comparando, o por provincia
            const key =
                criterioOrden === "costo" ? categoriaComparacion : "provincia";

            if (criterioOrden === "costo") {
                // Usa el valor del gasto o el total
                valA =
                    key === "costo_total_estimado"
                        ? a.costo_total_estimado
                        : a.gastos[key];
                valB =
                    key === "costo_total_estimado"
                        ? b.costo_total_estimado
                        : b.gastos[key];
            } else {
                valA = a.provincia;
                valB = b.provincia;
            }

            if (valA < valB) return direccionOrden === "asc" ? -1 : 1;
            if (valA > valB) return direccionOrden === "asc" ? 1 : -1;
            return 0;
        });

    // Esta función auxiliar genera el indicador de ordenamiento
    const getSortIndicator = (criterio) => {
        if (criterioOrden !== criterio) return "";
        return direccionOrden === "asc" ? " ⬆️" : " ⬇️";
    };

    // Esta función auxiliar formatea los números de forma segura
    const safeFormat = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString("es-CR");
    };

    // Esta función determina el indicador de comparación (⬆️/⬇️)
    const getComparisonIndicator = (zona, key) => {
        const zonaValor =
            key === "costo_total_estimado"
                ? zona.costo_total_estimado
                : zona.gastos[key];
        const promedioValor =
            key === "costo_total_estimado"
                ? promediosNacionales.costo_total_estimado
                : promediosNacionales.gastos[key];

        if (zonaValor > promedioValor * 1.05)
            return '<span class="up-arrow">⬆️</span>';
        if (zonaValor < promedioValor * 0.95)
            return '<span class="down-arrow">⬇️</span>';
        return "➖"; // Un símbolo neutral para valores muy cercanos
    };
</script>

{#if mostrarBienvenida}
    <div class="pantalla-bienvenida">
        <div class="contenido-bienvenida">
            <h1>¡Bienvenidos!</h1>
            <h2>
                Descubra y compara el Costo de Vida en Costa Rica por Zonas
                Geográficas.
            </h2>
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
    <h1>📊 Costo de Vida por Zonas en Costa Rica</h1>
    <button class="boton-volver" on:click={() => (mostrarBienvenida = true)}>
        ← Volver
    </button>

    <div class="promedio-box">
        <h3>Costo de Vida Promedio Nacional (Estimado)</h3>
        <p class="promedio-valor">
            ₡{safeFormat(promediosNacionales.costo_total_estimado)}
        </p>
    </div>

    <div class="filtro-box">
        <label for="categoria-select">Comparar Gráfico por Gasto:</label>
        <select id="categoria-select" bind:value={categoriaComparacion}>
            {#each categorias as cat}
                <option value={cat.key}>{cat.label}</option>
            {/each}
        </select>
    </div>

    <BarChart
        data={zonasFiltradas}
        categoria={categoriaComparacion}
        promedios={promediosNacionales}
    />

    <div class="filtro-box search-box">
        <label for="filtro">Buscar por Provincia o Distrito:</label>
        <div class="input-with-button">
            <input
                id="filtro"
                type="text"
                bind:value={terminoBusqueda}
                placeholder="Ej: San José o Alajuela"
            />
            {#if terminoBusqueda}
                <button class="clear-button" on:click={limpiarFiltro}>❌</button
                >
            {/if}
        </div>
    </div>

    <div class="orden-box">
        <p>
            Mostrando **{zonasFiltradas.length}** de {todasLasZonas.length} zonas
            geográficas.
        </p>
        <button on:click={() => cambiarDireccion("costo")}>
            Ordenar por {categorias.find((c) => c.key === categoriaComparacion)
                .label}{@html getSortIndicator("costo")}
        </button>
        <button on:click={() => cambiarDireccion("provincia")}>
            Ordenar por Provincia{@html getSortIndicator("provincia")}
        </button>
    </div>

    {#each zonasFiltradas as zona}
        <div class="card">
            <h2>Zona {zona.zona}: {zona.distrito}, {zona.provincia}</h2>

            <p class="total">
                Costo Total Estimado: ₡{safeFormat(zona.costo_total_estimado)}
                {@html getComparisonIndicator(zona, "costo_total_estimado")}
            </p>

            <h3>Desglose de Gastos:</h3>
            <ul>
                <li>
                    Vivienda: ₡{safeFormat(zona.gastos.vivienda)}
                    {@html getComparisonIndicator(zona, "vivienda")}
                </li>
                <li>
                    Alimentación: ₡{safeFormat(zona.gastos.alimentacion)}
                    {@html getComparisonIndicator(zona, "alimentacion")}
                </li>
                <li>
                    Transporte: ₡{safeFormat(zona.gastos.transporte)}
                    {@html getComparisonIndicator(zona, "transporte")}
                </li>
                <li>
                    Servicios: ₡{safeFormat(zona.gastos.servicios)}
                    {@html getComparisonIndicator(zona, "servicios")}
                </li>
                <li>
                    Ocio: ₡{safeFormat(zona.gastos.ocio)}
                    {@html getComparisonIndicator(zona, "ocio")}
                </li>
            </ul>
        </div>
    {/each}
{/if}

<style>
    /* ---------------------------------- */
    /* 1. Variables Globales y Fondo */
    /* ---------------------------------- */
    /* Colores del tema */
    :global(body) {
        /* Un azul muy claro y suave para un mejor contraste que el blanco puro */
        --color-bg-primary: #ecf3f8;
        --color-blue-primary: #007bff;
        --color-blue-dark: #0056b3;
        --color-text-dark: #2c3e50; /* Azul oscuro para texto principal */
        --color-success: #28a745;
        --color-danger: #dc3545;
        --color-card-bg: #ffffff;
        --color-border-light: #d8e3ed;

        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background-color: var(--color-bg-primary);
        color: var(--color-text-dark);
        margin: 0;
        padding: 30px 5vw; /* Añade margen lateral para que no se pegue */
    }

    h1 {
        color: var(--color-blue-dark);
        border-bottom: 3px solid var(--color-blue-primary);
        padding-bottom: 12px;
        margin-bottom: 25px;
        font-weight: 600;
        font-size: 2em;
    }

    /* ---------------------------------- */
    /* 2. Estilos para el Promedio */
    /* ---------------------------------- */
    .promedio-box {
        background: linear-gradient(
            135deg,
            #e6f7ff,
            #b3d9ff
        ); /* Gradiente suave */
        border: 1px solid #91d5ff;
        padding: 20px 25px;
        margin-bottom: 30px;
        border-radius: 10px; /* Bordes más redondeados */
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra más visible */
    }
    .promedio-valor {
        font-weight: 800;
        color: var(--color-blue-dark);
        font-size: 2.5em; /* Valor más grande */
        margin: 10px 0 0;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
    }
    .promedio-box h3 {
        color: var(--color-blue-dark);
        margin-top: 0;
        font-size: 1.2em;
        opacity: 0.8;
    }

    /* ---------------------------------- */
    /* 3. Estilos para el Filtro y Selector (Box) */
    /* ---------------------------------- */
    .filtro-box {
        margin-bottom: 20px;
        padding: 15px;
        background-color: var(--color-card-bg);
        border: 1px solid var(--color-border-light);
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .filtro-box label {
        font-weight: bold;
        color: var(--color-text-dark);
        display: block;
        margin-bottom: 8px;
        font-size: 0.95em;
    }

    /* Estilos para el input y select */
    input,
    select {
        width: 100%;
        padding: 12px;
        border: 2px solid #ccc;
        border-radius: 6px;
        font-size: 1em;
        box-sizing: border-box;
        transition:
            border-color 0.3s,
            box-shadow 0.3s;
        background-color: #f9f9f9;
        color: var(--color-text-dark);
    }
    input:focus,
    select:focus {
        border-color: var(--color-blue-primary);
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25); /* Anillo de enfoque azul */
        outline: none;
    }

    /* ---------------------------------- */
    /* 4. Estilos para las Tarjetas de Zona */
    /* ---------------------------------- */
    .card {
        background-color: var(--color-card-bg);
        border: none; /* Quitamos borde simple */
        padding: 25px;
        margin-bottom: 20px;
        border-radius: 10px;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); /* Sombra más fuerte y elegante */
        transition:
            transform 0.3s,
            box-shadow 0.3s;
        border-left: 5px solid var(--color-blue-primary); /* Barra lateral de color */
    }

    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }

    .card h2 {
        color: var(--color-blue-dark);
        border-bottom: 1px solid var(--color-border-light);
        padding-bottom: 10px;
        margin-top: 0;
        font-size: 1.5em;
    }

    .total {
        font-weight: 700;
        color: var(--color-success); /* Verde para el costo total */
        font-size: 1.3em;
        margin: 15px 0;
        display: flex;
        align-items: center;
    }

    /* Los Indicadores de colores */
    .up-arrow {
        color: var(--color-danger);
        font-size: 1.2em;
    }
    .down-arrow {
        color: var(--color-success);
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
    /* 5. Estilos para el Ordenamiento (Box) */
    /* ---------------------------------- */
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
    }
    .orden-box button {
        background-color: var(--color-blue-primary);
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
    }
    .orden-box button:hover {
        background-color: var(--color-blue-dark);
        transform: translateY(-1px);
    }

    /* ---------------------------------- */
    /* 6. Estilos de Interacción */
    /* ---------------------------------- */
    .input-with-button {
        display: flex;
        position: relative;
        align-items: center;
    }

    .clear-button {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2em;
        padding: 5px;
        color: #888;
        transition: color 0.2s;
        z-index: 10;
    }

    .clear-button:hover {
        color: var(--color-danger);
    }

    /* ---------------------------------- */
    /* 7. ESTILOS DE LA PANTALLA DE BIENVENIDA (NUEVO) */
    /* ---------------------------------- */
    .pantalla-bienvenida {
        position: fixed; /* Ocupa toda la ventana de navegación */
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        /* Un degradado azul y verde que recuerda a la bandera/naturaleza de CR */
        background: linear-gradient(
            160deg,
            #00bfff 0%,
            #007bff 40%,
            #004d99 100%
        );
        color: white;
        text-align: center;
        z-index: 9999; /* Asegura que esté por encima de todo */
        padding: 20px;
        box-sizing: border-box;
    }

    .contenido-bienvenida {
        max-width: 700px;
        background-color: rgba(
            255,
            255,
            255,
            0.15
        ); /* Fondo semitransparente para el texto */
        padding: 40px 30px;
        border-radius: 15px;
        backdrop-filter: blur(5px); /* Efecto de desenfoque */
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .pantalla-bienvenida h1 {
        font-size: 3.5em;
        font-weight: 800;
        margin-top: 0;
        color: white;
        border-bottom: none;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .pantalla-bienvenida h2 {
        font-size: 1.8em;
        font-weight: 400;
        margin: 10px 0 25px 0;
    }

    .pantalla-bienvenida p {
        font-size: 1.1em;
        line-height: 1.6;
        margin-bottom: 30px;
    }

    .pantalla-bienvenida button {
        background-color: #ff9900; /* Naranja/Amarillo brillante para contraste */
        color: #2c3e50;
        border: none;
        padding: 15px 30px;
        font-size: 1.2em;
        font-weight: bold;
        border-radius: 50px; /* Botón redondo */
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
</style>
