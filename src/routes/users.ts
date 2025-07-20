import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';
import { NotificationService } from '../services/notifications/notificationService';

const router = express.Router();

router.put('/users/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;
    const { name, password, document, phone, birthdate, address, role, specialty } = request.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!existingUser) {
      response.status(404).json({
        error: 'Usuário não encontrado. Verifique se o ID informado está correto.',
      });
      return;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      let { addressId } = existingUser;

      if (address) {
        let storedAddress = await tx.address.findFirst({
          where: {
            zipCode: address.zip_code,
          },
        });

        if (!storedAddress) {
          storedAddress = await tx.address.create({
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

        addressId = storedAddress.id;
      }

      const updateData: any = {
        ...(name && { name }),
        ...(document !== undefined && { document }),
        ...(phone !== undefined && { phone }),
        ...(birthdate && { birthdate: new Date(birthdate) }),
        ...(role && { role }),
        ...(specialty !== undefined && { specialty }),
        ...(addressId && { addressId }),
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUserData = await tx.user.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          address: true,
        },
      });

      return updatedUserData;
    });

    const administrators = await NotificationService.getAdministrators();
    if (administrators.length > 0) {
      const userType =
        updatedUser.role === 'patient'
          ? 'paciente'
          : updatedUser.role === 'professional'
            ? 'profissional'
            : 'usuário';

      await NotificationService.createNotifications(administrators, {
        title: 'Usuário atualizado',
        content: `${userType.charAt(0).toUpperCase() + userType.slice(1)} "${updatedUser.name}" foi atualizado.`,
        metadata: {
          id: updatedUser.id,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      });
    }

    await NotificationService.createNotification(updatedUser.id, {
      title: 'Perfil atualizado',
      content: 'Seu perfil foi atualizado com sucesso.',
      metadata: {
        id: updatedUser.id,
        name: updatedUser.name,
      },
    });

    response.json(omit(updatedUser, ['password']));
  } catch (error) {
    console.error(error);

    response.status(400).json({
      error:
        'Não foi possível atualizar o usuário. Verifique os dados informados e tente novamente.',
    });
  }
});

export default router;
