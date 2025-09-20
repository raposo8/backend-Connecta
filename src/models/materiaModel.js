const { dbGet, dbAll } = require('../db');

const findAll = () => {
    return dbAll('SELECT id, nome FROM materias ORDER BY nome', []);
};

const findById = (id) => {
    return dbGet('SELECT id, nome FROM materias WHERE id = ?', [id]);
};

module.exports = {
    findAll,
    findById,
};