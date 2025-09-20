
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarioModel');
const { enviarEmailConfirmacao } = require('../email');

const cadastrarUsuario = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        return res.status(403).json({ message: 'Você já está logado.' });
    }
    console.log("chegou ate aqui");
    const { nomeCompleto, email, senha, ra, periodo, faculdade } = req.body;

    if (!nomeCompleto || !email || !senha || !ra || !periodo || !faculdade) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const usuarioExistente = await Usuario.findByEmail(email);
        if (usuarioExistente) {
            return res.status(409).json({ message: 'E-mail já cadastrado.' });
        }

        const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!senhaRegex.test(senha)) {
            return res.status(400).json({ message: 'A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const novoUsuario = await Usuario.create({
            nome: nomeCompleto,
            email,
            senha: senha_hash,
            ra,
            periodo,
            faculdade
        });

        await enviarEmailConfirmacao(novoUsuario.email, novoUsuario.nome);

        res.status(201).json({ message: 'Usuário cadastrado com sucesso! Um e-mail de confirmação foi enviado.', usuario: novoUsuario });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const loginUsuario = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const usuario = await Usuario.findByEmail(email);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const payload = {
            id: usuario.id,
            nome: usuario.nome,
        };

        const secret = process.env.JWT_SECRET || 'secreto_padrao';
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        res.status(200).json({ token: token });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    cadastrarUsuario,
    loginUsuario,
    getPerfil,
};
