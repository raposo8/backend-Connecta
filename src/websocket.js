const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const initWebSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*", // Em produção, restrinja para o seu domínio de front-end
            methods: ["GET", "POST"]
        }
    });

    // Middleware de autenticação do Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Autenticação falhou: token não fornecido.'));
        }

        jwt.verify(token, process.env.JWT_SECRET || 'secreto_padrao', (err, decoded) => {
            if (err) {
                return next(new Error('Autenticação falhou: token inválido.'));
            }
            socket.user = decoded; // Anexa os dados do usuário ao objeto do socket
            next();
        });
    });

    const Grupo = require('./models/grupoModel');

    io.on('connection', (socket) => {
        console.log(`Usuário conectado: ${socket.user.id}`);

        socket.on('join_room', (grupoId) => {
            socket.join(grupoId);
            console.log(`Usuário ${socket.user.id} entrou na sala: ${grupoId}`);
        });

        socket.on('send_message', async ({ grupoId, texto }) => {
            if (texto.length > 1000) {
                return socket.emit('error', { message: 'A mensagem não pode ter mais de 1000 caracteres.' });
            }

            try {
                const novaMensagem = await Grupo.createMensagem(grupoId, socket.user.id, texto);
                io.to(grupoId).emit('receive_message', novaMensagem);
            } catch (error) {
                console.error('Erro ao salvar mensagem:', error);
                socket.emit('error', { message: 'Erro ao salvar a mensagem.' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Usuário desconectado: ${socket.user.id}`);
        });
    });

    return io;
};

module.exports = initWebSocket;
