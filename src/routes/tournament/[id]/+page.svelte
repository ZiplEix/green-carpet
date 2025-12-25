<script lang="ts">
    import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
    <div
        class="flex justify-between items-center bg-black/30 p-4 rounded-lg border border-white/5"
    >
        <h2 class="text-3xl text-amber-gold">{data.tournament.name}</h2>
        <div class="flex flex-col items-end">
            <span
                class="px-3 py-1 rounded-full bg-wood-dark/50 border border-wood-light/30 text-sm uppercase tracking-wider mb-1"
            >
                {data.tournament.type === "championship"
                    ? "Championnat"
                    : "Arbre Éliminatoire"}
            </span>
            <a href="/" class="text-xs text-white/40 hover:text-white underline"
                >Nouveau Tournoi</a
            >
        </div>
    </div>

    {#if data.tournament.type === "championship"}
        <!-- League Table -->
        <div class="card wood-border">
            <h3 class="text-xl mb-4 border-b border-white/10 pb-2">
                Classement
            </h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="text-white/50 text-sm uppercase">
                        <tr>
                            <th class="pb-2">Équipe</th>
                            <th class="pb-2 text-center">J</th>
                            <th class="pb-2 text-center">V</th>
                            <th class="pb-2 text-center">Diff</th>
                            <th class="pb-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        {#each data.standings as team, i}
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="py-3 font-bold">
                                    <span class="text-amber-gold mr-2"
                                        >{i + 1}.</span
                                    >
                                    {team.name}
                                </td>
                                <td class="py-3 text-center opacity-70"
                                    >{team.played}</td
                                >
                                <td class="py-3 text-center opacity-70"
                                    >{team.wins}</td
                                >
                                <td
                                    class="py-3 text-center opacity-70 text-xs font-mono"
                                    >{team.diff > 0 ? "+" : ""}{team.diff}</td
                                >
                                <td
                                    class="py-3 text-right font-bold text-lg text-amber-400"
                                    >{team.total_score}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {:else if data.tournament.type === "tree"}
        <!-- Bracket View -->
        <div class="card wood-border overflow-x-auto">
            <h3 class="text-xl mb-4 border-b border-white/10 pb-2">
                Tableau des Rencontres
            </h3>
            <div class="flex gap-8 min-w-max p-4">
                {#each [...new Set(data.matches.map((m) => m.round_number))].sort((a, b) => a - b) as round}
                    <div
                        class="flex flex-col justify-center gap-8 w-64 relative"
                    >
                        <h4
                            class="text-center text-white/30 text-sm uppercase tracking-widest absolute -top-8 w-full"
                        >
                            {round === 0
                                ? "Quarts / Demis"
                                : `Tour ${round + 1}`}
                        </h4>
                        {#each data.matches.filter((m) => m.round_number === round) as match}
                            <div class="relative">
                                <!-- Connector Lines (Visual Only, simplified) -->
                                {#if round > 0}
                                    <div
                                        class="absolute top-1/2 -left-4 w-4 h-px bg-white/10"
                                    ></div>
                                {/if}

                                <a
                                    href={`/tournament/${data.tournament.id}/match/${match.id}`}
                                    class="block bg-black/40 border {match.is_finished
                                        ? 'border-green-500/30'
                                        : 'border-white/10'} rounded p-3 relative hover:bg-white/5 transition-colors shadow-lg"
                                >
                                    <div
                                        class="flex justify-between items-center text-sm mb-1 px-2 py-1 rounded {match.score_a >
                                            match.score_b && match.is_finished
                                            ? 'bg-amber-gold/10 text-amber-gold font-bold'
                                            : ''}"
                                    >
                                        <span>{match.t1_p1}/{match.t1_p2}</span>
                                        <span class="font-mono"
                                            >{match.is_finished
                                                ? match.score_a
                                                : ""}</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between items-center text-sm px-2 py-1 rounded {match.score_b >
                                            match.score_a && match.is_finished
                                            ? 'bg-amber-gold/10 text-amber-gold font-bold'
                                            : ''}"
                                    >
                                        <span>{match.t2_p1}/{match.t2_p2}</span>
                                        <span class="font-mono"
                                            >{match.is_finished
                                                ? match.score_b
                                                : ""}</span
                                        >
                                    </div>

                                    {#if !match.is_finished}
                                        <div
                                            class="absolute -right-2 -top-2 w-4 h-4 bg-amber-500 rounded-full animate-pulse"
                                        ></div>
                                    {/if}
                                </a>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Matches List (Alternative View) -->
    <div class="card wood-border">
        <h3 class="text-xl mb-4 border-b border-white/10 pb-2">
            Liste des Matchs
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each data.matches.sort((a, b) => a.is_finished - b.is_finished || a.round_number - b.round_number) as match}
                <a
                    href={`/tournament/${data.tournament.id}/match/${match.id}`}
                    class="block bg-black/40 border border-white/10 rounded-lg p-4 hover:border-amber-gold/50 transition-all group relative overflow-hidden flex items-center justify-between"
                >
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <span
                                class={match.score_a > match.score_b &&
                                match.is_finished
                                    ? "text-amber-gold font-bold"
                                    : "text-gray-300"}
                            >
                                {match.t1_p1} & {match.t1_p2}
                            </span>
                            {#if match.is_finished}<span
                                    class="font-mono font-bold"
                                    >{match.score_a}</span
                                >{/if}
                        </div>
                        <div class="flex justify-between items-center mt-1">
                            <span
                                class={match.score_b > match.score_a &&
                                match.is_finished
                                    ? "text-amber-gold font-bold"
                                    : "text-gray-300"}
                            >
                                {match.t2_p1} & {match.t2_p2}
                            </span>
                            {#if match.is_finished}<span
                                    class="font-mono font-bold"
                                    >{match.score_b}</span
                                >{/if}
                        </div>
                    </div>

                    {#if !match.is_finished}
                        <div
                            class="ml-4 text-amber-500 text-xs font-bold uppercase border border-amber-500/30 px-2 py-1 rounded bg-amber-900/20 group-hover:bg-amber-500 group-hover:text-black transition-colors whitespace-nowrap"
                        >
                            Jouer
                        </div>
                    {/if}
                </a>
            {/each}
        </div>
        {#if data.matches.length === 0}
            <p class="text-center text-white/50 py-8 italic">
                Aucun match prévu pour le moment.
            </p>
        {/if}
    </div>
</div>
