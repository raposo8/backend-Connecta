-- Schema completo do banco de dados Connexa Bahia-- Schema completo do banco de dados Connexa Bahia-- Script de criação da tabela usuarios para SQLite

-- Versão atualizada com todas as melhorias implementadas

-- Versão atualizada com todas as melhorias implementadasCREATE TABLE IF NOT EXISTS usuarios (

-- ===== TABELA USUARIOS =====

CREATE TABLE usuarios (    id INTEGER PRIMARY KEY AUTOINCREMENT,

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nome VARCHAR(255) NOT NULL,-- ===== TABELA USUARIOS =====    nome_completo TEXT NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    senha VARCHAR(255) NOT NULL,CREATE TABLE usuarios (    email TEXT NOT NULL UNIQUE,

    ra VARCHAR(20),

    periodo VARCHAR(10),    id INTEGER PRIMARY KEY AUTOINCREMENT,    curso TEXT NOT NULL,

    faculdade VARCHAR(100),

    foto TEXT,    nome VARCHAR(255) NOT NULL,    semestre INTEGER NOT NULL,

    data_criacao TEXT DEFAULT (datetime('now','localtime')),

    ativo INTEGER DEFAULT 1    email VARCHAR(255) UNIQUE NOT NULL,    senha_hash TEXT NOT NULL,

);

    senha VARCHAR(255) NOT NULL,    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP

-- ===== TABELA MATERIAS =====

CREATE TABLE materias (    ra VARCHAR(20),);

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nome VARCHAR(255) NOT NULL,    periodo VARCHAR(10),

    codigo VARCHAR(10),

    descricao TEXT,    faculdade VARCHAR(100),-- Script de criação da tabela materias

    periodo VARCHAR(10),

    carga_horaria INTEGER,    foto TEXT,CREATE TABLE IF NOT EXISTS materias (

    professor VARCHAR(255),

    data_criacao TEXT DEFAULT (datetime('now','localtime'))    data_criacao TEXT DEFAULT (datetime('now','localtime')),    id INTEGER PRIMARY KEY AUTOINCREMENT,

);

    ativo INTEGER DEFAULT 1    nome TEXT NOT NULL UNIQUE

-- ===== TABELA GRUPOS =====

CREATE TABLE grupos (););

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nome VARCHAR(255) NOT NULL,

    materia VARCHAR(100) NOT NULL,

    local VARCHAR(100) NOT NULL,-- ===== TABELA MATERIAS =====-- Popula a tabela materias com exemplos

    objetivo VARCHAR(100) NOT NULL,

    vagas_disponiveis INTEGER NOT NULL DEFAULT 0,CREATE TABLE materias (INSERT OR IGNORE INTO materias (nome) VALUES

    total_vagas INTEGER NOT NULL,

    descricao TEXT,    id INTEGER PRIMARY KEY AUTOINCREMENT,    ('Cálculo I'),

    is_publico INTEGER DEFAULT 1,

    criador_id INTEGER NOT NULL,    nome VARCHAR(255) NOT NULL,    ('Algoritmos e Estrutura de Dados'),

    data_criacao TEXT DEFAULT (datetime('now','localtime')),

    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE    codigo VARCHAR(10),    ('Física I'),

);

    descricao TEXT,    ('Química Geral'),

-- ===== TABELA GRUPO_PARTICIPANTES =====

CREATE TABLE grupo_participantes (    periodo VARCHAR(10),    ('Geometria Analítica');

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    grupo_id INTEGER NOT NULL,    carga_horaria INTEGER,

    usuario_id INTEGER NOT NULL,

    data_entrada TEXT DEFAULT (datetime('now','localtime')),    professor VARCHAR(255),-- Script de criação da tabela grupos

    papel VARCHAR(20) DEFAULT 'membro',

    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,    data_criacao TEXT DEFAULT (datetime('now','localtime'))CREATE TABLE IF NOT EXISTS grupos (

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    UNIQUE(grupo_id, usuario_id));    id INTEGER PRIMARY KEY AUTOINCREMENT,

);

    nome TEXT NOT NULL,

-- ===== TABELA MENSAGENS =====

CREATE TABLE mensagens (-- ===== TABELA GRUPOS =====    objetivo TEXT,

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    grupo_id INTEGER NOT NULL,CREATE TABLE grupos (    local TEXT,

    usuario_id INTEGER NOT NULL,

    conteudo TEXT NOT NULL,    id INTEGER PRIMARY KEY AUTOINCREMENT,    limite_participantes INTEGER,

    tipo VARCHAR(20) DEFAULT 'texto',

    anexo_url TEXT,    nome VARCHAR(255) NOT NULL,    is_publico BOOLEAN DEFAULT 1,

    data_envio TEXT DEFAULT (datetime('now','localtime')),

    editada INTEGER DEFAULT 0,    materia VARCHAR(100) NOT NULL,    criador_id INTEGER NOT NULL,

    data_edicao TEXT,

    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,    local VARCHAR(100) NOT NULL,    materia_id INTEGER NOT NULL,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE

);    objetivo VARCHAR(100) NOT NULL,    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,



-- ===== TABELA CONVITES =====    vagas_disponiveis INTEGER NOT NULL DEFAULT 0,    FOREIGN KEY (criador_id) REFERENCES usuarios(id),

CREATE TABLE convites (

    id INTEGER PRIMARY KEY AUTOINCREMENT,    total_vagas INTEGER NOT NULL,    FOREIGN KEY (materia_id) REFERENCES materias(id)

    grupo_id INTEGER NOT NULL,

    criador_id INTEGER NOT NULL,    descricao TEXT,);

    codigo_convite VARCHAR(50) UNIQUE,    is_publico INTEGER DEFAULT 1,

    email_convidado VARCHAR(255),    criador_id INTEGER NOT NULL,

    tipo VARCHAR(20) DEFAULT 'direto',    data_criacao TEXT DEFAULT (datetime('now','localtime')),

    usado INTEGER DEFAULT 0,    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE

    data_criacao TEXT DEFAULT (datetime('now','localtime')),);

    data_expiracao TEXT,

    data_uso TEXT,-- ===== TABELA GRUPO_PARTICIPANTES =====

    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,CREATE TABLE grupo_participantes (

    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE    id INTEGER PRIMARY KEY AUTOINCREMENT,

);    grupo_id INTEGER NOT NULL,

    usuario_id INTEGER NOT NULL,

-- ===== TABELA NOTIFICACOES =====    data_entrada TEXT DEFAULT (datetime('now','localtime')),

CREATE TABLE notificacoes (    papel VARCHAR(20) DEFAULT 'membro',

    id INTEGER PRIMARY KEY AUTOINCREMENT,    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,

    usuario_id INTEGER NOT NULL,    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    grupo_id INTEGER,    UNIQUE(grupo_id, usuario_id)

    tipo VARCHAR(50) NOT NULL,);

    titulo VARCHAR(255) NOT NULL,

    mensagem TEXT NOT NULL,-- ===== TABELA MENSAGENS =====

    lida INTEGER DEFAULT 0,CREATE TABLE mensagens (

    data_criacao TEXT DEFAULT (datetime('now','localtime')),    id INTEGER PRIMARY KEY AUTOINCREMENT,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,    grupo_id INTEGER NOT NULL,

    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE    usuario_id INTEGER NOT NULL,

);    conteudo TEXT NOT NULL,

    tipo VARCHAR(20) DEFAULT 'texto',

-- ===== ÍNDICES DE PERFORMANCE =====    anexo_url TEXT,

-- Índices para usuários    data_envio TEXT DEFAULT (datetime('now','localtime')),

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);    editada INTEGER DEFAULT 0,

