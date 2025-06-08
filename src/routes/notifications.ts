import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/notifications', async (request: Request, response: Response): Promise<void> => {
  try {
    const { user_id: userId, read } = request.query;

    const notifications = await prisma.notification.findMany({
      where: {
        ...(userId ? { userId: Number(userId) } : {}),
        ...(read !== undefined ? { readAt: read === 'true' ? { not: null } : null } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    response.json(notifications);
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Não foi possível buscar as notificações. Por favor, tente mais tarde.' });
  }
});

router.get('/notifications/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const notification = await prisma.notification.findUnique({
      where: { id: Number(id) },
    });
    if (!notification) {
      response.status(404).json({
        error:
          'Não encontramos uma notificação com o ID informado, verifique se o mesmo está correto.',
      });

      return;
    }

    response.json(notification);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível consultar a notificação. Por favor, tente novamente mais tarde.',
    });
  }
});

router.post('/notifications', async (request: Request, response: Response): Promise<void> => {
  try {
    const { user_id: userId, title, content, metadata } = request.body;
    console.log('Dados recebidos:', request.body);
    const createdNotification = await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        metadata,
      },
    });

    response.status(201).json(createdNotification);
  } catch (error) {
    console.error(error);
    response.status(400).json({
      error:
        'Não foi possível criar a notificação. Verifique os dados informados e tente novamente.',
    });
  }
});

router.post('/notifications/read', async (request: Request, response: Response): Promise<void> => {
  try {
    const { notifications } = request.body;

    if (!notifications || !Array.isArray(notifications)) {
      response.status(400).json({
        error: 'É necessário fornecer um array de IDs de notificações.',
      });
      return;
    }

    const updatedNotifications = await prisma.notification.updateMany({
      where: { id: { in: notifications.map(id => Number(id)) } },
      data: { readAt: new Date() },
    });

    response.json({ 
      message: 'Notificações marcadas como lidas com sucesso.', 
      count: updatedNotifications.count 
    });
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível marcar as notificações como lidas. Por favor, tente novamente mais tarde.',
    });
  }
});

router.delete('/notifications/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const existingNotification = await prisma.notification.findUnique({
      where: { id: Number(id) },
    });
    if (!existingNotification) {
      response.status(404).json({
        error:
          'Não encontramos uma notificação com o ID informado, verifique se o mesmo está correto.',
      });

      return;
    }

    await prisma.notification.delete({
      where: { id: Number(id) },
    });

    response.status(204).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível excluir a notificação. Por favor, tente novamente mais tarde.',
    });
  }
});

export default router;