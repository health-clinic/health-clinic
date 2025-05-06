import express, { Request, Response } from 'express';
import supabase from '../configs/supabase.config';

const router = express.Router();

// GET /appointments - Lista todos os agendamentos
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('agendamento').select('*');

    if (error) {
      res.status(500).json({ mensagem: 'Erro ao buscar agendamentos', error });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// GET /appointments/:id - Retorna um agendamento específico
router.get('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.from('agendamento').select('*').eq('id', id).single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Agendamento não encontrado' });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// POST /appointments - Cria um novo agendamento
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { clinica_id, medico_id, data, status } = req.body;

    const { data: createdData, error } = await supabase
      .from('agendamento')
      .insert([{ clinica_id, medico_id, data, status }])
      .select()
      .single();

    if (error) {
      res.status(400).json({ mensagem: 'Erro ao criar agendamento', error });
      return;
    }

    res.status(201).json(createdData);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// PUT /appointments/:id - Atualiza um agendamento existente
router.put('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clinica_id, medico_id, data, status } = req.body;

    const { data: updatedData, error } = await supabase
      .from('agendamento')
      .update({ clinica_id, medico_id, data, status })
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedData) {
      res.status(404).json({ mensagem: 'Erro ao atualizar agendamento', error });
      return;
    }

    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// PATCH /appointments/:id/status - Atualiza o status de um agendamento
router.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: updatedData, error } = await supabase
      .from('agendamento')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedData) {
      res.status(404).json({ mensagem: 'Erro ao atualizar status do agendamento', error });
      return;
    }

    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// DELETE /appointments/:id - Exclui um agendamento
router.delete('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('agendamento').delete().eq('id', id);

    if (error) {
      res.status(404).json({ mensagem: 'Erro ao excluir agendamento', error });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

export default router;
