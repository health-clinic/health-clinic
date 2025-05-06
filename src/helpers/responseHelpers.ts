import { Response } from 'express';

export const enviarErro500 = (mensagem: string) => {
  return (res: Response) => {
    res.status(500).send({ mensagem });
  };
};
