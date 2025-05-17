import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../configs/supabase.config';
import { tratarResposta } from '../handlers/tratarResposta';
import { Usuario } from '../models/usuario';
import { TDataErro } from '../models/types';
import { enviarErro500 } from '../helpers/responseHelpers';
import { enviarEmail } from '../helpers/MailtrapMailProvider';

const router = express.Router();

// GET lista de usuarios
router.get('/usuarios', async (req: Request, res: Response) => {
  try {
    let DataErro: TDataErro;

    DataErro = await supabase.from('usuario').select('*');

    const resp = tratarResposta(DataErro, true, false);
    if (resp.mensagem) {
      res.status(resp.status).send({ mensagem: resp.mensagem });
    } else {
      res.status(resp.status).json(resp.dados);
    }
  } catch (error) {
    enviarErro500("Erro ao ler a tabela 'usuario'")(res);
  }
});

// GET usuario
router.get('/usuario/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    let DataErro: TDataErro;

    DataErro = await supabase.from('usuario').select('*').eq('id', id);

    const resp = tratarResposta(DataErro, true, false);
    if (resp.mensagem) {
      res.status(resp.status).send({ mensagem: resp.mensagem });
    } else {
      res.status(resp.status).json(resp.dados);
    }
  } catch (error) {
    enviarErro500("Erro ao ler a tabela 'usuario'")(res);
  }
});

// POST usuario
router.post('/usuario', async (req: Request, res: Response) => {
  try {
    const usu: Usuario = req.body as Usuario;
    usu.senha = await bcrypt.hash(usu.senha, 10);
    let DataErro: TDataErro;

    DataErro = await supabase.from('usuario').insert([usu]);

    const resp = tratarResposta(DataErro, false, false);
    if (resp.mensagem) {
      res.status(resp.status).send({ mensagem: resp.mensagem });
    } else {
      res.status(resp.status).json(resp.dados);
    }
  } catch (error) {
    enviarErro500('Erro ao inserir o usuário')(res);
  }
});

// PUT /usuario/:id
router.put('/usuario/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, email, senha, documento, telefone, dataNascimento, endereco_id } = req.body;
    let senhaCriptografada;
    if (senha) {
      senhaCriptografada = await bcrypt.hash(senha, 10);
    }
    let DataErro: TDataErro;

    DataErro = await supabase
      .from('usuario')
      .update({
        nome,
        email,
        senha: senhaCriptografada || undefined,
        documento,
        telefone,
        dataNascimento,
        endereco_id,
      })
      .eq('id', id);

    const resp = tratarResposta(DataErro, false, false);
    if (resp.mensagem) {
      res.status(resp.status).send({ mensagem: resp.mensagem });
    } else {
      res.status(resp.status).json(resp.dados);
    }
  } catch (error) {
    enviarErro500('Erro ao atualizar o usuário')(res);
  }
});

// DELETE /usuario/:id
router.delete('/usuario/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    let DataErro: TDataErro;

    DataErro = await supabase.from('usuario').delete().eq('id', id);

    const resp = tratarResposta(DataErro, false, true);
    if (resp.mensagem) {
      res.status(resp.status).send({ mensagem: resp.mensagem });
    } else {
      res.status(resp.status).json(resp.dados);
    }
  } catch (error) {
    enviarErro500('Erro ao excluir o usuário')(res);
  }
});

export default router;
