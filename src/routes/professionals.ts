import express, { Request, Response } from 'express';
import { omit } from 'lodash';
import { prisma } from '../prisma/client';

const router = express.Router();

// Listar profissionais, opcionalmente filtrando por especialidade
router.get('/professionals', async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialty } = req.query;

    const professionals = await prisma.user.findMany({
      where: {
        role: 'professional',
        ...(specialty ? { specialty: specialty as string } : {}),
      },
    });

    res.json(professionals.map((p) => omit(p, ['password'])));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível buscar os profissionais. Por favor, tente mais tarde.' });
  }
});

// Buscar profissional pelo ID
router.get('/professionals/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const professional = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!professional || professional.role !== 'professional') {
      res.status(404).json({ error: 'Profissional não encontrado.' });
      return;
    }

    res.json(omit(professional, ['password']));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar o profissional.' });
  }
});

// Criar um novo profissional
router.post('/professionals', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, specialty, password, ...rest } = req.body;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    // Criar o profissional
    const professional = await prisma.user.create({
      data: {
        name,
        email,
        specialty,
        password, // você pode querer hashear a senha antes aqui, se não estiver fazendo isso em outro lugar
        role: 'professional',
        ...rest,
      },
    });

    res.status(201).json(omit(professional, ['password']));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Não foi possível criar o profissional.' });
  }
});

// Atualizar profissional
router.put('/professionals/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Evitar atualizar a role por aqui, para não quebrar regras
    if ('role' in data) delete data.role;
    if ('password' in data) delete data.password; // atualize senha em rota específica

    const updatedProfessional = await prisma.user.update({
      where: { id: Number(id) },
      data,
    });

    res.json(omit(updatedProfessional, ['password']));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Não foi possível atualizar o profissional.' });
  }
});

// Deletar profissional
router.delete('/professionals/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Não foi possível deletar o profissional.' });
  }
});

export default router;
