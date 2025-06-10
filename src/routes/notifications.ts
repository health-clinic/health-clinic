import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/notifications', async (request: Request, response: Response): Promise<void> => {
  try {
    const { user_id: userId } = request.query;

    const notifications = await prisma.notification.findMany({
      where: {
        ...(userId ? { userId: Number(userId) } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          include: {
            address: true,
          },
        },
      },
    });

    response.json(
      notifications.map((notification) => ({
        ...notification,
        user: omit(notification.user, ['password']),
      })),
    );
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Não foi possível buscar as notificações. Por favor, tente mais tarde.' });
  }
});

router.post('/notifications', async (request: Request, response: Response): Promise<void> => {
  try {
    const { user_id: userId, title, content, metadata } = request.body;

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

    const updatedNotifications = await prisma.$transaction(async (tx) => {
      await tx.notification.updateMany({
        where: { id: { in: notifications.map((id) => Number(id)) } },
        data: { readAt: new Date() },
      });

      return tx.notification.findMany({
        where: { id: { in: notifications.map((id) => Number(id)) } },
        include: {
          user: {
            include: {
              address: true,
            },
          },
        },
      });
    });

    response.json(
      updatedNotifications.map((notification) => ({
        ...notification,
        user: omit(notification.user, ['password']),
      })),
    );
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error:
        'Não foi possível marcar as notificações como lidas. Por favor, tente novamente mais tarde.',
    });
  }
});

export default router;
