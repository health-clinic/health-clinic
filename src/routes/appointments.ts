import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { endOfDay, startOfDay } from 'date-fns';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/appointments', async (request: Request, response: Response): Promise<void> => {
  try {
    const {
      status,
      date_from: from,
      date_to: to,
      professional_id: professionalId,
      unit_id: unitId,
      patient_id: patientId,
    } = request.query;

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(status ? { status: status as string } : {}),
        ...(from || to
          ? {
              scheduledFor: {
                ...(from ? { gte: startOfDay(new Date(from as string)) } : {}),
                ...(to ? { lte: endOfDay(new Date(to as string)) } : {}),
              },
            }
          : {}),
        ...(professionalId ? { professionalId: Number(professionalId) } : {}),
        ...(unitId ? { unitId: Number(unitId) } : {}),
        ...(patientId ? { patientId: Number(patientId) } : {}),
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      include: {
        unit: {
          include: {
            address: true,
          },
        },
        professional: {
          include: {
            address: true,
          },
        },
        patient: {
          include: {
            address: true,
          },
        },
      },
    });

    response.json(
      appointments.map((appointment) => ({
        ...appointment,
        professional: omit(appointment.professional, ['password']),
        patient: omit(appointment.patient, ['password']),
      })),
    );
  } catch (error) {
    console.error(error);

    response
      .status(500)
      .json({ error: 'Não foi possível buscar os agendamentos. Por favor, tente mais tarde.' });
  }
});

router.get('/appointments/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: {
        unit: true,
        professional: true,
        patient: true,
      },
    });
    if (!appointment) {
      response.status(404).json({
        error:
          'Não encontramos um agendamento com o ID informado, verifique se o mesmo está correto.',
      });
      return;
    }

    response.json({
      ...appointment,
      professional: omit(appointment.professional, ['password']),
      patient: omit(appointment.patient, ['password']),
    });
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível consultar o agendamento. Por favor, tente novamente mais tarde.',
    });
  }
});

router.post('/appointments', async (request: Request, response: Response): Promise<void> => {
  try {
    const {
      professional_id: professionalId,
      patient_id: patientId,
      unit_id: unitId,
      scheduled_for: scheduledFor,
      prescriptions,
    } = request.body;

    const alreadyExists = await prisma.appointment.findFirst({
      where: {
        professionalId: Number(professionalId),
        scheduledFor: new Date(scheduledFor),
        NOT: {
          status: 'cancelled',
        },
      },
    });
    if (alreadyExists) {
      response.status(409).json({
        error:
          'O profissional já possui um agendamento neste horário. Por favor, escolha outro horário.',
      });
      return;
    }

    const createdAppointment = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          professionalId: Number(professionalId),
          patientId: Number(patientId),
          unitId: Number(unitId),
          scheduledFor: new Date(scheduledFor),
        },
        include: {
          unit: true,
          professional: true,
          patient: true,
        },
      });

      if (prescriptions && prescriptions.length > 0) {
        await tx.prescription.createMany({
          data: prescriptions.map((prescription) => ({
            name: prescription.name,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            appointmentId: appointment.id,
          })),
        });
      }

      return tx.appointment.findUnique({
        where: { id: appointment.id },
        include: {
          unit: true,
          professional: true,
          patient: true,
          prescriptions: true,
        },
      });
    });

    if (!createdAppointment) {
      throw new Error('Failed to create appointment');
    }

    response.status(201).json({
      appointment: {
        ...createdAppointment,
        professional: omit(createdAppointment.professional, ['password']),
        patient: omit(createdAppointment.patient, ['password']),
      },
    });
  } catch (error) {
    console.error(error);

    response.status(400).json({
      error:
        'Não foi possível criar o agendamento. Verifique os dados informados e tente novamente.',
    });
  }
});

router.put('/appointments/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;
    const { scheduled_at: scheduledAt } = request.body;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        scheduledFor: new Date(scheduledAt),
      },
      include: {
        unit: true,
        professional: true,
        patient: true,
      },
    });

    response.json({
      appointment: {
        ...updatedAppointment,
        professional: omit(updatedAppointment.professional, ['password']),
        patient: omit(updatedAppointment.patient, ['password']),
      },
    });
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível atualizar o horário do agendamento. Tente novamente mais tarde.',
    });
  }
});

router.patch(
  '/appointments/:id/status',
  async (request: Request, response: Response): Promise<void> => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      const updatedAppointment = await prisma.appointment.update({
        where: { id: Number(id) },
        data: { status },
        include: {
          unit: true,
          professional: true,
          patient: true,
        },
      });

      response.json({
        appointment: {
          ...updatedAppointment,
          professional: omit(updatedAppointment.professional, ['password']),
          patient: omit(updatedAppointment.patient, ['password']),
        },
      });
    } catch (error) {
      console.error(error);

      response.status(500).json({
        error: 'Não foi possível atualizar o status do agendamento. Tente novamente mais tarde.',
      });
    }
  },
);

router.delete('/appointments/:id', async (request: Request, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });
    if (!existingAppointment) {
      response.status(404).json({
        error:
          'Não encontramos um agendamento com o ID informado, verifique se o mesmo está correto.',
      });
      return;
    }

    await prisma.appointment.delete({
      where: { id: Number(id) },
    });

    response.status(204).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível excluir o agendamento. Tente novamente mais tarde.',
    });
  }
});

export default router;
