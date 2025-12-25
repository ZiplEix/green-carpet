<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    let loading = $state(false);
</script>

<div class="max-w-4xl mx-auto space-y-8">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-serif text-amber-gold">
            Joueurs & Statistiques
        </h2>
        <a href="/" class="btn-primary text-sm">Retour au Tapis</a>
    </div>

    <!-- Add Player Form -->
    <div class="card wood-border p-6">
        <h3 class="text-xl font-bold mb-4 text-white/90">Nouveau Joueur</h3>
        <form
            method="POST"
            action="?/createPlayer"
            use:enhance={() => {
                loading = true;
                return async ({ update }) => {
                    await update();
                    loading = false;
                };
            }}
            class="flex gap-4 items-end"
        >
            <div class="grow">
                <label for="name" class="block text-amber-gold font-bold mb-2"
                    >Nom / Pseudo</label
                >
                <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Ex: Tonton Marcel"
                    class="input-field w-full"
                    required
                />
            </div>
            <button class="btn-primary h-12 px-6" disabled={loading}>
                {loading ? "Ajout..." : "Ajouter"}
            </button>
        </form>
    </div>

    <!-- Players List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.players as player}
            <div
                class="card wood-border p-4 relative group hover:border-amber-gold/50 transition-colors"
            >
                <div class="flex justify-between items-start mb-2">
                    <h4
                        class="text-xl font-bold text-amber-gold w-full truncate pr-8"
                        title={player.name}
                    >
                        {player.name}
                    </h4>
                    <form
                        method="POST"
                        action="?/deletePlayer"
                        use:enhance
                        class="absolute top-4 right-4 text-white/50 hover:text-white transition-opacity"
                    >
                        <input type="hidden" name="id" value={player.id} />
                        <button
                            class="text-red-400 hover:text-red-300 p-1"
                            title="Supprimer"
                            onclick={(e) =>
                                !confirm("Supprimer ce joueur ?") &&
                                e.preventDefault()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </button>
                    </form>
                </div>

                <div
                    class="grid grid-cols-3 gap-2 text-center text-sm border-t border-white/10 pt-3"
                >
                    <div>
                        <div class="text-white/50 text-xs uppercase">
                            Matchs
                        </div>
                        <div class="font-mono text-lg">
                            {player.matches_played}
                        </div>
                    </div>
                    <div>
                        <div class="text-white/50 text-xs uppercase">
                            Victoires
                        </div>
                        <div class="font-mono text-lg text-green-400">
                            {player.matches_won}
                        </div>
                    </div>
                    <div>
                        <div class="text-white/50 text-xs uppercase">
                            Points
                        </div>
                        <div class="font-mono text-lg text-amber-400">
                            {player.total_points}
                        </div>
                    </div>
                </div>
            </div>
        {/each}

        {#if data.players.length === 0}
            <div class="col-span-full text-center py-12 text-white/30 italic">
                Aucun joueur enregistré. Ajoutez-en un pour commencer !
            </div>
        {/if}
    </div>
</div>
