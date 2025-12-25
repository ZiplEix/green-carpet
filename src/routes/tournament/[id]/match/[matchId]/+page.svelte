<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/stores";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    interface RoundState {
        round_index: number;
        score_a: string | number;
        score_b: string | number;
        belote_a: boolean;
        belote_b: boolean;
        capot_a: boolean;
        capot_b: boolean;
        saved: boolean;
    }

    let rounds: RoundState[] = $state(
        Array(12)
            .fill(null)
            .map((_, i) => {
                const existing = (data.rounds as any[]).find(
                    (r: any) => r.round_index === i + 1,
                );
                return existing
                    ? ({ ...existing, saved: true } as RoundState)
                    : {
                          round_index: i + 1,
                          score_a: "",
                          score_b: "",
                          belote_a: false,
                          belote_b: false,
                          capot_a: false,
                          capot_b: false,
                          saved: false,
                      };
            }),
    );

    // Auto-calculate opponent score (standard 162 total)
    // Note: Input score INCLUDE Belote if checked (Client handles the +20)
    function onScoreChange(index: number, team: "a" | "b") {
        const round = rounds[index];
        if (team === "a" && round.score_a !== "") {
            let val = parseInt(String(round.score_a));
            let cardVal = val - (round.belote_a ? 20 : 0);

            // Valid card score is 0-162
            if (!isNaN(cardVal) && cardVal >= 0 && cardVal <= 162) {
                round.score_b = 162 - cardVal;
            }
        } else if (team === "b" && round.score_b !== "") {
            let val = parseInt(String(round.score_b));
            let cardVal = val - (round.belote_b ? 20 : 0);

            if (!isNaN(cardVal) && cardVal >= 0 && cardVal <= 162) {
                round.score_a = 162 - cardVal;
            }
        }
    }

    function onBeloteChange(index: number, team: "a" | "b") {
        const round = rounds[index];
        let val =
            parseInt(String(team === "a" ? round.score_a : round.score_b)) || 0;

        // Add or remove 20 points
        if (team === "a") {
            if (round.belote_a) val += 20;
            else val -= 20;
            round.score_a = val < 0 ? 0 : val;
        } else {
            if (round.belote_b) val += 20;
            else val -= 20;
            round.score_b = val < 0 ? 0 : val;
        }
    }

    // Handle Capot selection (immediate score update)
    function onCapotChange(index: number, team: "a" | "b") {
        const round = rounds[index];
        if (team === "a" && round.capot_a) {
            round.score_a = 252;
            round.score_b = 0;
            round.capot_b = false; // Mutually exclusive
        } else if (team === "b" && round.capot_b) {
            round.score_b = 252;
            round.score_a = 0;
            round.capot_a = false; // Mutually exclusive
        }
        // If unchecked, we leave values as is (user can correct them)
    }

    let totalA = $derived(
        rounds.reduce((acc, r) => acc + (parseInt(String(r.score_a)) || 0), 0),
    );
    let totalB = $derived(
        rounds.reduce((acc, r) => acc + (parseInt(String(r.score_b)) || 0), 0),
    );

    // Sync state with server data (persistence check)
    $effect(() => {
        (data.rounds as any[]).forEach((serverRound: any) => {
            const local = rounds.find(
                (r) => r.round_index === serverRound.round_index,
            );
            if (local) {
                // Only update 'saved' status, don't overwrite local values while editing
                // unless we want to force re-calcs. Ideally trust local for immediate UI.
                local.saved = true;
            }
        });
    });

    // Helper to submit form on change (auto-save)
    function autoSave(event: Event) {
        // Find the form and submit it
        const target = event.target as HTMLElement;
        const form = target.closest("form");
        if (form) form.requestSubmit();
    }
</script>

