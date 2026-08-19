import nodemailer from 'nodemailer';

export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitializing = false;

  private async getTransporter() {
    if (this.transporter) return this.transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Use real SMTP if configured
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create a test account for development if no SMTP is configured
      if (!this.isInitializing) {
        this.isInitializing = true;
        console.log('No SMTP configuration found. Generating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        console.log('Ethereal test account created successfully.');
        this.isInitializing = false;
      } else {
        // Wait for initialization if another call triggered it
        while (this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return this.transporter!;
  }

  async sendPasswordRecoveryEmail(to: string, resetUrl: string, username: string) {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e9f2; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #001F60; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">NOC-NOC</h1>
            <p style="color: #00CE7C; margin: 5px 0 0 0; letter-spacing: 2px;">CENTRO DE MONITOREO</p>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #001F60; margin-top: 0;">Recuperación de Contraseña</h2>
            <p style="color: #4a5568; line-height: 1.6;">Hola <strong>${username}</strong>,</p>
            <p style="color: #4a5568; line-height: 1.6;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en la plataforma NOC-NOC.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #00CE7C; color: #001F60; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                RESTABLECER CONTRASEÑA
              </a>
            </div>
            
            <p style="color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
              Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará.<br>
              Este enlace expirará tan pronto como cambies tu contraseña o después de 1 hora.
            </p>
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: '"NOC-NOC Seguridad" <no-reply@nocnoc.com>',
        to: to,
        subject: 'NOC-NOC - Recuperación de Contraseña',
        html: htmlContent,
      });

      console.log('Message sent: %s', info.messageId);
      
      // If using Ethereal, log the URL to view the email
      if (!process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

export const mailService = new MailService();