CREATE INDEX IF NOT EXISTS idx_usuarios_ra ON usuarios(ra);    data_edicao TEXT,

CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE

-- Índices para grupos);

CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia);

CREATE INDEX IF NOT EXISTS idx_grupos_local ON grupos(local);-- ===== TABELA CONVITES =====

CREATE INDEX IF NOT EXISTS idx_grupos_objetivo ON grupos(objetivo);CREATE TABLE convites (

CREATE INDEX IF NOT EXISTS idx_grupos_publico ON grupos(is_publico);    id INTEGER PRIMARY KEY AUTOINCREMENT,

CREATE INDEX IF NOT EXISTS idx_grupos_criador ON grupos(criador_id);    grupo_id INTEGER NOT NULL,

CREATE INDEX IF NOT EXISTS idx_grupos_vagas ON grupos(vagas_disponiveis);    criador_id INTEGER NOT NULL,

CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao);    codigo_convite VARCHAR(50) UNIQUE,

    email_convidado VARCHAR(255),

-- Índices para grupo_participantes    tipo VARCHAR(20) DEFAULT 'direto',

CREATE INDEX IF NOT EXISTS idx_grupo_participantes_grupo ON grupo_participantes(grupo_id);    usado INTEGER DEFAULT 0,

CREATE INDEX IF NOT EXISTS idx_grupo_participantes_usuario ON grupo_participantes(usuario_id);    data_criacao TEXT DEFAULT (datetime('now','localtime')),