<div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div
        class="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 sticky top-4 z-20 backdrop-blur-md shadow-xl"
    >
        <div class="text-center w-1/3">
            <div class="text-sm text-white/50 mb-1">{data.teamA.name}</div>
            <div class="text-4xl font-mono font-bold text-amber-400">
                {totalA}
            </div>
        </div>
        <div class="text-center w-1/3 text-white/30 font-serif italic">vs</div>
        <div class="text-center w-1/3">
            <div class="text-sm text-white/50 mb-1">{data.teamB.name}</div>
            <div class="text-4xl font-mono font-bold text-amber-400">
                {totalB}
            </div>
        </div>
    </div>

    <!-- Score Sheet -->
    <div class="card wood-border overflow-hidden">
        <div
            class="grid grid-cols-[auto_1fr_auto_1fr] gap-4 items-center mb-4 px-2 text-xs uppercase text-white/50 font-bold text-center"
        >
            <div>M.</div>
            <div>{data.teamA.name}</div>
            <div></div>
            <div>{data.teamB.name}</div>
        </div>

        {#each rounds as round, i}
            <form
                method="POST"
                action="?/saveRound"
                use:enhance={() => {
                    return async ({ update }) => {
                        await update({ reset: false });
                    };
                }}
                class="contents group"
                onchange={autoSave}
            >
                <input
                    type="hidden"
                    name="roundIndex"
                    value={round.round_index}
                />

                <div
                    class="grid grid-cols-[auto_1fr_auto_1fr] gap-2 md:gap-4 items-center py-2 border-b border-white/5 {round.saved
                        ? 'opacity-70'
                        : ''} hover:opacity-100 transition-opacity"
                >
                    <!-- Round Number -->
                    <div
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-xs font-mono text-white/50"
                    >
                        {i + 1}
                    </div>

                    <!-- Team A -->
                    <div class="flex flex-col md:flex-row gap-2 items-center">
                        <input
                            type="number"
                            name="scoreA"
                            class="input-field text-center font-mono text-lg h-12"
                            bind:value={round.score_a}
                            oninput={() => onScoreChange(i, "a")}
                            placeholder="0"
                        />

                        <div class="flex gap-1">
                            <label
                                class="cursor-pointer px-2 py-1 rounded border border-white/10 text-xs hover:bg-white/10 {round.belote_a
                                    ? 'bg-amber-gold/20 border-amber-gold text-amber-gold'
                                    : 'text-white/30'}"
                            >
                                Belote
                                <input
                                    type="checkbox"
                                    name="beloteA"
                                    class="hidden"
                                    bind:checked={round.belote_a}
                                    onchange={() => onBeloteChange(i, "a")}
                                />
                            </label>
                            <label
                                class="cursor-pointer px-2 py-1 rounded border border-white/10 text-xs hover:bg-white/10 {round.capot_a
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'text-white/30'}"
                            >
                                Capot
                                <input
                                    type="checkbox"
                                    name="capotA"
                                    class="hidden"
                                    bind:checked={round.capot_a}
                                    onchange={() => onCapotChange(i, "a")}
                                />
                            </label>
                        </div>
                    </div>

                    <!-- Divider -->
                    <div class="text-white/10">|</div>

                    <!-- Team B -->
                    <div class="flex flex-col md:flex-row gap-2 items-center">
                        <input
                            type="number"
                            name="scoreB"
                            class="input-field text-center font-mono text-lg h-12"
                            bind:value={round.score_b}
                            oninput={() => onScoreChange(i, "b")}
                            placeholder="0"
                        />

                        <div class="flex gap-1">
                            <label
                                class="cursor-pointer px-2 py-1 rounded border border-white/10 text-xs hover:bg-white/10 {round.belote_b
                                    ? 'bg-amber-gold/20 border-amber-gold text-amber-gold'
                                    : 'text-white/30'}"
                            >
                                Belote
                                <input
                                    type="checkbox"
                                    name="beloteB"
                                    class="hidden"
                                    bind:checked={round.belote_b}
                                    onchange={() => onBeloteChange(i, "b")}
                                />
                            </label>
                            <label
                                class="cursor-pointer px-2 py-1 rounded border border-white/10 text-xs hover:bg-white/10 {round.capot_b
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'text-white/30'}"
                            >
                                Capot
                                <input
                                    type="checkbox"
                                    name="capotB"
                                    class="hidden"
                                    bind:checked={round.capot_b}
                                    onchange={() => onCapotChange(i, "b")}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        {/each}
    </div>

    <!-- Footer Actions -->
    <div class="flex justify-between items-center">
        <a
            href={`/tournament/${data.match.tournament_id}`}
            class="text-white/50 hover:text-white transition-colors flex items-center gap-2"
        >
            ← Retour au tournoi
        </a>

        <form method="POST" action="?/finishMatch">
            <button class="btn-primary flex items-center gap-2">
                Terminer le match
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
        </form>
    </div>
</div>
