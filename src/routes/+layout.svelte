<script lang="ts">
	// 💡 ¡Esta línea importa tu archivo CSS global con las directivas de Tailwind!
	import "../app.css";

	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
