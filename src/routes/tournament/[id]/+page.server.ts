import db from '$lib/server/db';

export const load = async ({ params, parent }) => {
    // Wait for parent data (tournament)
    const { tournament } = await parent();

    const teams = db.prepare('SELECT * FROM teams WHERE tournament_id = ?').all(params.id) as any[];
    const matches = db.prepare(`
        SELECT m.*, 
               t1.player1_name as t1_p1, t1.player2_name as t1_p2,
               t2.player1_name as t2_p1, t2.player2_name as t2_p2
        FROM matches m
        JOIN teams t1 ON m.team_a_id = t1.id
        JOIN teams t2 ON m.team_b_id = t2.id
        WHERE m.tournament_id = ?
        ORDER BY m.round_number ASC
    `).all(params.id) as any[];

    // Calculate Standings if Championship
    let standings = [];
    if ((tournament as any).type === 'championship') {
        const stats = new Map();

        teams.forEach(t => {
            stats.set(t.id, {
                name: `${t.player1_name} & ${t.player2_name}`,
                id: t.id,
                played: 0,
                wins: 0,
                points: 0,
                diff: 0
            });
        });

        matches.forEach(m => {
            if (m.is_finished) {
                const TeamA = stats.get(m.team_a_id);
                const TeamB = stats.get(m.team_b_id);

                if (TeamA && TeamB) {
                    TeamA.played++;
                    TeamB.played++;

                    TeamA.diff += (m.score_a - m.score_b);
                    TeamB.diff += (m.score_b - m.score_a);

                    if (m.score_a > m.score_b) {
                        TeamA.wins++;
                        TeamA.points += 3;
                    } else if (m.score_b > m.score_a) {
                        TeamB.wins++;
                        TeamB.points += 3;
                    } else {
                        // Draw (rare in Belote but possible?)
                        TeamA.points += 1;
                        TeamB.points += 1;
                    }
                }
            }
        });

        standings = Array.from(stats.values()).sort((a, b) => b.points - a.points || b.diff - a.diff);
    }

    return {
        teams,
        matches,
        standings
    };
};
