import { error } from '@sveltejs/kit';
import db from '$lib/server/db';

export const load = async ({ params }) => {
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(params.id) as any;

    if (!tournament) {
        throw error(404, 'Tournoi introuvable');
    }

    return {
        tournament
    };
};
