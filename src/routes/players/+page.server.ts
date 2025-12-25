import { fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import { randomUUID } from 'node:crypto';

export const load = async () => {
    const players = db.prepare('SELECT * FROM players ORDER BY name ASC').all() as any[];
    return { players };
};

export const actions = {
    createPlayer: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name') as string;

        if (!name || !name.trim()) {
            return fail(400, { error: 'Le nom est requis.' });
        }

        try {
            db.prepare('INSERT INTO players (id, name) VALUES (?, ?)').run(randomUUID(), name.trim());
        } catch (err: any) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return fail(400, { error: 'Ce joueur existe déjà.' });
            }
            return fail(500, { error: 'Erreur lors de la création du joueur.' });
        }
    },

    deletePlayer: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;

        if (!id) return fail(400, { error: 'ID requis.' });

        try {
            db.prepare('DELETE FROM players WHERE id = ?').run(id);
        } catch (err) {
            return fail(500, { error: 'Impossible de supprimer ce joueur.' });
        }
    }
};
