import express, { Request, Response } from 'express';
import supabase from '../configs/supabase.config';

const router = express.Router();

// GET /units - Lista todas as clínicas
router.get('/units', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('clinica').select('*');

    if (error) {
      res.status(500).json({ mensagem: 'Erro ao buscar clínicas', error });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// GET /units/:id - Retorna uma clínica específica
router.get('/units/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.from('clinica').select('*').eq('id', id).single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Clínica não encontrada' });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// POST /units - Cria uma nova clínica
router.post('/units', async (req: Request, res: Response) => {
  try {
    const { nome, endereco_id, distancia } = req.body;

    const { data, error } = await supabase
      .from('clinica')
      .insert([{ nome, endereco_id, distancia }])
      .select()
      .single();

    if (error) {
      res.status(400).json({ mensagem: 'Erro ao criar clínica', error });
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// PUT /units/:id - Atualiza uma clínica existente
router.put('/units/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, endereco_id, distancia } = req.body;

    const { data, error } = await supabase
      .from('clinica')
      .update({ nome, endereco_id, distancia })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Erro ao atualizar clínica', error });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// DELETE /units/:id - Exclui uma clínica
router.delete('/units/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('clinica').delete().eq('id', id);

    if (error) {
      res.status(404).json({ mensagem: 'Erro ao excluir clínica', error });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

export default router;
