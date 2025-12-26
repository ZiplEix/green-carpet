
import { json } from '@sveltejs/kit';
import db, { recalculatePlayerStats } from '$lib/server/db';

export const GET = async ({ url }) => {
    const matchId = url.searchParams.get('id');

    if (!matchId) {
        return json({ error: 'Missing match id' }, { status: 400 });
    }

    // 1. Update rounds: Add 20 points where belote is true
    // We assume the bug caused the score to be saved WITHOUT the 20 points.
    // So we safely add 20.
    const resultA = db.prepare('UPDATE rounds SET score_a = score_a + 20 WHERE match_id = ? AND belote_a = 1').run(matchId);
    const resultB = db.prepare('UPDATE rounds SET score_b = score_b + 20 WHERE match_id = ? AND belote_b = 1').run(matchId);

    // 2. Fetch match players to recalculate stats
    const match = db.prepare(`
        SELECT t1.player1_name as t1_p1, t1.player2_name as t1_p2,
               t2.player1_name as t2_p1, t2.player2_name as t2_p2
        FROM matches m
        JOIN teams t1 ON m.team_a_id = t1.id
        JOIN teams t2 ON m.team_b_id = t2.id
        WHERE m.id = ?
    `).get(matchId) as any;

    if (match) {
        const players = [match.t1_p1, match.t1_p2, match.t2_p1, match.t2_p2];
        players.forEach(p => recalculatePlayerStats(p));
    }

    // 3. Update match total score if it is finished
    // The previous match finish logic might have saved the wrong total.
    // We should re-sum the rounds and update the match row.
    const rounds = db.prepare('SELECT score_a, score_b FROM rounds WHERE match_id = ?').all(matchId) as any[];
    const totalA = rounds.reduce((acc, r) => acc + r.score_a, 0);
    const totalB = rounds.reduce((acc, r) => acc + r.score_b, 0);

    db.prepare('UPDATE matches SET score_a = ?, score_b = ? WHERE id = ?').run(totalA, totalB, matchId);


    return json({
        success: true,
        updated_rounds_a: resultA.changes,
        updated_rounds_b: resultB.changes,
        new_total_a: totalA,
        new_total_b: totalB
    });
};
