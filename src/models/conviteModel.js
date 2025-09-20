const db = require('../db');
const crypto = require('crypto');

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

// Gerar token único para convites por link
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Criar convite direto (usuário para usuário)
const createConviteDireto = async (convidadorId, convidadoId, grupoId) => {
    // Verificar se já existe convite pendente entre os mesmos usuários para o mesmo grupo
    const conviteExistente = await dbGet(
        'SELECT id FROM convites WHERE grupo_id = ? AND convidador_id = ? AND convidado_id = ? AND status = "PENDENTE"',
        [grupoId, convidadorId, convidadoId]
    );
    
    if (conviteExistente) {
        throw new Error('Já existe um convite pendente para este usuário neste grupo');
    }
    
    const result = await dbRun(
        'INSERT INTO convites (tipo, grupo_id, convidador_id, convidado_id, status) VALUES (?, ?, ?, ?, ?)',
        ['DIRETO', grupoId, convidadorId, convidadoId, 'PENDENTE']
    );
    
    return findById(result.lastID);
};

// Criar convite por link
const createConviteLink = async (convidadorId, grupoId, dataExpiracao = null) => {
    const token = generateToken();
    
    const result = await dbRun(
        'INSERT INTO convites (tipo, token, grupo_id, convidador_id, data_expiracao, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['LINK', token, grupoId, convidadorId, dataExpiracao, 'PENDENTE']
    );
    
    return findById(result.lastID);
};

// Buscar convite por ID
const findById = (id) => {
    return dbGet(`
        SELECT 
            c.*,
            g.nome as grupo_nome,
            convidador.nome_completo as convidador_nome,
            convidado.nome_completo as convidado_nome
        FROM convites c
        JOIN grupos g ON c.grupo_id = g.id
        JOIN usuarios convidador ON c.convidador_id = convidador.id
        LEFT JOIN usuarios convidado ON c.convidado_id = convidado.id
        WHERE c.id = ?
    `, [id]);
};

// Buscar convite por token
const findByToken = (token) => {
    return dbGet(`
        SELECT 
            c.*,
            g.nome as grupo_nome,
            g.descricao as grupo_descricao,
            g.materia as grupo_materia,
            g.vagas_disponiveis,
            convidador.nome_completo as convidador_nome
        FROM convites c
        JOIN grupos g ON c.grupo_id = g.id
        JOIN usuarios convidador ON c.convidador_id = convidador.id
        WHERE c.token = ? AND c.status = 'PENDENTE'
    `, [token]);
};

// Buscar convites recebidos por um usuário
const findConvitesRecebidos = (usuarioId, status = null) => {
    let query = `
        SELECT 
            c.*,
            g.nome as grupo_nome,
            g.descricao as grupo_descricao,
            g.materia as grupo_materia,
            convidador.nome_completo as convidador_nome,
            convidador.email as convidador_email
        FROM convites c
        JOIN grupos g ON c.grupo_id = g.id
        JOIN usuarios convidador ON c.convidador_id = convidador.id
        WHERE c.convidado_id = ? AND c.tipo = 'DIRETO'
    `;
    
    let params = [usuarioId];
    
    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY c.data_criacao DESC';
    
    return dbAll(query, params);
};

// Buscar convites enviados por um usuário
const findConvitesEnviados = (usuarioId, status = null) => {
    let query = `
        SELECT 
            c.*,
            g.nome as grupo_nome,
            g.descricao as grupo_descricao,
            convidado.nome_completo as convidado_nome,
            convidado.email as convidado_email
        FROM convites c
        JOIN grupos g ON c.grupo_id = g.id
        LEFT JOIN usuarios convidado ON c.convidado_id = convidado.id
        WHERE c.convidador_id = ?
    `;
    
    let params = [usuarioId];
    
    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY c.data_criacao DESC';
    
    return dbAll(query, params);
};

// Buscar convites de um grupo
const findConvitesByGrupo = (grupoId, tipo = null, status = null) => {
    let query = `
        SELECT 
            c.*,
            convidador.nome_completo as convidador_nome,
            convidado.nome_completo as convidado_nome
        FROM convites c
        JOIN usuarios convidador ON c.convidador_id = convidador.id
        LEFT JOIN usuarios convidado ON c.convidado_id = convidado.id
        WHERE c.grupo_id = ?
    `;
    
    let params = [grupoId];
    
    if (tipo) {
        query += ' AND c.tipo = ?';
        params.push(tipo);
    }
    
    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY c.data_criacao DESC';
    
    return dbAll(query, params);
};

