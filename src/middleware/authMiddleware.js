const jwt = require('jsonwebtoken');

const protegerRota = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'secreto_padrao';
        const decoded = jwt.verify(token, secret);

        // Anexa os dados do usuário decodificados ao objeto da requisição
        req.usuario = decoded;

        next(); // Passa para o próximo middleware ou rota
    } catch (error) {
        res.status(401).json({ message: 'Token inválido.' });
    }
};

const Grupo = require('../models/grupoModel');

const isGroupAdmin = async (req, res, next) => {
    try {
const usuarioId = req.usuario.id;

        const isAdmin = await Grupo.isUserAdmin(grupoId, usuarioId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
        }

        next();
    } catch (error) {
        console.error('Erro no middleware isGroupAdmin:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const isGroupMember = async (req, res, next) => {
    try {
        const grupoId = req.params.groupId;
        const usuarioId = req.usuario.id;

        const isMember = await Grupo.isUserMember(grupoId, usuarioId);

        if (!isMember) {
            return res.status(403).json({ error: 'Acesso negado. Você não é membro deste grupo.' });
        }

        next();
    } catch (error) {
        console.error('Erro no middleware isGroupMember:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = { protegerRota, isGroupAdmin, isGroupMember };
