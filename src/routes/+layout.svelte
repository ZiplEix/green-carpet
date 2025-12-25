<script>
	import "../app.css";
	let { children } = $props();
</script>

<div
	class="min-h-screen text-gray-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black"
>
	<header class="py-6 text-center relative z-10">
		<a href="/" class="group">
			<h1
				class="text-4xl md:text-5xl lg:text-6xl font-serif text-amber-gold drop-shadow-lg tracking-wide border-b-4 border-wood-dark inline-block px-8 pb-2 rounded-[50%] bg-wood-dark/20 backdrop-blur-sm group-hover:scale-105 transition-transform"
			>
				Green Carpet
			</h1>
			<!-- <p
				class="mt-2 text-white/70 italic text-sm md:text-base font-light"
			>
				Le Tapis Vert Familial
			</p> -->
		</a>
		<div class="mt-4">
			<a
				href="/players"
				class="text-amber-gold hover:text-white underline underline-offset-4 text-sm font-bold uppercase tracking-wider"
				>Gérer les Joueurs</a
			>
		</div>
	</header>

	<main class="flex-grow container mx-auto px-4 py-8 relative z-10">
		{@render children()}
	</main>

	<footer class="py-4 text-center text-white/30 text-xs relative z-10">
		Belote Tournament Manager &copy; {new Date().getFullYear()}
	</footer>
</div>
