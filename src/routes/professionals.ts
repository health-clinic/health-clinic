import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

router.get('/professionals', async (request: Request, response: Response): Promise<void> => {
  try {
    const { specialty } = request.query;

    const professionals = await prisma.user.findMany({
      where: {
        role: 'professional',
        ...(specialty ? { specialty: specialty as string } : {}),
      },
    });

    response.json(professionals.map((professional) => omit(professional, ['password'])));
  } catch (error) {
    console.error(error);
    response.status(500).json({
      error: 'Não foi possível buscar os profissionais. Por favor, tente mais tarde.',
    });
  }
});

export default router;
