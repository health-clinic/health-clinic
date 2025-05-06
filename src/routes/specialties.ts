import express, { Request, Response } from 'express';
import supabase from '../configs/supabase.config';

const router = express.Router();

// GET /specialties - Lista todas as especialidades
router.get('/specialties', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('especialidade')
      .eq('tipo', 'medico');

    if (error) {
      res.status(500).json({ mensagem: 'Erro ao buscar especialidades', error });
      return;
    }

    // Filtrar especialidades únicas
    const specialties = [...new Set(data.map((item) => item.especialidade))];

    res.json(specialties);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// POST /specialties - Cria uma nova especialidade
router.post('/specialties', async (req: Request, res: Response) => {
  try {
    const { especialidade, medico_id } = req.body;

    const { data, error } = await supabase
      .from('usuario')
      .update({ especialidade })
      .eq('id', medico_id)
      .eq('tipo', 'medico')
      .select()
      .single();

    if (error) {
      res.status(400).json({ mensagem: 'Erro ao criar especialidade', error });
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// PUT /specialties/:id - Atualiza uma especialidade existente
router.put('/specialties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { especialidade } = req.body;

    const { data, error } = await supabase
      .from('usuario')
      .update({ especialidade })
      .eq('id', id)
      .eq('tipo', 'medico')
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Erro ao atualizar especialidade', error });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// DELETE /specialties/:id - Exclui uma especialidade
router.delete('/specialties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('usuario')
      .update({ especialidade: null })
      .eq('id', id)
      .eq('tipo', 'medico')
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Erro ao excluir especialidade', error });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

export default router;
