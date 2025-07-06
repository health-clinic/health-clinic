import nodemailer, { Transporter } from 'nodemailer';

class SESMailProvider {
  private client!: Transporter;

  constructor() {
    this.createClient();
  }

  private async createClient() {
    try {
      const account = {
        pass: process.env.SMTP_PASS,
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: false,
        },
        user: process.env.SMTP_USER,
      };

      this.client = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
    } catch (err) {
      console.log(`EtherealMailProvider - Error:\n${err}`);
    }
  }

  async sendMail(to: string, subject: string, text: string): Promise<void> {
    if (!this.client) {
      await this.createClient();
    }

    const message = await this.client.sendMail({
      to,
      from: 'Postinho de Saúde <no-reply@healthclinic.com.br>',
      subject,
      text,
    });

    console.log('Message sent: %s', message.messageId);
  }
}

export default SESMailProvider;
