import { Database } from 'bun:sqlite';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const dbPath = 'data/belote.db';

// Ensure data directory exists
try {
    await mkdir(dirname(dbPath), { recursive: true });
} catch (e) {
    // ignore
}

const db = new Database(dbPath, { create: true });
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Initialize Schema
const schema = `
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'championship' | 'tree'
    status TEXT NOT NULL DEFAULT 'created', -- 'created', 'started', 'finished'
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    player1_name TEXT NOT NULL,
    player2_name TEXT NOT NULL,
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    round_number INTEGER DEFAULT 0, -- For championship rounds or tree levels
    team_a_id TEXT NOT NULL,
    team_b_id TEXT NOT NULL,
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    is_finished BOOLEAN DEFAULT 0,
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY(team_a_id) REFERENCES teams(id),
    FOREIGN KEY(team_b_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    round_index INTEGER NOT NULL, -- 1 to 12 usually
    score_a INTEGER NOT NULL,
    score_b INTEGER NOT NULL,
    belote_a BOOLEAN DEFAULT 0,
    belote_b BOOLEAN DEFAULT 0,
    capot_a BOOLEAN DEFAULT 0,
    capot_b BOOLEAN DEFAULT 0,
    FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
);
`;

db.exec(schema);


export const recalculatePlayerStats = (playerName: string) => {
    // 1. Get all finished matches for this player
    const matches = db.prepare(`
        SELECT m.*, 
               t1.player1_name as t1_p1, t1.player2_name as t1_p2,
               t2.player1_name as t2_p1, t2.player2_name as t2_p2
        FROM matches m
        JOIN teams t1 ON m.team_a_id = t1.id
        JOIN teams t2 ON m.team_b_id = t2.id
        WHERE m.is_finished = 1 
          AND (t1.player1_name = $name OR t1.player2_name = $name OR t2.player1_name = $name OR t2.player2_name = $name)
    `).all({ $name: playerName }) as any[];

    let played = 0;
    let won = 0;
    let points = 0;

    for (const m of matches) {
        played++;

        const isTeamA = (m.t1_p1 === playerName || m.t1_p2 === playerName);
        const myScore = isTeamA ? m.score_a : m.score_b;
        const opponentScore = isTeamA ? m.score_b : m.score_a;

        points += myScore;
        if (myScore > opponentScore) {
            won++;
        }
    }

    db.prepare(`
        UPDATE players 
        SET matches_played = ?, matches_won = ?, total_points = ? 
        WHERE name = ?
    `).run(played, won, points, playerName);
};

export default db;
