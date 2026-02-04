-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resposta TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

-- Insert the 3 polls
INSERT INTO polls (id, titulo, tipo) VALUES
    (1, 'Pretendemos ir a 1 cachoeira no dia 15 ou 16, qual vc prefere?', 'waterfall'),
    (2, 'Quanto esta disposto a pagar em comida? Vamos levar em consideracao mas n podemos prometer nada ainda :)', 'food'),
    (3, 'E quanto esta disposto a pagar em bebida?', 'drink');

-- Reset sequence to start from 4
SELECT setval('polls_id_seq', 3, true);