// Aceitar convite
const aceitarConvite = async (conviteId, usuarioId = null) => {
    const convite = await findById(conviteId);
    
    if (!convite) {
        throw new Error('Convite não encontrado');
    }
    
    if (convite.status !== 'PENDENTE') {
        throw new Error('Convite não está pendente');
    }
    
    // Verificar se convite não expirou
    if (convite.data_expiracao && new Date(convite.data_expiracao) < new Date()) {
        await dbRun('UPDATE convites SET status = "EXPIRADO" WHERE id = ?', [conviteId]);
        throw new Error('Convite expirado');
    }
    
    // Para convites diretos, verificar se o usuário é o destinatário
    if (convite.tipo === 'DIRETO' && convite.convidado_id !== usuarioId) {
        throw new Error('Usuário não autorizado a aceitar este convite');
    }
    
    // Aceitar o convite
    const result = await dbRun(
        'UPDATE convites SET status = "ACEITO" WHERE id = ?',
        [conviteId]
    );
    
    return result.changes > 0;
};

// Recusar convite
const recusarConvite = async (conviteId, usuarioId) => {
    const convite = await findById(conviteId);
    
    if (!convite) {
        throw new Error('Convite não encontrado');
    }
    
    if (convite.status !== 'PENDENTE') {
        throw new Error('Convite não está pendente');
    }
    
    // Verificar se o usuário é o destinatário (apenas para convites diretos)
    if (convite.tipo === 'DIRETO' && convite.convidado_id !== usuarioId) {
        throw new Error('Usuário não autorizado a recusar este convite');
    }
    
    const result = await dbRun(
        'UPDATE convites SET status = "RECUSADO" WHERE id = ?',
        [conviteId]
    );
    
    return result.changes > 0;
};

// Cancelar convite (apenas quem enviou)
const cancelarConvite = async (conviteId, usuarioId) => {
    const convite = await findById(conviteId);
    
    if (!convite) {
        throw new Error('Convite não encontrado');
    }
    
    if (convite.convidador_id !== usuarioId) {
        throw new Error('Apenas quem enviou o convite pode cancelá-lo');
    }
    
    if (convite.status !== 'PENDENTE') {
        throw new Error('Convite não está pendente');
    }
    
    const result = await dbRun(
        'UPDATE convites SET status = "RECUSADO" WHERE id = ?',
        [conviteId]
    );
    
    return result.changes > 0;
};

// Marcar convites expirados
const marcarConvitesExpirados = async () => {
    const agora = new Date().toISOString();
    const result = await dbRun(
        'UPDATE convites SET status = "EXPIRADO" WHERE data_expiracao < ? AND status = "PENDENTE"',
        [agora]
    );
    
    return result.changes;
};

// Verificar se usuário já tem convite pendente para um grupo
const hasConvitePendente = async (usuarioId, grupoId) => {
    const convite = await dbGet(
        'SELECT id FROM convites WHERE convidado_id = ? AND grupo_id = ? AND status = "PENDENTE"',
        [usuarioId, grupoId]
    );
    
    return !!convite;
};

// Desativar link de convite (marcar como expirado)
const desativarLink = async (token, usuarioId) => {
    const convite = await dbGet(
        'SELECT id, convidador_id FROM convites WHERE token = ?',
        [token]
    );
    
    if (!convite) {
        throw new Error('Link de convite não encontrado');
    }
    
    if (convite.convidador_id !== usuarioId) {
        throw new Error('Apenas quem criou o link pode desativá-lo');
    }
    
    const result = await dbRun(
        'UPDATE convites SET status = "EXPIRADO" WHERE token = ?',
        [token]
    );
    
    return result.changes > 0;
};

// Estatísticas de convites de um grupo
const getEstatisticas = (grupoId) => {
    return dbGet(`
        SELECT 
            COUNT(*) as total_convites,
            COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pendentes,
            COUNT(CASE WHEN status = 'ACEITO' THEN 1 END) as aceitos,
            COUNT(CASE WHEN status = 'RECUSADO' THEN 1 END) as recusados,
            COUNT(CASE WHEN status = 'EXPIRADO' THEN 1 END) as expirados,
            COUNT(CASE WHEN tipo = 'DIRETO' THEN 1 END) as convites_diretos,
            COUNT(CASE WHEN tipo = 'LINK' THEN 1 END) as convites_link
        FROM convites 
        WHERE grupo_id = ?
    `, [grupoId]);
};

module.exports = {
    createConviteDireto,
    createConviteLink,
    findById,
    findByToken,
    findConvitesRecebidos,
    findConvitesEnviados,
    findConvitesByGrupo,
    aceitarConvite,
    recusarConvite,
    cancelarConvite,
    marcarConvitesExpirados,
    hasConvitePendente,
    desativarLink,
    getEstatisticas,
};