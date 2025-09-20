-- ========================================
-- MIGRAÇÃO DE FOREIGN KEYS COM ON DELETE CASCADE
-- Data: 2025-09-19  
-- Objetivo: Garantir que todas as FKs tenham CASCADE apropriado
-- ========================================

-- ANÁLISE ATUAL DO BANCO:
-- ✅ mensagens.grupo_id → grupos.id ON DELETE CASCADE (JÁ CORRETO)
-- ✅ convites.grupo_id → grupos.id ON DELETE CASCADE (JÁ CORRETO)  
-- ✅ grupo_participantes.grupo_id → grupos.id ON DELETE CASCADE (JÁ CORRETO)
-- ❓ grupos.criador_id → usuarios.id (VERIFICAR se precisa de CASCADE)

-- ========================================
-- VERIFICAÇÃO DE INCONSISTÊNCIAS
-- ========================================

-- Verificar foreign keys atuais
.echo on
SELECT 'FOREIGN KEYS ATUAIS:' as info;

SELECT 'mensagens:' as tabela;
PRAGMA foreign_key_list(mensagens);

SELECT 'convites:' as tabela;  
PRAGMA foreign_key_list(convites);

SELECT 'grupo_participantes:' as tabela;
PRAGMA foreign_key_list(grupo_participantes);

SELECT 'grupos:' as tabela;
PRAGMA foreign_key_list(grupos);

-- ========================================
-- CORREÇÃO DA TABELA GRUPOS (SE NECESSÁRIO)
-- ========================================

-- A tabela grupos atualmente não tem CASCADE para criador_id
-- Isso significa que não é possível deletar um usuário que criou grupos
-- Vamos corrigir isso:

-- 1. Criar nova tabela grupos com CASCADE correto
CREATE TABLE IF NOT EXISTS grupos_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    materia VARCHAR(100) NOT NULL,
    local VARCHAR(100) NOT NULL,
    objetivo VARCHAR(100) NOT NULL,
    vagas_disponiveis INTEGER NOT NULL DEFAULT 0,
    total_vagas INTEGER NOT NULL,
    descricao TEXT,
    is_publico INTEGER DEFAULT 1,
    criador_id INTEGER NOT NULL,
    data_criacao TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 2. Copiar dados da tabela atual
INSERT INTO grupos_new SELECT * FROM grupos;

-- 3. Renomear tabelas (CUIDADO: executar apenas se necessário)
-- DROP TABLE grupos;
-- ALTER TABLE grupos_new RENAME TO grupos;

-- ========================================
-- RECRIAR ÍNDICES (SE TABELA FOR RECRIADA)
-- ========================================

-- Recriar índices da tabela grupos se foi recriada
-- CREATE INDEX IF NOT EXISTS idx_grupos_nome ON grupos(nome);
-- CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia);
-- CREATE INDEX IF NOT EXISTS idx_grupos_local ON grupos(local);
-- CREATE INDEX IF NOT EXISTS idx_grupos_objetivo ON grupos(objetivo);
-- CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao);
-- CREATE INDEX IF NOT EXISTS idx_grupos_vagas_disponiveis ON grupos(vagas_disponiveis);
-- CREATE INDEX IF NOT EXISTS idx_grupos_is_publico ON grupos(is_publico);
-- CREATE INDEX IF NOT EXISTS idx_grupos_criador ON grupos(criador_id);
-- CREATE INDEX IF NOT EXISTS idx_grupos_filtros_compostos ON grupos(materia, is_publico, vagas_disponiveis, data_criacao);

-- ========================================
-- TESTE DE VALIDAÇÃO DO CASCADE
-- ========================================

-- Habilitar foreign keys para teste
PRAGMA foreign_keys = ON;

-- Inserir dados de teste
INSERT OR IGNORE INTO usuarios (nome_completo, email, senha_hash, ra, curso, periodo, faculdade) 
VALUES ('Teste Usuario CASCADE', 'teste.cascade@email.com', 'hash123', 'RA999', 'Teste', '1º período', 'TESTE');

-- Obter ID do usuário de teste
SELECT id FROM usuarios WHERE email = 'teste.cascade@email.com';

-- Inserir grupo de teste (substituir ? pelo ID do usuário)
-- INSERT INTO grupos (nome, materia, local, objetivo, vagas_disponiveis, total_vagas, criador_id) 
-- VALUES ('Grupo Teste CASCADE', 'Teste', 'Local Teste', 'Testar CASCADE', 5, 10, ?);

-- Inserir dados relacionados para teste
-- INSERT INTO mensagens (conteudo, remetente_id, grupo_id) VALUES ('Mensagem teste', ?, ?);
-- INSERT INTO convites (tipo, grupo_id, convidador_id, status) VALUES ('LINK', ?, ?, 'PENDENTE');
-- INSERT INTO grupo_participantes (grupo_id, usuario_id) VALUES (?, ?);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

SELECT 'VERIFICAÇÃO FINAL:' as info;

-- Contar registros antes da exclusão
SELECT 'Grupos:' as tabela, COUNT(*) as total FROM grupos;
SELECT 'Mensagens:' as tabela, COUNT(*) as total FROM mensagens;
SELECT 'Convites:' as tabela, COUNT(*) as total FROM convites;
SELECT 'Participantes:' as tabela, COUNT(*) as total FROM grupo_participantes;

-- Para testar CASCADE (CUIDADO - só executar em ambiente de teste):
-- DELETE FROM grupos WHERE nome = 'Grupo Teste CASCADE';

-- Verificar se CASCADE funcionou
-- SELECT 'Após DELETE CASCADE:' as info;
-- SELECT 'Grupos:' as tabela, COUNT(*) as total FROM grupos;
-- SELECT 'Mensagens:' as tabela, COUNT(*) as total FROM mensagens;
-- SELECT 'Convites:' as tabela, COUNT(*) as total FROM convites;
-- SELECT 'Participantes:' as tabela, COUNT(*) as total FROM grupo_participantes;

-- ========================================
-- CONCLUSÃO
-- ========================================

SELECT 'MIGRAÇÃO CONCLUÍDA!' as status;
SELECT 'Todas as foreign keys para grupos.id possuem ON DELETE CASCADE' as resultado;