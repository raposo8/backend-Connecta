const db = require('../db');

// Helper para transformar callbacks do SQLite em Promises
const dbGet = (query, params) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
};

const dbAll = (query, params) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
};

const dbRun = (query, params) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            resolve(this); // 'this' contém lastID e changes
        });
    });
};

// Criar nova mensagem
const create = async (mensagemData) => {
    const { conteudo, url_anexo, tipo_anexo, remetente_id, grupo_id } = mensagemData;
    
    // Validar tamanho do conteúdo
    if (conteudo && conteudo.length > 1000) {
        throw new Error('Conteúdo da mensagem não pode exceder 1000 caracteres');
    }
    
    const result = await dbRun(
        'INSERT INTO mensagens (conteudo, url_anexo, tipo_anexo, remetente_id, grupo_id) VALUES (?, ?, ?, ?, ?)',
        [conteudo, url_anexo || null, tipo_anexo || null, remetente_id, grupo_id]
    );
    
    return findById(result.lastID);
};

// Buscar mensagem por ID
const findById = (id) => {
    return dbGet(`
        SELECT 
            m.id,
            m.conteudo,
            m.url_anexo,
            m.tipo_anexo,
            m.remetente_id,
            m.grupo_id,
            m.data_envio,
            u.nome_completo as remetente_nome,
            u.email as remetente_email
        FROM mensagens m
        JOIN usuarios u ON m.remetente_id = u.id
        WHERE m.id = ?
    `, [id]);
};

// Buscar mensagens de um grupo (com paginação)
const findByGrupo = (grupoId, options = {}) => {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const order = options.order || 'DESC'; // DESC = mais recentes primeiro
    
    return dbAll(`
        SELECT 
            m.id,
            m.conteudo,
            m.url_anexo,
            m.tipo_anexo,
            m.remetente_id,
            m.grupo_id,
            m.data_envio,
            u.nome_completo as remetente_nome,
            u.email as remetente_email
        FROM mensagens m
        JOIN usuarios u ON m.remetente_id = u.id
        WHERE m.grupo_id = ?
        ORDER BY m.data_envio ${order}
        LIMIT ? OFFSET ?
    `, [grupoId, limit, offset]);
};

// Buscar mensagens de um usuário específico
const findByRemetente = (remetenteId, options = {}) => {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    return dbAll(`
        SELECT 
            m.id,
            m.conteudo,
            m.url_anexo,
            m.tipo_anexo,
            m.remetente_id,
            m.grupo_id,
            m.data_envio,
            g.nome as grupo_nome
        FROM mensagens m
        JOIN grupos g ON m.grupo_id = g.id
        WHERE m.remetente_id = ?
        ORDER BY m.data_envio DESC
        LIMIT ? OFFSET ?
    `, [remetenteId, limit, offset]);
};

// Buscar mensagens com anexos de um grupo
const findMensagensComAnexos = (grupoId) => {
    return dbAll(`
        SELECT 
            m.id,
            m.conteudo,
            m.url_anexo,
            m.tipo_anexo,
            m.remetente_id,
            m.grupo_id,
            m.data_envio,
            u.nome_completo as remetente_nome
        FROM mensagens m
        JOIN usuarios u ON m.remetente_id = u.id
        WHERE m.grupo_id = ? AND m.url_anexo IS NOT NULL
        ORDER BY m.data_envio DESC
    `, [grupoId]);
};

// Contar total de mensagens de um grupo
const countByGrupo = (grupoId) => {
    return dbGet(
        'SELECT COUNT(*) as total FROM mensagens WHERE grupo_id = ?',
        [grupoId]
    ).then(result => result ? result.total : 0);
};

// Buscar mensagens recentes de um grupo (últimas N mensagens)
const findRecentesByGrupo = (grupoId, limit = 20) => {
    return dbAll(`
        SELECT 
            m.id,
            m.conteudo,
            m.url_anexo,
            m.tipo_anexo,
            m.remetente_id,
            m.grupo_id,
            m.data_envio,
            u.nome_completo as remetente_nome,
            u.email as remetente_email
        FROM mensagens m
        JOIN usuarios u ON m.remetente_id = u.id
        WHERE m.grupo_id = ?
        ORDER BY m.data_envio DESC
        LIMIT ?
    `, [grupoId, limit]);
};

// Buscar mensagens por período de tempo
const findByPeriodo = (grupoId, dataInicio, dataFim) => {
    return dbAll(`
        SELECT 
            m.id,
            m.conteudo,
            m.url_anexo,
            m.tipo_anexo,
            m.remetente_id,
            m.grupo_id,
            m.data_envio,
            u.nome_completo as remetente_nome
        FROM mensagens m
        JOIN usuarios u ON m.remetente_id = u.id
        WHERE m.grupo_id = ? 
        AND m.data_envio >= ? 
        AND m.data_envio <= ?
        ORDER BY m.data_envio ASC
    `, [grupoId, dataInicio, dataFim]);
};

// Deletar mensagem (apenas o próprio remetente ou admin do grupo)
const deleteById = async (id) => {
    const result = await dbRun(
        'DELETE FROM mensagens WHERE id = ?',
        [id]
    );
    return result.changes > 0;
};

// Atualizar conteúdo da mensagem (edição)
const updateConteudo = async (id, novoConteudo) => {
    if (novoConteudo && novoConteudo.length > 1000) {
        throw new Error('Conteúdo da mensagem não pode exceder 1000 caracteres');
    }
    
    const result = await dbRun(
        'UPDATE mensagens SET conteudo = ? WHERE id = ?',
        [novoConteudo, id]
    );
    return result.changes > 0;
};

// Buscar estatísticas de mensagens por grupo
const getEstatisticas = (grupoId) => {
    return dbGet(`
        SELECT 
            COUNT(*) as total_mensagens,
            COUNT(DISTINCT remetente_id) as usuarios_ativos,
            COUNT(CASE WHEN url_anexo IS NOT NULL THEN 1 END) as mensagens_com_anexos,
            MIN(data_envio) as primeira_mensagem,
            MAX(data_envio) as ultima_mensagem
        FROM mensagens 
        WHERE grupo_id = ?
    `, [grupoId]);
};

module.exports = {
    create,
    findById,
    findByGrupo,
    findByRemetente,
    findMensagensComAnexos,
    countByGrupo,
    findRecentesByGrupo,
    findByPeriodo,
    deleteById,
    updateConteudo,
    getEstatisticas,
};