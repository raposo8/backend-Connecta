-- ========================================
-- MIGRAÇÃO DE ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- Data: 2025-09-19
-- Objetivo: Criar índices para otimizar consultas de busca na tabela grupos
-- ========================================

-- ANÁLISE DE PERFORMANCE ANTES DOS ÍNDICES:
-- - Consultas por matéria: SCAN COMPLETO da tabela grupos
-- - Consultas por local com LIKE: SCAN COMPLETO da tabela grupos  
-- - Consultas por nome com ORDER BY: SCAN + TEMP B-TREE para ordenação
-- - Consultas complexas: Múltiplos SCANS e operações custosas

-- ========================================
-- CRIAÇÃO DE ÍNDICES OTIMIZADOS
-- ========================================

-- 1. Índice para busca por nome dos grupos (usado em pesquisas com LIKE)
CREATE INDEX IF NOT EXISTS idx_grupos_nome ON grupos(nome);

-- 2. Índice para filtro por matéria (filtro mais comum)
-- Nota: Este índice já existe da migração anterior, mas garantindo que esteja presente
CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia);

-- 3. Índice para busca por local (usado em filtros com LIKE)
CREATE INDEX IF NOT EXISTS idx_grupos_local ON grupos(local);

-- 4. Índice para busca por objetivo (usado em filtros com LIKE)
CREATE INDEX IF NOT EXISTS idx_grupos_objetivo ON grupos(objetivo);

-- 5. Índice para ordenação por data de criação (usado em ORDER BY)
CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao);

-- 6. Índice para filtro por vagas disponíveis (usado em WHERE vagas_disponiveis > 0)
CREATE INDEX IF NOT EXISTS idx_grupos_vagas_disponiveis ON grupos(vagas_disponiveis);

-- 7. Índice para filtro por grupos públicos/privados
CREATE INDEX IF NOT EXISTS idx_grupos_is_publico ON grupos(is_publico);

-- 8. Índice composto para consultas com múltiplos filtros
-- Ordem otimizada: materia (alta seletividade) -> is_publico -> vagas_disponiveis -> data_criacao (para ORDER BY)
CREATE INDEX IF NOT EXISTS idx_grupos_filtros_compostos ON grupos(materia, is_publico, vagas_disponiveis, data_criacao);

-- ========================================
-- VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- ========================================

-- Listar todos os índices da tabela grupos
.indexes grupos

-- ========================================
-- TESTES DE PERFORMANCE (EXEMPLOS)
-- ========================================

-- Teste 1: Busca por matéria específica
-- ANTES: SCAN grupos
-- DEPOIS: SEARCH grupos USING INDEX idx_grupos_materia (materia=?)
-- EXPLAIN QUERY PLAN SELECT * FROM grupos WHERE materia = 'Cálculo I';

-- Teste 2: Busca por local com LIKE
-- ANTES: SCAN grupos  
-- DEPOIS: Melhor performance com idx_grupos_local
-- EXPLAIN QUERY PLAN SELECT * FROM grupos WHERE local LIKE '%Biblioteca%';

-- Teste 3: Busca por nome com ordenação
-- ANTES: SCAN grupos + USE TEMP B-TREE FOR ORDER BY
-- DEPOIS: Uso otimizado dos índices
-- EXPLAIN QUERY PLAN SELECT * FROM grupos WHERE nome LIKE '%Cálculo%' ORDER BY data_criacao DESC;

-- Teste 4: Consulta complexa com múltiplos filtros
-- ANTES: SCAN grupos múltiplas vezes
-- DEPOIS: SEARCH grupos USING INDEX idx_grupos_filtros_compostos
-- EXPLAIN QUERY PLAN SELECT * FROM grupos WHERE materia = 'Física I' AND vagas_disponiveis > 0 AND is_publico = 1 ORDER BY data_criacao DESC;

-- ========================================
-- ÍNDICES EXISTENTES MANTIDOS
-- ========================================
-- Os seguintes índices já existiam e foram mantidos:
-- - idx_grupos_criador (para buscar grupos por criador)
-- - idx_usuarios_email (para login e autenticação)
-- - idx_grupo_participantes_grupo (para relacionamentos)
-- - idx_grupo_participantes_usuario (para relacionamentos)
-- - idx_notificacoes_usuario (para sistema de notificações)
-- - idx_notificacoes_lida (para filtrar notificações lidas/não lidas)

-- ========================================
-- BENEFÍCIOS ESPERADOS
-- ========================================
-- 1. Redução significativa no tempo de resposta das consultas de busca
-- 2. Melhor escalabilidade quando o número de grupos aumentar
-- 3. Menor uso de CPU para operações de filtro e ordenação
-- 4. Melhor experiência do usuário no feed de grupos
-- 5. Suporte eficiente para consultas complexas com múltiplos filtros

-- ========================================
-- MONITORAMENTO RECOMENDADO
-- ========================================
-- 1. Use EXPLAIN QUERY PLAN para verificar se os índices estão sendo utilizados
-- 2. Monitore o tamanho dos índices com: SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='grupos';
-- 3. Considere ANALYZE grupos; periodicamente para atualizar estatísticas do otimizador
-- 4. Monitore performance com: .timer on antes de executar consultas

SELECT 'Migração de índices concluída com sucesso!' as status;
SELECT 'Total de índices na tabela grupos: ' || COUNT(*) as info 
FROM sqlite_master 
WHERE type='index' AND tbl_name='grupos';