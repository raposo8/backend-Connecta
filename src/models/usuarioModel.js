const { dbGet, dbRun } = require('../db');

const findByEmail = (email) => {
    return dbGet('SELECT * FROM usuarios WHERE email = ?', [email]);
};

const findById = (id) => {
    return dbGet('SELECT id, nome, email, ra, periodo, faculdade FROM usuarios WHERE id = ?', [id]);
};

const create = async (usuario) => {
    const { nome, email, senha, ra, periodo, faculdade } = usuario;
    const result = await dbRun(
        'INSERT INTO usuarios (nome, email, senha, ra, periodo, faculdade) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, email, senha, ra, periodo, faculdade]
    );
    return findById(result.lastID);
};

module.exports = {
    findByEmail,
    findById,
    create,
};
