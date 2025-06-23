import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/patients', async (request: Request, response: Response): Promise<void> => {
  try {
    const patients = await prisma.user.findMany({
      where: {
        role: 'patient',
      },
      include: {
        address: true,
      },
    });

    response.json(patients.map((patient) => omit(patient, ['password'])));
  } catch (error) {
    console.error(error);

    response.status(500).json({
      error: 'Não foi possível buscar os pacientes. Por favor, tente mais tarde.',
    });
  }
});

export default router;
