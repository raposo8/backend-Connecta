const Grupo = require('../models/grupoModel');
const Notificacao = require('../models/notificacaoModel');
const Materia = require('../models/materiaModel');

const criarGrupo = async (req, res) => {
    const { nome, materiaId, objetivo, local, limiteParticipantes, isPublico } = req.body;
    const criadorId = req.usuario.id; // Obtido do payload do JWT

    try {
        // 1. Validação da matéria
        const materia = await Materia.findById(materiaId);
        if (!materia) {
            return res.status(400).json({ error: 'Matéria não encontrada.' });
        }

        // 2. Criação do grupo
        const novoGrupo = await Grupo.create({
            nome,
            materiaId,
            objetivo,
            local,
            limiteParticipantes,
            isPublico,
            criadorId,
        });

        // 3. Criação da notificação
        await Notificacao.create({
            usuarioId: criadorId,
            mensagem: `Você criou o grupo: ${nome}`,
            tipo: 'novo_grupo',
            titulo: 'Novo Grupo Criado'
        });

        // 4. Resposta de sucesso
        res.status(201).json(novoGrupo);

    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar o grupo.' });
    }
};

const listarGrupos = async (req, res) => {
    const { materia, local, objetivo } = req.query;

    try {
        const filtros = { materia, local, objetivo };
        const grupos = await Grupo.findAll(filtros);
        res.status(200).json(grupos);
    } catch (error) {
        console.error('Erro ao listar grupos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar grupos.' });
    }
};

const aprovarSolicitacao = async (req, res) => {
    const { grupoId, usuarioId } = req.params;
    try {
        const resultado = await Grupo.gerenciarMembro(grupoId, usuarioId, 'pendente', 'membro');
        if (!resultado) {
            return res.status(404).json({ message: 'Solicitação não encontrada ou já processada.' });
        }
        // notificarAprovacao(usuarioId, grupoId);
        res.status(200).json({ message: 'Usuário aprovado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao aprovar solicitação.' });
    }
};

const rejeitarSolicitacao = async (req, res) => {
    const { grupoId, usuarioId } = req.params;
    try {
        const resultado = await Grupo.gerenciarMembro(grupoId, usuarioId, 'pendente');
        if (!resultado) {
            return res.status(404).json({ message: 'Solicitação não encontrada ou já processada.' });
        }
        // notificarRejeicao(usuarioId, grupoId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao rejeitar solicitação.' });
    }
};

const removerMembro = async (req, res) => {
    const { grupoId, usuarioId } = req.params;
    try {
        const resultado = await Grupo.gerenciarMembro(grupoId, usuarioId, 'membro');
        if (!resultado) {
            return res.status(404).json({ message: 'Membro não encontrado no grupo.' });
        }
        // notificarRemocao(usuarioId, grupoId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover membro.' });
    }
};

const excluirMensagem = async (req, res) => {
    const { grupoId, mensagemId } = req.params;

    try {
        const resultado = await Grupo.softDeleteMensagem(grupoId, mensagemId);

        if (!resultado) {
            return res.status(404).json({ message: 'Mensagem não encontrada ou não pertence ao grupo.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir a mensagem.' });
    }
};

const buscaAvancada = async (req, res) => {
    const { nome, id, materia, local, ordenarPor, limite } = req.query;

    const validOrderBy = ['popularidade', 'nivel_atividade', 'data_criacao'];
    if (ordenarPor && !validOrderBy.includes(ordenarPor)) {
        return res.status(400).json({ message: "Valor inválido para 'ordenarPor'. Use 'popularidade', 'nivel_atividade' ou 'data_criacao'." });
    }

    const limiteFinal = Math.min(parseInt(limite, 10) || 10, 50);

    try {
        const grupos = await Grupo.buscaAvancada({ nome, id, materia, local, ordenarPor, limite: limiteFinal });
        res.status(200).json({ grupos });
    } catch (error) {
        console.error('Erro na busca avançada:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getMensagens = async (req, res) => {
    const { grupoId } = req.params;

    try {
        const mensagens = await Grupo.getMensagensPorGrupo(grupoId);
        res.status(200).json(mensagens);
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    criarGrupo,
    listarGrupos,
    aprovarSolicitacao,
    rejeitarSolicitacao,
    removerMembro,
    excluirMensagem,
    buscaAvancada,
    getMensagens,
};