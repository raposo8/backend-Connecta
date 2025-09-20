const { dbGet, dbAll, dbRun } = require('../db');

const create = async (grupoData) => {
    const { nome, materiaId, objetivo, local, limiteParticipantes, isPublico, criadorId } = grupoData;
    const sql = 'INSERT INTO grupos (nome, materia_id, objetivo, local, limite_participantes, is_publico, criador_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const result = await dbRun(sql, [nome, materiaId, objetivo, local, limiteParticipantes, isPublico, criadorId]);
    return findById(result.lastID);
};

const findById = (id) => {
    return dbGet('SELECT * FROM grupos WHERE id = ?', [id]);
};

const findAll = (filtros) => {
    let sql = `
        SELECT 
            g.id, 
            g.nome, 
            m.nome as materia, 
            g.local, 
            g.objetivo, 
            (g.limite_participantes - (SELECT COUNT(*) FROM grupo_participantes mg WHERE mg.grupo_id = g.id)) as vagas_disponiveis, 
            g.limite_participantes as total_vagas,
            g.data_criacao as data_criacao
        FROM grupos g
        JOIN materias m ON g.materia_id = m.id
        WHERE (g.limite_participantes - (SELECT COUNT(*) FROM grupo_participantes mg WHERE mg.grupo_id = g.id)) > 0
    `;

    const params = [];
    const conditions = [];

    if (filtros.materia) {
        conditions.push('m.nome LIKE ?');
        params.push(`%${filtros.materia}%`);
    }
    if (filtros.local) {
        conditions.push('g.local LIKE ?');
        params.push(`%${filtros.local}%`);
    }
    if (filtros.objetivo) {
        conditions.push('g.objetivo LIKE ?');
        params.push(`%${filtros.objetivo}%`);
    }

    if (conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
    }

    return dbAll(sql, params);
};

const isUserAdmin = async (grupoId, usuarioId) => {
    const sql = 'SELECT criador_id FROM grupos WHERE id = ?';
    const row = await dbGet(sql, [grupoId]);
    if (!row) {
        return false; // Grupo não encontrado
    }
    return row.criador_id === usuarioId;
};

const gerenciarMembro = (grupoId, usuarioId, statusAtual, novoStatus) => {
    let sql, params;
    if (novoStatus) {
        sql = 'UPDATE grupo_participantes SET status = ? WHERE grupo_id = ? AND usuario_id = ? AND status = ?';
        params = [novoStatus, grupoId, usuarioId, statusAtual];
    } else {
        sql = 'DELETE FROM grupo_participantes WHERE grupo_id = ? AND usuario_id = ? AND status = ?';
        params = [grupoId, usuarioId, statusAtual];
    }
    return dbRun(sql, params);
};

const softDeleteMensagem = (grupoId, mensagemId) => {
    const sql = 'UPDATE mensagens SET excluida = 1, data_exclusao = CURRENT_TIMESTAMP WHERE id = ? AND grupo_id = ?';
    return dbRun(sql, [mensagemId, grupoId]);
};

const buscaAvancada = (params) => {
    let sql = `SELECT g.id, g.nome, m.nome as materia, g.local, 
                    (SELECT COUNT(*) FROM grupo_participantes gm WHERE gm.grupo_id = g.id) as numeroParticipantes, 
                    g.data_criacao as dataCriacao 
             FROM grupos g 
             JOIN materias m ON g.materia_id = m.id`;
    const queryParams = [];
    const conditions = [];

    if (params.nome) { conditions.push('g.nome LIKE ?'); queryParams.push(`%${params.nome}%`); }
    if (params.id) { conditions.push('g.id = ?'); queryParams.push(params.id); }
    if (params.materia) { conditions.push('m.nome LIKE ?'); queryParams.push(`%${params.materia}%`); }
    if (params.local) { conditions.push('g.local LIKE ?'); queryParams.push(`%${params.local}%`); }

    if (conditions.length > 0) { sql += ' WHERE ' + conditions.join(' AND '); }

    const orderByMapping = {
        popularidade: 'numeroParticipantes DESC',
        nivel_atividade: 'nivelAtividade DESC',
        data_criacao: 'dataCriacao DESC'
    };
    if (params.ordenarPor && orderByMapping[params.ordenarPor]) {
        sql += ` ORDER BY ${orderByMapping[params.ordenarPor]}`;
    }

    sql += ' LIMIT ?';
    queryParams.push(params.limite);

    return dbAll(sql, queryParams);
};

const createMensagem = async (grupoId, usuarioId, texto) => {
    const sql = 'INSERT INTO mensagens (grupo_id, usuario_id, texto) VALUES (?, ?, ?)';
    const result = await dbRun(sql, [grupoId, usuarioId, texto]);
    return dbGet('SELECT * FROM mensagens WHERE id = ?', [result.lastID]);
};

const getMensagensPorGrupo = (grupoId) => {
    const sql = 'SELECT * FROM mensagens WHERE grupo_id = ? ORDER BY data_envio ASC';
    return dbAll(sql, [grupoId]);
};

const isUserMember = async (grupoId, usuarioId) => {
    const sql = 'SELECT 1 FROM grupo_participantes WHERE grupo_id = ? AND usuario_id = ? AND status = \'membro\'';
    const row = await dbGet(sql, [grupoId, usuarioId]);
    return !!row;
};

module.exports = {
    create,
    findById,
    findAll,
    isUserAdmin,
    gerenciarMembro,
    softDeleteMensagem,
    buscaAvancada,
    createMensagem,
    getMensagensPorGrupo,
    isUserMember,
};
