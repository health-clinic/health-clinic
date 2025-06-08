import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/prescriptions', async (request: Request, response: Response): Promise<void> => {
  try {
    const { patient_id: patientId } = request.query;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        appointment: {
          ...(patientId ? { patientId: Number(patientId) } : {}),
        },
      },
      include: {
        appointment: {
          include: {
            patient: {
              include: {
                address: true,
              },
            },
            professional: {
              include: {
                address: true,
              },
            },
            unit: {
              include: {
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    response.json(
      prescriptions.map((prescription) => ({
        ...prescription,
        appointment: {
          ...prescription.appointment,
          professional: omit(prescription.appointment.professional, ['password']),
          patient: omit(prescription.appointment.patient, ['password']),
        },
      })),
    );
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível buscar as prescrições. Por favor, tente mais tarde.',
    });
  }
});

export default router;
