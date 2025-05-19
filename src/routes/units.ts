import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/units', async (request: Request, response: Response): Promise<void> => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        address: true,
      },
    });

    response.json(units);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível buscar as unidades de saúde. Por favor, tente mais tarde.',
    });
  }
});

router.get('/units/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const unit = await prisma.unit.findUnique({
      where: { id: Number(id) },
      include: {
        address: true,
      },
    });

    if (!unit) {
      response.status(404).json({
        error: 'Unidade de saúde não encontrada. Verifique se o ID informado está correto.',
      });

      return;
    }

    response.json(unit);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error:
        'Não foi possível consultar a unidade de saúde. Por favor, tente novamente mais tarde.',
    });
  }
});

router.post('/units', async (request: Request, response: Response): Promise<void> => {
  try {
    const { name, phone, distance, address } = request.body;

    const createdUnit = await prisma.$transaction(async (tx) => {
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
            number: address.number,
          },
        });
      }

      return tx.unit.create({
        data: {
          name,
          phone,
          addressId: storedAddress.id,
          distance,
        },
        include: {
          address: true,
        },
      });
    });

    response.status(201).json(createdUnit);
  } catch (error) {
    console.error(error);

    response.status(400).json({
      error:
        'Não foi possível criar a unidade de saúde. Verifique os dados informados e tente novamente.',
    });
  }
});

router.put('/units/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;
    const { name, address_id: addressId, distance } = request.body;

    const existingUnit = await prisma.unit.findUnique({
      where: { id: Number(id) },
    });
    if (!existingUnit) {
      response.status(404).json({
        error: 'Unidade de saúde não encontrada. Verifique se o ID informado está correto.',
      });

      return;
    }

    const updatedUnit = await prisma.unit.update({
      where: { id: Number(id) },
      data: {
        name,
        addressId: addressId ? Number(addressId) : undefined,
        distance,
      },
      include: {
        address: true,
      },
    });

    response.json(updatedUnit);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível atualizar a unidade de saúde. Tente novamente mais tarde.',
    });
  }
});

router.delete('/units/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const existingUnit = await prisma.unit.findUnique({
      where: { id: Number(id) },
    });
    if (!existingUnit) {
      response.status(404).json({
        error: 'Unidade de saúde não encontrada. Verifique se o ID informado está correto.',
      });

      return;
    }

    await prisma.unit.delete({
      where: { id: Number(id) },
    });

    response.status(204).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível excluir a unidade de saúde. Tente novamente mais tarde.',
    });
  }
});

export default router;
