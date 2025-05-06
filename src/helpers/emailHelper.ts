import nodemailer from 'nodemailer';

/**
 * Função para enviar e-mails usando Gmail (SMTP com TLS na porta especificada).
 * @param destinatario - E-mail do destinatário.
 * @param assunto - Assunto do e-mail.
 * @param mensagem - Conteúdo do e-mail.
 */
export async function enviarEmail(destinatario: string, assunto: string, mensagem: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT!, 10),
      secure: false, // false para TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // Remetente
      to: destinatario, // Destinatário
      subject: assunto, // Assunto
      text: mensagem, // Texto do e-mail
    });

    console.log('E-mail enviado com sucesso:', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error(`Erro ao enviar e-mail: ${error}`);
  }
}
