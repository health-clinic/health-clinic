import express, { Request, Response } from 'express';
import { format, parse } from 'date-fns';
import { prisma } from '../prisma/client';

const router = express.Router();

const parseTimeString = (timeString: string): Date => {
  return parse(timeString, 'HH:mm', new Date());
};

const formatTimeToString = (date: Date): string => {
  return format(date, 'HH:mm');
};

router.get('/units', async (request: Request, response: Response): Promise<void> => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        address: true,
        schedules: true,
        professionalSchedules: true,
      },
    });

    response.json(
      units.map((unit) => ({
        ...unit,
        schedules: unit.schedules?.map((schedule) => ({
          ...schedule,
          opening: formatTimeToString(schedule.opening),
          closing: formatTimeToString(schedule.closing),
        })),
        professionalSchedules: unit.professionalSchedules?.map((schedule) => ({
          ...schedule,
          start: formatTimeToString(schedule.start),
          end: formatTimeToString(schedule.end),
        })),
      })),
    );
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
        schedules: true,
        professionalSchedules: true,
      },
    });
    if (!unit) {
      response.status(404).json({
        error: 'Unidade de saúde não encontrada. Verifique se o ID informado está correto.',
      });

      return;
    }

    response.json({
      ...unit,
      schedules: unit.schedules?.map((schedule) => ({
        ...schedule,
        opening: formatTimeToString(schedule.opening),
        closing: formatTimeToString(schedule.closing),
      })),
      professionalSchedules: unit.professionalSchedules?.map((schedule) => ({
        ...schedule,
        start: formatTimeToString(schedule.start),
        end: formatTimeToString(schedule.end),
      })),
    });
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
    const {
      name,
      phone,
      address,
      schedules,
      professional_schedules: professionalSchedules,
    } = request.body;

    const existingUnit = await prisma.unit.findFirst({
      where: {
        AND: [{ name }, { phone }],
      },
    });
    if (existingUnit) {
      response.status(409).json({
        error:
          'Já existe uma unidade de saúde com o mesmo nome e telefone. Por favor, tente novamente com outras informações.',
      });

      return;
    }

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
        },
      });

      if (schedules && schedules.length > 0) {
        await tx.unit_schedule.createMany({
          data: schedules.map((schedule) => ({
            unitId: unit.id,
            dayOfWeek: schedule.day_of_week,
            opening: parseTimeString(schedule.opening),
            closing: parseTimeString(schedule.closing),
          })),
        });
      }

      if (professionalSchedules && professionalSchedules.length > 0) {
        await tx.professional_schedule.createMany({
          data: professionalSchedules.map((schedule) => ({
            professionalId: schedule.professional_id,
            unitId: unit.id,
            dayOfWeek: schedule.day_of_week,
            start: parseTimeString(schedule.start),
            end: parseTimeString(schedule.end),
          })),
        });
      }

      return tx.unit.findUnique({
        where: { id: unit.id },
        include: {
          address: true,
          schedules: true,
          professionalSchedules: true,
        },
      });
    });

    response.status(201).json({
      ...createdUnit,
      schedules: createdUnit?.schedules?.map((schedule) => ({
        ...schedule,
        opening: formatTimeToString(schedule.opening),
        closing: formatTimeToString(schedule.closing),
      })),
      professionalSchedules: createdUnit?.professionalSchedules?.map((schedule) => ({
        ...schedule,
        start: formatTimeToString(schedule.start),
        end: formatTimeToString(schedule.end),
      })),
    });
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
    const {
      name,
      phone,
      address,
      schedules,
      professional_schedules: professionalSchedules,
    } = request.body;

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
      let { addressId } = existingUnit;

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

        addressId = storedAddress.id;
      }

      if (schedules && schedules.length > 0) {
        await tx.unit_schedule.deleteMany({
          where: { unitId: Number(id) },
        });

        await tx.unit_schedule.createMany({
          data: schedules.map((schedule) => ({
            unitId: Number(id),
            dayOfWeek: schedule.day_of_week,
            opening: parseTimeString(schedule.opening),
            closing: parseTimeString(schedule.closing),
          })),
        });
      }

      if (professionalSchedules && professionalSchedules.length > 0) {
        await tx.professional_schedule.deleteMany({
          where: { unitId: Number(id) },
        });

        await tx.professional_schedule.createMany({
          data: professionalSchedules.map((schedule) => ({
            professionalId: schedule.professional_id,
            unitId: Number(id),
            dayOfWeek: schedule.day_of_week,
            start: parseTimeString(schedule.start),
            end: parseTimeString(schedule.end),
          })),
        });
      }

      await tx.unit.update({
        where: { id: Number(id) },
        data: {
          addressId,
          name,
          phone,
        },
      });

      return tx.unit.findUnique({
        where: { id: Number(id) },
        include: {
          address: true,
          schedules: true,
          professionalSchedules: true,
        },
      });
    });

    response.json({
      ...updatedUnit,
      schedules: updatedUnit?.schedules?.map((schedule) => ({
        ...schedule,
        opening: formatTimeToString(schedule.opening),
        closing: formatTimeToString(schedule.closing),
      })),
      professionalSchedules: updatedUnit?.professionalSchedules?.map((schedule) => ({
        ...schedule,
        start: formatTimeToString(schedule.start),
        end: formatTimeToString(schedule.end),
      })),
    });
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
