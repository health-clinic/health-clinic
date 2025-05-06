import { TDataErro } from '../models/types';

export const tratarResposta = (
  DataErro: TDataErro,
  isGet: boolean = false,
  isDelete: boolean = false,
) => {
  if (DataErro?.error) {
    return { status: 500, mensagem: 'Erro ao processar a requisição' };
  }
  if (DataErro?.data === null) {
    return { status: isDelete ? 200 : 201, mensagem: 'Operação realizada com sucesso' };
  }
  return { status: isGet ? 200 : 201, dados: DataErro?.data };
};
