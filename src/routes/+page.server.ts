import { fail, redirect } from '@sveltejs/kit';
import db, { recalculatePlayerStats } from '$lib/server/db';
import { randomUUID } from 'node:crypto';

export const load = async () => {
    const tournaments = db.prepare('SELECT id, name, type, status, created_at FROM tournaments ORDER BY created_at DESC').all() as any[];
    const players = db.prepare('SELECT id, name FROM players ORDER BY name ASC').all() as any[];
    return { tournaments, players };
};

export const actions = {
    createTournament: async ({ request }) => {
        const data = await request.formData();
        const mode = data.get('mode') as string;
        const playerIds = data.getAll('players') as string[];

        // Check for duplicate names if somehow passed? No, IDs are unique.
        // Check count
        if (playerIds.length < 4 || playerIds.length % 2 !== 0) {
            return fail(400, { error: 'Il faut au minimum 4 joueurs et un nombre pair.' });
        }

        const tournamentId = randomUUID();
        const now = Math.floor(Date.now() / 1000);

        try {
            // transaction
            const createTx = db.transaction(() => {
                // Fetch player names for the selected IDs
                // parameterized query for IN clause
                const placeholders = playerIds.map(() => '?').join(',');
                const players = db.prepare(`SELECT name FROM players WHERE id IN (${placeholders})`).all(...playerIds) as any[];

                if (players.length !== playerIds.length) {
                    // Some IDs were not found?
                    throw new Error('Certains joueurs sélectionnés sont introuvables.');
                }

                const playerNames = players.map(p => p.name);

                // 1. Create Tournament
                db.prepare('INSERT INTO tournaments (id, name, type, created_at) VALUES (?, ?, ?, ?)').run(
                    tournamentId,
                    `Tournoi du ${new Date().toLocaleDateString('fr-FR')}`,
                    mode,
                    now
                );

                // 2. Shuffle Teams
                // Simple shuffle
                const shuffled = [...playerNames].sort(() => Math.random() - 0.5);
                const teams = [];

                // Create teams (pairs)
                for (let i = 0; i < shuffled.length; i += 2) {
                    const p1 = shuffled[i];
                    const p2 = shuffled[i + 1];
                    const teamId = randomUUID();

                    // Note: We don't insert players here anymore, they must exist.
                    // But we might want to link valid player references if we update the schema later.
                    // For now, names are sufficient as per current schema.

                    db.prepare('INSERT INTO teams (id, tournament_id, player1_name, player2_name) VALUES (?, ?, ?, ?)').run(
                        teamId, tournamentId, p1, p2
                    );

                    teams.push({ id: teamId, p1, p2 });
                }

                // 3. Generate Matches based on Mode
                if (mode === 'championship') {
                    // Everyone vs Everyone
                    // Round Robin algorithm
                    let matchCount = 0;
                    for (let i = 0; i < teams.length; i++) {
                        for (let j = i + 1; j < teams.length; j++) {
                            const matchId = randomUUID();
                            db.prepare('INSERT INTO matches (id, tournament_id, team_a_id, team_b_id) VALUES (?, ?, ?, ?)').run(
                                matchId, tournamentId, teams[i].id, teams[j].id
                            );
                            matchCount++;
                        }
                    }
                } else if (mode === 'tree') {
                    // Simple elimination for 4 or 8 teams
                    // Level 0 = Quarter finals / Semi finals depending on count
                    // Simplified: just generate first round matches
                    for (let i = 0; i < teams.length; i += 2) {
                        if (i + 1 < teams.length) {
                            const matchId = randomUUID();
                            // round_number 0 for first round
                            db.prepare('INSERT INTO matches (id, tournament_id, round_number, team_a_id, team_b_id) VALUES (?, ?, ?, ?, ?)').run(
                                matchId, tournamentId, 0, teams[i].id, teams[i + 1].id
                            );
                        }
                    }
                }
            });

            createTx();

        } catch (err) {
            console.error(err);
            return fail(500, { error: 'Erreur lors de la création du tournoi.' });
        }

        throw redirect(303, `/tournament/${tournamentId}`);
    },

    deleteTournament: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;

        if (!id) return fail(400, { error: 'ID requis.' });

        try {
            db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);

            // Recalculate stats for ALL players to ensure everything is synced
            // Since we don't know exactly who was in the tourney easily after deletion (unless we fetched before),
            // and the player count is small, this is safe.
            const allPlayers = db.prepare('SELECT name FROM players').all() as any[];
            allPlayers.forEach(p => recalculatePlayerStats(p.name));

        } catch (err) {
            return fail(500, { error: 'Impossible de supprimer ce tournoi.' });
        }
    }
};