CREATE INDEX IF NOT EXISTS idx_grupo_participantes_papel ON grupo_participantes(papel);    data_expiracao TEXT,

CREATE INDEX IF NOT EXISTS idx_grupo_participantes_data ON grupo_participantes(data_entrada);    data_uso TEXT,

    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,

-- Índices para mensagens    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE

CREATE INDEX IF NOT EXISTS idx_mensagens_grupo ON mensagens(grupo_id););

CREATE INDEX IF NOT EXISTS idx_mensagens_usuario ON mensagens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_mensagens_data ON mensagens(data_envio);-- ===== TABELA NOTIFICACOES =====

CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(tipo);CREATE TABLE notificacoes (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

-- Índices para convites    usuario_id INTEGER NOT NULL,

CREATE INDEX IF NOT EXISTS idx_convites_grupo ON convites(grupo_id);    grupo_id INTEGER,

CREATE INDEX IF NOT EXISTS idx_convites_criador ON convites(criador_id);    tipo VARCHAR(50) NOT NULL,

CREATE INDEX IF NOT EXISTS idx_convites_codigo ON convites(codigo_convite);    titulo VARCHAR(255) NOT NULL,

CREATE INDEX IF NOT EXISTS idx_convites_email ON convites(email_convidado);    mensagem TEXT NOT NULL,

CREATE INDEX IF NOT EXISTS idx_convites_tipo ON convites(tipo);    lida INTEGER DEFAULT 0,

CREATE INDEX IF NOT EXISTS idx_convites_usado ON convites(usado);    data_criacao TEXT DEFAULT (datetime('now','localtime')),

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

-- Índices para notificações    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id););

CREATE INDEX IF NOT EXISTS idx_notificacoes_grupo ON notificacoes(grupo_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);-- ===== ÍNDICES DE PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);-- Índices para usuários

CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao);CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_usuarios_ra ON usuarios(ra);

-- Índices para materiasCREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_materias_codigo ON materias(codigo);

CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome);-- Índices para grupos

CREATE INDEX IF NOT EXISTS idx_materias_periodo ON materias(periodo);CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia);
CREATE INDEX IF NOT EXISTS idx_grupos_local ON grupos(local);
CREATE INDEX IF NOT EXISTS idx_grupos_objetivo ON grupos(objetivo);
CREATE INDEX IF NOT EXISTS idx_grupos_publico ON grupos(is_publico);
CREATE INDEX IF NOT EXISTS idx_grupos_criador ON grupos(criador_id);
CREATE INDEX IF NOT EXISTS idx_grupos_vagas ON grupos(vagas_disponiveis);
CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao);

-- Índices para grupo_participantes
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_grupo ON grupo_participantes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_usuario ON grupo_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_papel ON grupo_participantes(papel);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_data ON grupo_participantes(data_entrada);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_grupo ON mensagens(grupo_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_usuario ON mensagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_data ON mensagens(data_envio);
CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(tipo);

-- Índices para convites
CREATE INDEX IF NOT EXISTS idx_convites_grupo ON convites(grupo_id);
CREATE INDEX IF NOT EXISTS idx_convites_criador ON convites(criador_id);
CREATE INDEX IF NOT EXISTS idx_convites_codigo ON convites(codigo_convite);
CREATE INDEX IF NOT EXISTS idx_convites_email ON convites(email_convidado);
CREATE INDEX IF NOT EXISTS idx_convites_tipo ON convites(tipo);
CREATE INDEX IF NOT EXISTS idx_convites_usado ON convites(usado);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_grupo ON notificacoes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao);

-- Índices para materias
CREATE INDEX IF NOT EXISTS idx_materias_codigo ON materias(codigo);
CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome);
CREATE INDEX IF NOT EXISTS idx_materias_periodo ON materias(periodo);