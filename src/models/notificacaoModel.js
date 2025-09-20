const { dbRun } = require('../db');

const create = async (notificacaoData) => {
    const { usuarioId, mensagem, tipo, titulo } = notificacaoData;
    const sql = 'INSERT INTO notificacoes (usuario_id, mensagem, tipo, titulo) VALUES (?, ?, ?, ?)';
    const result = await dbRun(sql, [usuarioId, mensagem, tipo, titulo]);
    return { id: result.lastID, ...notificacaoData };
};

module.exports = {
    create,
};