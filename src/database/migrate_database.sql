-- Script de migração para atualizar banco connexa.sqlite
-- Data: 2025-09-19
-- Objetivo: Sincronizar estrutura do banco com os arquivos atualizados

-- ========================================
-- MIGRAÇÃO DA TABELA USUARIOS
-- ========================================

-- 1. Renomear tabela atual
ALTER TABLE usuarios RENAME TO usuarios_old;

-- 2. Criar nova tabela com estrutura corrigida
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    ra TEXT NOT NULL,
    curso TEXT,
    periodo TEXT,
    faculdade TEXT,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
);

-- 3. Migrar dados existentes (adaptando campos)
INSERT INTO usuarios (id, nome_completo, email, senha_hash, ra, curso, periodo, faculdade, criado_em)
SELECT 
    id, 
    nome_completo, 
    email, 
    senha_hash,
    'N/A' as ra,  -- Campo novo, valor padrão
    curso,
    CAST(semestre AS TEXT) as periodo,  -- Converte semestre para periodo
    'N/A' as faculdade,  -- Campo novo, valor padrão
    data_criacao as criado_em
FROM usuarios_old;

-- 4. Remover tabela antiga (comentado por segurança)
-- DROP TABLE usuarios_old;

-- ========================================
-- MIGRAÇÃO DA TABELA GRUPOS
-- ========================================

-- 1. Renomear tabela atual
ALTER TABLE grupos RENAME TO grupos_old;

-- 2. Criar nova tabela com estrutura corrigida
CREATE TABLE grupos (
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
    FOREIGN KEY (criador_id) REFERENCES usuarios(id)
);

-- 3. Migrar dados existentes (adaptando campos)
INSERT INTO grupos (id, nome, materia, local, objetivo, vagas_disponiveis, total_vagas, descricao, is_publico, criador_id, data_criacao)
SELECT 
    g.id,
    g.nome,
    m.nome as materia,  -- Busca nome da matéria pela FK
    COALESCE(g.local, 'A definir') as local,  -- Valor padrão se NULL
    COALESCE(g.objetivo, 'Estudos gerais') as objetivo,  -- Valor padrão se NULL
    COALESCE(g.limite_participantes, 0) as vagas_disponiveis,  -- Usar limite como vagas disponíveis
    COALESCE(g.limite_participantes, 5) as total_vagas,  -- Usar limite como total de vagas
    NULL as descricao,  -- Campo novo
    CASE WHEN g.is_publico = 1 THEN 1 ELSE 0 END as is_publico,
    g.criador_id,
    g.data_criacao
FROM grupos_old g
JOIN materias m ON g.materia_id = m.id;

-- 4. Remover tabela antiga (comentado por segurança)
-- DROP TABLE grupos_old;

-- ========================================
-- CRIAR NOVAS TABELAS
-- ========================================

-- Tabela de participantes dos grupos (nova)
CREATE TABLE IF NOT EXISTS grupo_participantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    data_entrada TEXT DEFAULT (datetime('now','localtime')),
    is_admin INTEGER DEFAULT 0,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(grupo_id, usuario_id)
);

-- Atualizar tabela de notificações
DROP TABLE IF EXISTS notificacoes;
CREATE TABLE notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    referencia_id INTEGER,
    lida INTEGER DEFAULT 0,
    criado_em TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ========================================
-- CRIAR ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia);
CREATE INDEX IF NOT EXISTS idx_grupos_criador ON grupos(criador_id);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_grupo ON grupo_participantes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_usuario ON grupo_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- ========================================
-- VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar estrutura das tabelas
.schema usuarios
.schema grupos
.schema grupo_participantes
.schema notificacoes

-- Verificar dados migrados
SELECT 'Usuarios migrados:' as info, COUNT(*) as total FROM usuarios;
SELECT 'Grupos migrados:' as info, COUNT(*) as total FROM grupos;
SELECT 'Materias existentes:' as info, COUNT(*) as total FROM materias;