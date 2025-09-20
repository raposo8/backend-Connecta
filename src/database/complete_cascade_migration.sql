-- MIGRAÇÃO COMPLETA: APLICAÇÃO DE CASCADE EM TODAS AS FOREIGN KEYS
-- Esta migração atualiza todas as foreign keys para usar CASCADE
-- Deve ser executada com PRAGMA foreign_keys=OFF para permitir recreação das tabelas

PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

-- BACKUP das tabelas existentes
CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;
CREATE TABLE grupos_backup AS SELECT * FROM grupos;
CREATE TABLE mensagens_backup AS SELECT * FROM mensagens;
CREATE TABLE convites_backup AS SELECT * FROM convites;
CREATE TABLE grupo_participantes_backup AS SELECT * FROM grupo_participantes;
CREATE TABLE notificacoes_backup AS SELECT * FROM notificacoes;
CREATE TABLE materias_backup AS SELECT * FROM materias;

-- DROP das tabelas em ordem reversa de dependência
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS mensagens;
DROP TABLE IF EXISTS convites;
DROP TABLE IF EXISTS grupo_participantes;
DROP TABLE IF EXISTS grupos;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS usuarios;

-- RECRIAÇÃO das tabelas com CASCADE foreign keys

-- Tabela usuarios (não tem foreign keys)
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    ra VARCHAR(20),
    periodo VARCHAR(10),
    faculdade VARCHAR(100),
    foto TEXT,
    data_criacao TEXT DEFAULT (datetime('now','localtime')),
    ativo INTEGER DEFAULT 1
);

-- Tabela materias (não tem foreign keys)
CREATE TABLE materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(10),
    descricao TEXT,
    periodo VARCHAR(10),
    carga_horaria INTEGER,
    professor VARCHAR(255),
    data_criacao TEXT DEFAULT (datetime('now','localtime'))
);

-- Tabela grupos COM CASCADE na foreign key criador_id
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
    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela grupo_participantes COM CASCADE nas foreign keys
CREATE TABLE grupo_participantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    data_entrada TEXT DEFAULT (datetime('now','localtime')),
    papel VARCHAR(20) DEFAULT 'membro',
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(grupo_id, usuario_id)
);

-- Tabela mensagens COM CASCADE nas foreign keys
CREATE TABLE mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'texto',
    anexo_url TEXT,
    data_envio TEXT DEFAULT (datetime('now','localtime')),
    editada INTEGER DEFAULT 0,
    data_edicao TEXT,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela convites COM CASCADE nas foreign keys
CREATE TABLE convites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    criador_id INTEGER NOT NULL,
    codigo_convite VARCHAR(50) UNIQUE,
    email_convidado VARCHAR(255),
    tipo VARCHAR(20) DEFAULT 'direto',
    usado INTEGER DEFAULT 0,
    data_criacao TEXT DEFAULT (datetime('now','localtime')),
    data_expiracao TEXT,
    data_uso TEXT,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela notificacoes COM CASCADE nas foreign keys
CREATE TABLE notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    grupo_id INTEGER,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida INTEGER DEFAULT 0,
    data_criacao TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- RESTAURAÇÃO dos dados a partir dos backups
INSERT INTO usuarios SELECT * FROM usuarios_backup;
INSERT INTO materias SELECT * FROM materias_backup;
INSERT INTO grupos SELECT * FROM grupos_backup;
INSERT INTO grupo_participantes SELECT * FROM grupo_participantes_backup;
INSERT INTO mensagens SELECT * FROM mensagens_backup;
INSERT INTO convites SELECT * FROM convites_backup;
INSERT INTO notificacoes SELECT * FROM notificacoes_backup;

-- LIMPEZA dos backups
DROP TABLE usuarios_backup;
DROP TABLE grupos_backup;
DROP TABLE mensagens_backup;
DROP TABLE convites_backup;
DROP TABLE grupo_participantes_backup;
DROP TABLE notificacoes_backup;
DROP TABLE materias_backup;

-- RECRIAÇÃO dos índices de performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ra ON usuarios(ra);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia);
CREATE INDEX IF NOT EXISTS idx_grupos_local ON grupos(local);
CREATE INDEX IF NOT EXISTS idx_grupos_objetivo ON grupos(objetivo);
CREATE INDEX IF NOT EXISTS idx_grupos_publico ON grupos(is_publico);
CREATE INDEX IF NOT EXISTS idx_grupos_criador ON grupos(criador_id);
CREATE INDEX IF NOT EXISTS idx_grupos_vagas ON grupos(vagas_disponiveis);
CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao);

CREATE INDEX IF NOT EXISTS idx_grupo_participantes_grupo ON grupo_participantes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_usuario ON grupo_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_papel ON grupo_participantes(papel);
CREATE INDEX IF NOT EXISTS idx_grupo_participantes_data ON grupo_participantes(data_entrada);

CREATE INDEX IF NOT EXISTS idx_mensagens_grupo ON mensagens(grupo_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_usuario ON mensagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_data ON mensagens(data_envio);
CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(tipo);

CREATE INDEX IF NOT EXISTS idx_convites_grupo ON convites(grupo_id);
CREATE INDEX IF NOT EXISTS idx_convites_criador ON convites(criador_id);
CREATE INDEX IF NOT EXISTS idx_convites_codigo ON convites(codigo_convite);
CREATE INDEX IF NOT EXISTS idx_convites_email ON convites(email_convidado);
CREATE INDEX IF NOT EXISTS idx_convites_tipo ON convites(tipo);
CREATE INDEX IF NOT EXISTS idx_convites_usado ON convites(usado);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_grupo ON notificacoes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao);

CREATE INDEX IF NOT EXISTS idx_materias_codigo ON materias(codigo);
CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome);
CREATE INDEX IF NOT EXISTS idx_materias_periodo ON materias(periodo);

COMMIT;

PRAGMA foreign_keys=ON;

-- VERIFICAÇÃO final das foreign keys
SELECT 'VERIFICAÇÃO DAS FOREIGN KEYS:' as status;
PRAGMA foreign_key_list(grupos);
PRAGMA foreign_key_list(grupo_participantes);
PRAGMA foreign_key_list(mensagens);
PRAGMA foreign_key_list(convites);
PRAGMA foreign_key_list(notificacoes);