import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/units', async (request: Request, response: Response): Promise<void> => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        address: true,
        unit_schedule: true,
        professional_schedule: true,
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
        unit_schedule: true,
        professional_schedule: true,
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
    const { name, phone, distance, address, schedule, professionalSchedules } = request.body;

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

      const unit = await tx.unit.create({
        data: {
          name,
          phone,
          addressId: storedAddress.id,
          distance,
        },
      });

      // Criar horários de funcionamento
      for (const scheduleItem of schedule) {
        await tx.unit_schedule.create({
          data: {
            unitId: unit.id,
            dayOfWeek: scheduleItem.dayOfWeek,
            opening: scheduleItem.opening,
            closing: scheduleItem.closing,
          },
        });
      }

      // Criar escalas de profissionais
      for (const professionalSchedule of professionalSchedules) {
        await tx.professional_schedule.create({
          data: {
            unitId: unit.id,
            professionalId: professionalSchedule.professionalId,
            dayOfWeek: professionalSchedule.dayOfWeek,
            start: professionalSchedule.start,
            end: professionalSchedule.end,
          },
        });
      }

      return tx.unit.findUnique({
        where: { id: unit.id },
        include: {
          address: true,
          unit_schedule: true,
          professional_schedule: true,
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
    const { name, phone, distance, address, schedule, professionalSchedules } = request.body;

    const existingUnit = await prisma.unit.findUnique({
      where: { id: Number(id) },
    });
    if (!existingUnit) {
      response.status(404).json({
        error: 'Unidade de saúde não encontrada. Verifique se o ID informado está correto.',
      });

      return;
    }

    const updatedUnit = await prisma.$transaction(async (tx) => {
      // Atualizar endereço
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
              number: address.number,
            },
          });
        }
        await tx.unit.update({
          where: { id: Number(id) },
          data: {
            addressId: storedAddress.id,
          },
        });
      }

      // Atualizar unidade
      await tx.unit.update({
        where: { id: Number(id) },
        data: {
          name,
          phone,
          distance,
        },
      });

      // Atualizar horários de funcionamento
      if (schedule) {
        await tx.unit_schedule.deleteMany({
          where: { unitId: Number(id) },
        });
        for (const scheduleItem of schedule) {
          await tx.unit_schedule.create({
            data: {
              unitId: Number(id),
              dayOfWeek: scheduleItem.dayOfWeek,
              opening: scheduleItem.opening,
              closing: scheduleItem.closing,
            },
          });
        }
      }

      // Atualizar escalas de profissionais
      if (professionalSchedules) {
        await tx.professional_schedule.deleteMany({
          where: { unitId: Number(id) },
        });
        for (const professionalSchedule of professionalSchedules) {
          await tx.professional_schedule.create({
            data: {
              unitId: Number(id),
              professionalId: professionalSchedule.professionalId,
              dayOfWeek: professionalSchedule.dayOfWeek,
              start: professionalSchedule.start,
              end: professionalSchedule.end,
            },
          });
        }
      }

      return tx.unit.findUnique({
        where: { id: Number(id) },
        include: {
          address: true,
          unit_schedule: true,
          professional_schedule: true,
        },
      });
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