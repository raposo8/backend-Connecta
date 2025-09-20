const express = require('express');
const router = express.Router();
const gruposController = require('../controllers/gruposController');
const { protegerRota, isGroupAdmin } = require('../middleware/authMiddleware');

router.get('/busca', protegerRota, gruposController.buscaAvancada);

// Rota para criar um novo grupo (protegida)
router.post('/', protegerRota, gruposController.criarGrupo);
router.get('/', protegerRota, gruposController.listarGrupos);

// Exemplo de rota protegida pelo middleware isGroupAdmin
router.put('/:id/configuracoes', protegerRota, isGroupAdmin, (req, res) => {
    // Lógica do controlador para atualizar as configurações do grupo
    res.status(200).json({ message: `Configurações do grupo ${req.params.id} atualizadas com sucesso.` });
});

// Rotas para gerenciamento de membros
router.put('/:grupoId/solicitacoes/:usuarioId/aprovar', protegerRota, isGroupAdmin, gruposController.aprovarSolicitacao);
router.put('/:grupoId/solicitacoes/:usuarioId/rejeitar', protegerRota, isGroupAdmin, gruposController.rejeitarSolicitacao);
router.delete('/:grupoId/membros/:usuarioId', protegerRota, isGroupAdmin, gruposController.removerMembro);

// Rota para excluir mensagem (soft delete)
router.delete('/:grupoId/mensagens/:mensagemId', protegerRota, isGroupAdmin, gruposController.excluirMensagem);

// Rota para buscar histórico de mensagens
router.get('/:grupoId/mensagens', protegerRota, gruposController.getMensagens);

module.exports = router;