import express, { Request, Response } from 'express';
import supabase from '../configs/supabase.config';

const router = express.Router();

// GET /professionals - Lista todos os médicos
router.get('/professionals', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('usuario').select('*').eq('tipo', 'medico');

    if (error) {
      res.status(500).json({ mensagem: 'Erro ao buscar médicos', error });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// GET /professionals/:id - Retorna um médico específico
router.get('/professionals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('id', id)
      .eq('tipo', 'medico')
      .single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Médico não encontrado' });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// POST /professionals - Cria um novo médico
router.post('/professionals', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, documento, telefone, dataNascimento, especialidade, endereco_id } =
      req.body;

    const { data, error } = await supabase
      .from('usuario')
      .insert([
        {
          nome,
          email,
          senha,
          documento,
          telefone,
          dataNascimento,
          tipo: 'medico',
          especialidade,
          endereco_id,
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(400).json({ mensagem: 'Erro ao criar médico', error });
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// PUT /professionals/:id - Atualiza um médico existente
router.put('/professionals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, documento, telefone, dataNascimento, especialidade, endereco_id } =
      req.body;

    const { data, error } = await supabase
      .from('usuario')
      .update({
        nome,
        email,
        documento,
        telefone,
        dataNascimento,
        especialidade,
        endereco_id,
      })
      .eq('id', id)
      .eq('tipo', 'medico')
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ mensagem: 'Erro ao atualizar médico', error });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

// DELETE /professionals/:id - Exclui um médico
router.delete('/professionals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('usuario').delete().eq('id', id).eq('tipo', 'medico');

    if (error) {
      res.status(404).json({ mensagem: 'Erro ao excluir médico', error });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro interno no servidor', error });
  }
});

export default router;
