import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { omit } from 'lodash';
import SESMailProvider from '../services/mails/SESMailProvider';
import { prisma } from '../prisma/client';
import { redis } from '../configs/valkey/client';
import { NotificationService } from '../services/notifications/notificationService';

const router = express.Router();

router.post('/register', async (request: Request, response: Response): Promise<void> => {
  try {
    const { name, email, password, document, phone, birthdate, address, role, specialty } =
      request.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { address: true },
    });
    if (user) {
      response.status(409).json({
        error:
          'Este e-mail já está associado a uma conta. Por favor, tente fazer login ou utilize um e-mail diferente para se cadastrar.',
      });

      return;
    }

    let createdAddress;
    if (role === 'patient') {
      createdAddress = await prisma.address.create({
        data: {
          zipCode: address.zip_code,
          state: address.state,
          city: address.city,
          district: address.district,
          street: address.street,
          number: Number(address.number),
        },
      });
    }

    const createdUser = await prisma.user.create({
      data: {
        addressId: createdAddress?.id,
        name,
        email,
        password: await bcrypt.hash(password, 10),
        document,
        phone,
        birthdate: birthdate ? new Date(birthdate) : null,
        role,
        specialty,
      },
      include: { address: true },
    });

    const token = jwt.sign({ email: createdUser.email }, process.env.JWT_SECRET!, {
      expiresIn: '30d',
    });

    if (createdUser.role === 'patient' || createdUser.role === 'professional') {
      const administrators = await NotificationService.getAdministrators();
      if (administrators.length > 0) {
        const userType = createdUser.role === 'patient' ? 'paciente' : 'profissional';

        await NotificationService.createNotifications(administrators, {
          title: `Novo ${userType}`,
          content: `${createdUser.role === 'patient' ? 'Paciente' : 'Profissional'} "${createdUser.name}" foi cadastrado.`,
          metadata: {
            id: createdUser.id,
            name: createdUser.name,
            role: createdUser.role,
          },
        });
      }
    }

    await NotificationService.createNotification(createdUser.id, {
      title: 'Bem-vindo!',
      content: `Olá ${createdUser.name}! Seu cadastro foi realizado com sucesso.`,
      metadata: {
        id: createdUser.id,
        name: createdUser.name,
        is_welcome: true,
      },
    });

    response.status(201).json({ token, user: omit(createdUser, ['password']) });
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Não foi possível completar o cadastro. Tente novamente mais tarde.' });
  }
});

router.post('/login', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password } = request.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { address: true },
    });
    if (!user) {
      response
        .status(422)
        .json({ error: 'Usuário ou senha incorretos. Verifique suas credenciais.' });

      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password!);
    if (!passwordMatch) {
      response
        .status(422)
        .json({ error: 'Usuário ou senha incorretos. Verifique suas credenciais.' });

      return;
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: '30d' });

    response.json({ token, user: omit(user, ['password']) });
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Ocorreu um erro ao tentar realizar o login. Tente novamente mais tarde.' });
  }
});

router.post('/forgot-password', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email } = request.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      response.status(404).json({ error: 'Não encontramos um cadastro com este e-mail.' });

      return;
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`recovery:${email}`, recoveryCode, 'EX', 300);

    await new SESMailProvider().sendMail(
      email,
      'Recuperação de Senha',
      `Seu código de recuperação é: ${recoveryCode}`,
    );

    response.send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível enviar o código de recuperação. Tente novamente mais tarde.',
    });
  }
});

router.post('/verify-code', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, code } = request.body;

    const storedCode = await redis.get(`recovery:${email}`);
    if (!storedCode || storedCode !== code) {
      response.json({ match: false });

      return;
    }

    await redis.del(`recovery:${email}`);

    response.json({ match: true });
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Não foi possível validar o código. Tente novamente mais tarde.' });
  }
});

router.post('/reset-password', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password } = request.body;

    await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(password, 10) },
    });

    response.send();
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Não foi possível redefinir a senha. Tente novamente mais tarde.' });
  }
});

export default router;
