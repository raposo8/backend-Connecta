const nodemailer = require('nodemailer');

// Usando um serviço de teste Ethereal. Substitua pela configuração do seu provedor de e-mail.
const enviarEmailConfirmacao = async (email, nome) => {
    try {
        // Crie uma conta de teste no Ethereal para obter as credenciais
        const testAccount = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        const info = await transporter.sendMail({
            from: '"Connexa" <nao-responda@connexa.com>',
            to: email,
            subject: 'Confirme seu cadastro',
            html: `<b>Olá ${nome},</b><br><p>Seu cadastro foi realizado com sucesso! Bem-vindo ao Connexa.</p>`,
        });

        console.log('E-mail de confirmação enviado: %s', info.messageId);
        // URL de preview do e-mail no Ethereal
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação:', error);
    }
};

module.exports = { enviarEmailConfirmacao };
