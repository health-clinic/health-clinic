import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { subDays, format, parse } from 'date-fns';
import { prisma } from '../prisma/client';

const router = express.Router();

const formatTimeToString = (date: Date): string => {
  return format(date, 'HH:mm');
};

router.get('/professionals', async (request: Request, response: Response): Promise<void> => {
  try {
    const { specialty } = request.query;

    const professionals = await prisma.user.findMany({
      where: {
        role: 'professional',
        ...(specialty ? { specialty: specialty as string } : {}),
      },
      include: {
        schedules: {
          include: {
            unit: {
              include: {
                address: true,
                schedules: true,
              },
            },
          },
        },
      },
    });

    response.json(
      professionals.map((professional) => ({
        ...omit(professional, ['password']),
        schedules: professional.schedules?.map((schedule) => ({
          ...schedule,
          start: formatTimeToString(schedule.start),
          end: formatTimeToString(schedule.end),
          unit: {
            ...schedule.unit,
            schedules: schedule.unit?.schedules?.map((unitSchedule) => ({
              ...unitSchedule,
              opening: formatTimeToString(unitSchedule.opening),
              closing: formatTimeToString(unitSchedule.closing),
            })),
          },
        })),
      })),
    );
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível buscar os profissionais. Por favor, tente mais tarde.',
    });
  }
});

router.get(
  '/professionals/:id/recent-patients',
  async (request: Request, response: Response): Promise<void> => {
    try {
      const { id } = request.params;
      const { days_ago: daysAgo = '15' } = request.query;

      const professional = await prisma.user.findUnique({
        where: {
          id: Number(id),
          role: 'professional',
        },
      });

      if (!professional) {
        response.status(404).json({
          error:
            'Não encontramos um profissional com o ID informado, verifique se o mesmo está correto.',
        });
        return;
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'completed',
          professionalId: Number(id),
          scheduledFor: {
            gte: subDays(new Date(), Number(daysAgo)),
          },
        },
        include: {
          patient: {
            include: {
              address: true,
            },
          },
        },
        orderBy: {
          scheduledFor: 'desc',
        },
        distinct: ['patientId'],
      });

      response.json(
        appointments.map((appointment) => ({
          ...omit(appointment.patient, ['password']),
          lastVisit: appointment.scheduledFor,
        })),
      );
    } catch (error) {
      console.error(error);

      response.status(500).json({
        error: 'Não foi possível buscar os pacientes recentes. Por favor, tente mais tarde.',
      });
    }
  },
);

export default router;
