import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';


export class AuthController {
  // Gerar código de 6 dígitos
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Simular envio de email (substitua pela sua biblioteca de email)
  private async sendEmail(to: string, subject: string, content: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true para 465, false para 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Watchlist App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: content,
      html: `<p>${content}</p>`,
    });

    console.log(`📧 Email real enviado para ${to}`);
  }

  // 2. Enviar código para validar email
  async sendVerificationCode(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: 'Email é obrigatório' });
        return;
      }

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      // Invalidar códigos anteriores
      await prisma.emailVerificationCode.deleteMany({
        where: { email }
      });

      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Salvar código no banco
      await prisma.emailVerificationCode.create({
        data: {
          email,
          code,
          expiresAt
        }
      });

      // Enviar email
      await this.sendEmail(
        email,
        'Código de Verificação',
        `Seu código de verificação é: ${code}. Válido por 10 minutos.`
      );

      res.json({ message: 'Código de verificação enviado' });
    }catch (error: any) {
  console.error(error);
  console.error(error.stack);  // assim imprime o stack trace completo
  res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
}
  }

  // 3. Validar código de verificação de email
  async validateVerificationCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({ message: 'Email e código são obrigatórios' });
        return;
      }

      const verificationCode = await prisma.emailVerificationCode.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!verificationCode) {
        res.status(400).json({ message: 'Código inválido ou expirado' });
        return;
      }

      // Marcar código como usado
      await prisma.emailVerificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true }
      });

      // Marcar email como verificado
      await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true }
      });

      res.json({ message: 'Email verificado com sucesso' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
  }

  // 4. Enviar código para redefinir senha
  async sendPasswordResetCode(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: 'Email é obrigatório' });
        return;
      }

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      // Invalidar códigos anteriores
      await prisma.passwordResetCode.deleteMany({
        where: { email }
      });

      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar código no banco
      await prisma.passwordResetCode.create({
        data: {
          email,
          code,
          expiresAt
        }
      });

      // Enviar email
      await this.sendEmail(
        email,
        'Redefinição de Senha',
        `Seu código para redefinir a senha é: ${code}. Válido por 15 minutos.`
      );

      res.json({ message: 'Código de redefinição enviado' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
  }

  // 5. Validar código para redefinir senha
  async validatePasswordResetCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({ message: 'Email e código são obrigatórios' });
        return;
      }

      const resetCode = await prisma.passwordResetCode.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!resetCode) {
        res.status(400).json({ message: 'Código inválido ou expirado' });
        return;
      }

      res.json({ message: 'Código válido', valid: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
  }

  // 6. Alterar senha no banco de dados
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        res.status(400).json({ message: 'Email, código e nova senha são obrigatórios' });
        return;
      }

      // Validar código novamente
      const resetCode = await prisma.passwordResetCode.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!resetCode) {
        res.status(400).json({ message: 'Código inválido ou expirado' });
        return;
      }

      // Marcar código como usado
      await prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { used: true }
      });

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha do usuário
      await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword }
      });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
  }
}