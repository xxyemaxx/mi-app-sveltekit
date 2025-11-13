<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";

	// Importa tu componente de menú desplegable
	import DropdownMenu from "$lib/components/DropdownMenu.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
		integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLMD/CD/WVjT/S/vRz40p/sJgV8b/4T9n9bV8R6U9a2u9u9eD8z0ZJ5t5I2g..."
		crossorigin="anonymous"
		referrerpolicy="no-referrer"
	/>
</svelte:head>

<header class="main-header">
	<nav class="header-nav">
		<div class="logo">Mi App SvelteKit</div>

		<div class="actions">
			<DropdownMenu />
		</div>
	</nav>
</header>

<main class="main-content">
	{@render children?.()}
</main>

<style>
	/* Estilos para el encabezado */
	.main-header {
		background-color: var(--card-background, #ffffff);
		border-bottom: 1px solid var(--border-color, #e5e7eb);
		/* Usa el padding de tus componentes para mantener consistencia */
		padding: 10px 20px;
	}

	.header-nav {
		/* Estilos clave para posicionar el menú a la derecha */
		display: flex;
		justify-content: space-between; /* Empuja los elementos a los extremos */
		align-items: center; /* Alinea verticalmente */
		max-width: 1200px; /* Limita el ancho del contenido si quieres un diseño centrado */
		margin: 0 auto;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(
			--color-primary,
			#4f46e5
		); /* Usa el color primario de tu código */
	}

	.main-content {
		/* Deja espacio debajo del header */
		padding: 20px;
	}
</style>
