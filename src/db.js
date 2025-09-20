const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const DB_PATH = path.join(__dirname, 'database', 'connexa.sqlite');

// Criação da conexão com o banco
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        console.log('📍 Localização:', DB_PATH);
        
        // Habilita foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // Cria todas as tabelas
        createTables();
    }
});

// Função para criar todas as tabelas
function createTables() {
    db.serialize(() => {
        // Cria a tabela de usuários
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
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
        )`);

        // Cria a tabela de matérias
        db.run(`CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome VARCHAR(255) NOT NULL,
            codigo VARCHAR(10),
            descricao TEXT,
            periodo VARCHAR(10),
            carga_horaria INTEGER,
            professor VARCHAR(255),
            data_criacao TEXT DEFAULT (datetime('now','localtime'))
        )`);

        // Popula a tabela de matérias
        populateMaterias();

        // Cria a tabela de grupos
        db.run(`CREATE TABLE IF NOT EXISTS grupos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome VARCHAR(255) NOT NULL,
            materia_id INTEGER NOT NULL,
            local VARCHAR(100) NOT NULL,
            objetivo VARCHAR(100) NOT NULL,
            limite_participantes INTEGER NOT NULL,
            descricao TEXT,
            is_publico INTEGER DEFAULT 1,
            criador_id INTEGER NOT NULL,
            data_criacao TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
        )`);

        // Cria a tabela de participantes do grupo
        db.run(`CREATE TABLE IF NOT EXISTS grupo_participantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grupo_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            data_entrada TEXT DEFAULT (datetime('now','localtime')),
            papel VARCHAR(20) DEFAULT 'membro',
            FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE(grupo_id, usuario_id)
        )`);

        // Cria a tabela de mensagens
        db.run(`CREATE TABLE IF NOT EXISTS mensagens (
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
        )`);

        // Cria a tabela de convites
        db.run(`CREATE TABLE IF NOT EXISTS convites (
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
        )`);

        // Cria a tabela de notificações
        db.run(`CREATE TABLE IF NOT EXISTS notificacoes (
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
        )`);

        // Cria índices de performance
        createIndexes();

        console.log('✅ Todas as tabelas foram criadas/verificadas');
    });
}

// Função para criar índices de performance
function createIndexes() {
    const indexes = [
        // Índices para usuários
        'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
        'CREATE INDEX IF NOT EXISTS idx_usuarios_ra ON usuarios(ra)',
        'CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo)',
        
        // Índices para grupos
        'CREATE INDEX IF NOT EXISTS idx_grupos_materia ON grupos(materia_id)',
        'CREATE INDEX IF NOT EXISTS idx_grupos_local ON grupos(local)',
        'CREATE INDEX IF NOT EXISTS idx_grupos_objetivo ON grupos(objetivo)',
        'CREATE INDEX IF NOT EXISTS idx_grupos_publico ON grupos(is_publico)',
        'CREATE INDEX IF NOT EXISTS idx_grupos_criador ON grupos(criador_id)',
        'CREATE INDEX IF NOT EXISTS idx_grupos_limite ON grupos(limite_participantes)',
        'CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao)',
        
        // Índices para grupo_participantes
        'CREATE INDEX IF NOT EXISTS idx_grupo_participantes_grupo ON grupo_participantes(grupo_id)',
        'CREATE INDEX IF NOT EXISTS idx_grupo_participantes_usuario ON grupo_participantes(usuario_id)',
        'CREATE INDEX IF NOT EXISTS idx_grupo_participantes_papel ON grupo_participantes(papel)',
        'CREATE INDEX IF NOT EXISTS idx_grupo_participantes_data ON grupo_participantes(data_entrada)',
        
        // Índices para mensagens
        'CREATE INDEX IF NOT EXISTS idx_mensagens_grupo ON mensagens(grupo_id)',
        'CREATE INDEX IF NOT EXISTS idx_mensagens_usuario ON mensagens(usuario_id)',
        'CREATE INDEX IF NOT EXISTS idx_mensagens_data ON mensagens(data_envio)',
        'CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(tipo)',
        
        // Índices para convites
        'CREATE INDEX IF NOT EXISTS idx_convites_grupo ON convites(grupo_id)',
        'CREATE INDEX IF NOT EXISTS idx_convites_criador ON convites(criador_id)',
        'CREATE INDEX IF NOT EXISTS idx_convites_codigo ON convites(codigo_convite)',
        'CREATE INDEX IF NOT EXISTS idx_convites_email ON convites(email_convidado)',
        'CREATE INDEX IF NOT EXISTS idx_convites_tipo ON convites(tipo)',
        'CREATE INDEX IF NOT EXISTS idx_convites_usado ON convites(usado)',
        
        // Índices para notificações
        'CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id)',
        'CREATE INDEX IF NOT EXISTS idx_notificacoes_grupo ON notificacoes(grupo_id)',
        'CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo)',
        'CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida)',
        'CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao)',
        
        // Índices para materias
        'CREATE INDEX IF NOT EXISTS idx_materias_codigo ON materias(codigo)',
        'CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome)',
        'CREATE INDEX IF NOT EXISTS idx_materias_periodo ON materias(periodo)'
    ];

    indexes.forEach(indexQuery => {
        db.run(indexQuery, (err) => {
            if (err) {
                console.error('Erro ao criar índice:', err.message);
            }
        });
    });

    console.log('✅ Índices de performance criados');
}

function populateMaterias() {
    const materias = [
        { nome: 'Cálculo I', codigo: 'MAT001', periodo: '1', carga_horaria: 90 },
        { nome: 'Algoritmos e Estruturas de Dados I', codigo: 'INF001', periodo: '1', carga_horaria: 90 },
        { nome: 'Arquitetura de Computadores', codigo: 'INF002', periodo: '2', carga_horaria: 60 },
        { nome: 'Sistemas Operacionais', codigo: 'INF003', periodo: '3', carga_horaria: 90 },
        { nome: 'Redes de Computadores', codigo: 'INF004', periodo: '4', carga_horaria: 60 },
        { nome: 'Inteligência Artificial', codigo: 'INF005', periodo: '5', carga_horaria: 60 },
        { nome: 'Engenharia de Software I', codigo: 'INF006', periodo: '5', carga_horaria: 90 }
    ];

    const sql = `INSERT INTO materias (nome, codigo, periodo, carga_horaria) VALUES (?, ?, ?, ?)`;

    db.get('SELECT COUNT(*) as count FROM materias', (err, row) => {
        if (err) {
            console.error('Erro ao verificar matérias:', err.message);
            return;
        }

        if (row.count === 0) {
            console.log('Populando a tabela de matérias...');
            materias.forEach(materia => {
                db.run(sql, [materia.nome, materia.codigo, materia.periodo, materia.carga_horaria], (err) => {
                    if (err) {
                        console.error('Erro ao inserir matéria:', err.message);
                    }
                });
            });
            console.log('✅ Tabela de matérias populada.');
        } else {
            console.log('Tabela de matérias já populada.');
        }
    });
}

// Funções auxiliares para trabalhar com Promises
const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

// Exporta o banco e as funções auxiliares
module.exports = {
    db,
    dbGet,
    dbAll,
    dbRun
};