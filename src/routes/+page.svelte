<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let mode = $state("championship");
    let loading = $state(false);

    let showPlayerModal = $state(false);
    let selectedIds = $state<string[]>([]);

    let selectedPlayers = $derived(
        data.players.filter((p) => selectedIds.includes(p.id)),
    );

    function toggleSelection(id: string) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter((i) => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    }
</script>

<div class="max-w-2xl mx-auto space-y-12">
    <div class="card wood-border relative overflow-hidden">
        <!-- Decoration -->
        <div
            class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wood-dark via-wood-light to-wood-dark opacity-50"
        ></div>

        <h2 class="text-2xl mb-6 text-center border-b border-white/10 pb-4">
            Nouveau Tournoi
        </h2>

        <form
            method="POST"
            action="?/createTournament"
            use:enhance={() => {
                loading = true;
                return async ({ update }) => {
                    await update();
                    loading = false;
                };
            }}
            class="space-y-6"
        >
            <!-- Game Mode -->
            <div role="group" aria-labelledby="mode-label">
                <div
                    id="mode-label"
                    class="block text-amber-gold font-bold mb-2"
                >
                    Mode de Jeu
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <label class="cursor-pointer relative">
                        <input
                            type="radio"
                            name="mode"
                            value="championship"
                            bind:group={mode}
                            class="peer sr-only"
                            checked
                        />
                        <div
                            class="p-4 rounded border border-white/20 bg-black/20 text-center peer-checked:bg-amber-gold/20 peer-checked:border-amber-gold peer-checked:text-amber-gold transition-all hover:bg-white/5"
                        >
                            <span class="block font-bold text-lg"
                                >Championnat</span
                            >
                            <span class="text-xs opacity-70"
                                >Ligue (Tout le monde contre tout le monde)</span
                            >
                        </div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input
                            type="radio"
                            name="mode"
                            value="tree"
                            bind:group={mode}
                            class="peer sr-only"
                        />
                        <div
                            class="p-4 rounded border border-white/20 bg-black/20 text-center peer-checked:bg-amber-gold/20 peer-checked:border-amber-gold peer-checked:text-amber-gold transition-all hover:bg-white/5"
                        >
                            <span class="block font-bold text-lg">Arbre</span>
                            <span class="text-xs opacity-70"
                                >Élimination Directe (Coupe)</span
                            >
                        </div>
                    </label>
                </div>
            </div>

            <!-- Players -->
            <div role="group" aria-labelledby="players-label">
                <div class="flex justify-between items-center mb-4">
                    <div
                        id="players-label"
                        class="block text-amber-gold font-bold"
                    >
                        Sélection des Joueurs
                    </div>
                    <div class="text-sm text-white/50">
                        {selectedIds.length} sélectionné(s)
                    </div>
                </div>

                <!-- Hidden Inputs for Form Submission -->
                {#each selectedIds as id}
                    <input type="hidden" name="players" value={id} />
                {/each}

                <!-- Selected Players Display -->
                {#if selectedIds.length > 0}
                    <div class="flex flex-wrap gap-2 mb-4">
                        {#each selectedPlayers as p}
                            <div
                                class="px-3 py-1 rounded-full bg-amber-gold/20 border border-amber-gold/50 text-amber-gold text-sm font-bold shadow-sm flex items-center gap-2"
                            >
                                <span>{p.name}</span>
                                <button
                                    type="button"
                                    onclick={() => toggleSelection(p.id)}
                                    class="hover:text-white transition-colors"
                                    aria-label="Retirer"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="text-white/30 text-sm italic mb-4">
                        Aucun joueur sélectionné.
                    </div>
                {/if}

                <button
                    type="button"
                    onclick={() => (showPlayerModal = true)}
                    class="w-full py-3 border border-white/10 rounded bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
                        />
                    </svg>
                    Choisir les Joueurs
                </button>
            </div>

            <!-- Actions -->
            <div class="pt-4 border-t border-white/10 flex justify-center">
                <button
                    class="btn-primary w-full md:w-auto text-lg"
                    disabled={loading}
                >
                    {loading
                        ? "Préparation du Tapis..."
                        : "Mélanger & Lancer le Tournoi"}
                </button>
            </div>
        </form>
    </div>

    <!-- Recent Tournaments -->
    {#if data.tournaments.length > 0}
        <div class="space-y-4">
            <h3
                class="text-xl text-amber-gold font-bold px-4 border-l-4 border-amber-gold"
            >
                Tournois Récents
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each data.tournaments as tournament}
                    <a
                        href={`/tournament/${tournament.id}`}
                        class="block card wood-border p-4 hover:border-amber-gold/50 transition-colors group"
                    >
                        <div class="flex justify-between items-start mb-2">
                            <h4
                                class="font-bold text-lg group-hover:text-amber-gold transition-colors"
                            >
                                {tournament.name}
                            </h4>
                            <div class="flex items-center gap-2">
                                <span
                                    class="text-xs uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10"
                                >
                                    {tournament.type === "championship"
                                        ? "Championnat"
                                        : "Arbre"}
                                </span>
                                <form
                                    method="POST"
                                    action="?/deleteTournament"
                                    use:enhance
                                    class="z-10"
                                >
                                    <input
                                        type="hidden"
                                        name="id"
                                        value={tournament.id}
                                    />
                                    <button
                                        type="submit"
                                        class="text-red-400 hover:text-red-300 p-1 opacity-50 hover:opacity-100 transition-opacity"
                                        title="Supprimer"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            if (
                                                !confirm(
                                                    "Supprimer ce tournoi et toutes ses données ?",
                                                )
                                            )
                                                e.preventDefault();
                                        }}
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
                        </div>
                        <div
                            class="flex justify-between items-end text-sm text-white/50"
                        >
                            <div>
                                {new Date(
                                    tournament.created_at * 1000,
                                ).toLocaleDateString()}
                            </div>
                            <div
                                class={`px-2 py-0.5 rounded text-xs uppercase ${tournament.status === "finished" ? "text-green-400 bg-green-900/20" : "text-amber-400 bg-amber-900/20"}`}
                            >
                                {tournament.status === "finished"
                                    ? "Terminé"
                                    : "En cours"}
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</div>

{#if showPlayerModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <button
            type="button"
            class="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-default w-full h-full border-0"
            onclick={() => (showPlayerModal = false)}
            aria-label="Fermer"
        ></button>

        <!-- Modal Content -->
        <div
            class="card wood-border w-full max-w-2xl max-h-[80vh] flex flex-col relative z-10 shadow-2xl"
        >
            <div
                class="p-4 border-b border-white/10 flex justify-between items-center bg-wood-dark/50"
            >
                <h3 class="text-xl font-serif text-amber-gold">
                    Sélectionner les Joueurs
                </h3>
                <button
                    type="button"
                    onclick={() => (showPlayerModal = false)}
                    class="text-white/50 hover:text-white"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <div class="p-4 overflow-y-auto custom-scrollbar grow">
                {#if data.players.length === 0}
                    <div class="text-center py-8 text-white/50">
                        Aucun joueur disponible. <a
                            href="/players"
                            class="text-amber-gold hover:underline"
                            >Ajoutez-en d'abord !</a
                        >
                    </div>
                {:else}
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {#each data.players as player}
                            <label class="cursor-pointer relative group block">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(player.id)}
                                    onchange={() => toggleSelection(player.id)}
                                    class="peer sr-only"
                                />
                                <div
                                    class="p-3 rounded border border-white/10 bg-black/20 text-center peer-checked:bg-amber-gold/20 peer-checked:border-amber-gold peer-checked:text-amber-gold peer-checked:shadow-[0_0_10px_rgba(251,191,36,0.2)] transition-all hover:bg-white/5"
                                >
                                    <span
                                        class="font-bold truncate block"
                                        title={player.name}>{player.name}</span
                                    >
                                </div>
                            </label>
                        {/each}
                    </div>
                {/if}
            </div>

            <div
                class="p-4 border-t border-white/10 bg-wood-dark/50 flex justify-between items-center"
            >
                <div class="text-sm text-white/50">
                    {selectedIds.length} sélectionné(s)
                </div>
                <button
                    type="button"
                    class="btn-primary px-6 py-2"
                    onclick={() => (showPlayerModal = false)}
                >
                    Valider la sélection
                </button>
            </div>
        </div>
    </div>
{/if}
