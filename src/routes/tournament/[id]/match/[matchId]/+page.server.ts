import { fail, redirect } from '@sveltejs/kit';
import db, { recalculatePlayerStats } from '$lib/server/db';
import { randomUUID } from 'node:crypto';

export const load = async ({ params, parent }) => {
    const { tournament } = await parent();

    const match = db.prepare(`
        SELECT m.*, 
               t1.player1_name as t1_p1, t1.player2_name as t1_p2,
               t2.player1_name as t2_p1, t2.player2_name as t2_p2
        FROM matches m
        JOIN teams t1 ON m.team_a_id = t1.id
        JOIN teams t2 ON m.team_b_id = t2.id
        WHERE m.id = ? AND m.tournament_id = ?
    `).get(params.matchId, params.id) as any;

    if (!match) {
        throw redirect(303, `/tournament/${params.id}`);
    }

    // Get Rounds
    const rounds = db.prepare('SELECT * FROM rounds WHERE match_id = ? ORDER BY round_index ASC').all(params.matchId);

    // Fill up to 12 rounds if not present to make UI easier
    // actually, let's just return what we have and let UI handle the rows

    return {
        match,
        rounds,
        teamA: { name: `${match.t1_p1} & ${match.t1_p2}` },
        teamB: { name: `${match.t2_p1} & ${match.t2_p2}` }
    };
};

export const actions = {
    saveRound: async ({ request, params }) => {
        const data = await request.formData();
        const roundIndex = parseInt(data.get('roundIndex') as string);

        let scoreA = parseInt(data.get('scoreA') as string) || 0;
        let scoreB = parseInt(data.get('scoreB') as string) || 0;

        const capotA = data.has('capotA');
        const capotB = data.has('capotB');
        const beloteA = data.has('beloteA');
        const beloteB = data.has('beloteB');

        // Basic Validations/Calculations
        // If Capot A -> Score A = 252 (or 250), B = 0
        if (capotA) { scoreA = 252; scoreB = 0; }
        else if (capotB) { scoreB = 252; scoreA = 0; }

        // REMOVED: Belote addition (handled by client input)
        // if (beloteA) scoreA += 20;
        // if (beloteB) scoreB += 20;

        // Check if round exists
        const existing = db.prepare('SELECT id FROM rounds WHERE match_id = ? AND round_index = ?').get(params.matchId, roundIndex) as any;

        if (existing) {
            db.prepare(`
                UPDATE rounds 
                SET score_a = ?, score_b = ?, capot_a = ?, capot_b = ?, belote_a = ?, belote_b = ?
                WHERE id = ?
            `).run(scoreA, scoreB, capotA ? 1 : 0, capotB ? 1 : 0, beloteA ? 1 : 0, beloteB ? 1 : 0, existing.id);
        } else {
            db.prepare(`
                INSERT INTO rounds (id, match_id, round_index, score_a, score_b, capot_a, capot_b, belote_a, belote_b)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(randomUUID(), params.matchId, roundIndex, scoreA, scoreB, capotA ? 1 : 0, capotB ? 1 : 0, beloteA ? 1 : 0, beloteB ? 1 : 0);
        }

        return { success: true };
    },

    finishMatch: async ({ params }) => {
        // Calculate total score
        const rounds = db.prepare('SELECT score_a, score_b FROM rounds WHERE match_id = ?').all(params.matchId) as any[];
        const totalA = rounds.reduce((acc, r) => acc + r.score_a, 0);
        const totalB = rounds.reduce((acc, r) => acc + r.score_b, 0);

        // Update match status
        db.prepare('UPDATE matches SET is_finished = 1, score_a = ?, score_b = ? WHERE id = ?')
            .run(totalA, totalB, params.matchId);

        // Check if we need to advance the tournament (Tree Mode)
        const tournament = db.prepare('SELECT type FROM tournaments WHERE id = ?').get(params.id) as any;

        if (tournament.type === 'tree') {
            const currentMatch = db.prepare('SELECT round_number FROM matches WHERE id = ?').get(params.matchId) as any;
            const roundNumber = currentMatch.round_number;

            // Check if all matches in this round are finished
            const roundMatches = db.prepare('SELECT * FROM matches WHERE tournament_id = ? AND round_number = ?').all(params.id, roundNumber) as any[];
            const allFinished = roundMatches.every(m => m.is_finished);

            if (allFinished && roundMatches.length > 1) {
                // Generate next round
                for (let i = 0; i < roundMatches.length; i += 2) {
                    const m1 = roundMatches[i];
                    const m2 = roundMatches[i + 1];

                    if (m1 && m2) {
                        const winner1 = m1.score_a > m1.score_b ? m1.team_a_id : m1.team_b_id;
                        const winner2 = m2.score_a > m2.score_b ? m2.team_a_id : m2.team_b_id;

                        // Create next level match
                        const nextMatchId = randomUUID();
                        db.prepare('INSERT INTO matches (id, tournament_id, round_number, team_a_id, team_b_id) VALUES (?, ?, ?, ?, ?)').run(
                            nextMatchId, params.id, roundNumber + 1, winner1, winner2
                        );
                    }
                }
            }
        }

        // Update persistence stats for players
        const matchData = db.prepare(`
            SELECT m.*, 
                   t1.player1_name as t1_p1, t1.player2_name as t1_p2,
                   t2.player1_name as t2_p1, t2.player2_name as t2_p2
            FROM matches m
            JOIN teams t1 ON m.team_a_id = t1.id
            JOIN teams t2 ON m.team_b_id = t2.id
            WHERE m.id = ?
        `).get(params.matchId) as any;

        if (matchData) {
            const playersA = [matchData.t1_p1, matchData.t1_p2];
            const playersB = [matchData.t2_p1, matchData.t2_p2];

            // NEW: Recalculate stats from scratch for all players involved
            // This ensures data integrity even if matches are deleted later
            const allPlayers = [...playersA, ...playersB];
            allPlayers.forEach(name => recalculatePlayerStats(name));

            /* OLD Incremental Logic - Removed
            const wonA = totalA > totalB;
            const wonB = totalB > totalA;

            const updateStat = (name: string, won: boolean, points: number) => {
                db.prepare(`
                    UPDATE players 
                    SET matches_played = matches_played + 1,
                        matches_won = matches_won + ?,
                        total_points = total_points + ?
                    WHERE name = ?
                `).run(won ? 1 : 0, points, name);
            };

            playersA.forEach(p => updateStat(p, wonA, Number(totalA)));
            playersB.forEach(p => updateStat(p, wonB, Number(totalB)));
            */
        }

        throw redirect(303, `/tournament/${params.id}`);
    }
};
