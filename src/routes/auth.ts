import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { omit } from 'lodash';
import MailtrapMailProvider from '../helpers/MailtrapMailProvider';
import { prisma } from '../../prisma/client';
import { redis } from '../configs/valkey/client';

const router = express.Router();

router.post('/register', async (request: Request, response: Response): Promise<void> => {
  try {
    const { name, email, password, document, phone, birthdate, address, role, specialty } =
      request.body;

    const createdAddress = await prisma.address.create({ data: address });
    const createdUser = await prisma.user.create({
      data: {
        addressId: createdAddress.id,
        name,
        email,
        password: await bcrypt.hash(password, 10),
        document,
        phone,
        birthdate: new Date(birthdate),
        role,
        specialty,
      },
      include: { address: true },
    });

    const token = jwt.sign({ email: createdUser.email }, process.env.SECRET_KEY!, {
      expiresIn: '30d',
    });

    response.status(201).json({ token, user: omit(createdUser, ['password']) });
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ message: 'Não foi possível completar o cadastro. Tente novamente mais tarde.' });
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
      return response
        .status(422)
        .json({ error: 'Usuário ou senha incorretos. Verifique suas credenciais.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return response
        .status(422)
        .json({ error: 'Usuário ou senha incorretos. Verifique suas credenciais.' });
    }

    const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY!, { expiresIn: '30d' });

    response.status(200).json({ token, user: omit(user, ['password']) });
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ message: 'Ocorreu um erro ao tentar realizar o login. Tente novamente mais tarde.' });
  }
});

router.post('/forgot-password', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email } = request.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      response.status(404).json({ message: 'Não encontramos um cadastro com este e-mail.' });

      return;
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`recovery:${email}`, recoveryCode, 'EX', 300);

    await new MailtrapMailProvider().sendMail(
      email,
      'Recuperação de Senha',
      `Seu código de recuperação é: ${recoveryCode}`,
    );

    response.status(200).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: 'Não foi possível enviar o código de recuperação. Tente novamente mais tarde.',
    });
  }
});

router.post('/verify-code', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, code } = request.body;

    const storedCode = await redis.get(`recovery:${email}`);
    if (!storedCode || storedCode !== code) {
      response.status(200).json({ match: false });

      return;
    }

    await redis.del(`recovery:${email}`);

    response.status(200).json({ match: true });
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ message: 'Não foi possível validar o código. Tente novamente mais tarde.' });
  }
});

router.post('/reset-password', async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password } = request.body;

    await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(password, 10) },
    });

    response.status(200).send();
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ message: 'Não foi possível redefinir a senha. Tente novamente mais tarde.' });
  }
});

export default router;
