import express, { Request, Response, Router } from 'express';

const router = express.Router();

const endpoints = `
    <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 18px;
    }
    table {
      font-size: 16px;
    }
    @media only screen and (max-width: 600px) {
      body {
        font-size: 16px;
      }
      table {
        font-size: 14px;
      }
    }
    @media only screen and (max-width: 400px) {
      body {
        font-size: 14px;
      }
      table {
        font-size: 12px;
      }
    }
  </style>
  <h1 style="text-align: center;">Backend do Postinho de Saúde</h1>
  <div style="margin: 20px;">
    <p>
      Software para agendamento de consulta no "Postinho de Saúde" do SUS,
      desenvolvido por estudantes do Curso de Análise e Desenvolvimento de Sistemas
      do Centro Universitário Uniftec.
    </p>
    <p>
      Este backend fornece uma API REST para gerenciamento de serviços de saúde,
      incluindo agendamento de consultas, gerenciamento de usuários e outras
      funcionalidades.
    </p>
    <h2 style="margin-top: 40px;">Endpoints Disponíveis</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <th style="border: 1px solid #ddd; padding: 10px;">Método</th>
        <th style="border: 1px solid #ddd; padding: 10px;">Endpoint</th>
        <th style="border: 1px solid #ddd; padding: 10px;">Descrição</th>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>POST</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/login</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Autenticação de usuário. Parâmetros: username, password. Retorno: token de autenticação ou erro de credenciais inválidas.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>GET</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/protected</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Acesso a área protegida. Parâmetros: token de autenticação no cabeçalho Authorization. Retorno: mensagem de boas-vindas ou erro de token inválido.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>GET</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/usuarios</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Lista de usuários. Parâmetros: nenhum. Retorno: lista de usuários ou erro de leitura da tabela.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>GET</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/usuario/:id</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Detalhes de um usuário. Parâmetros: id do usuário. Retorno: detalhes do usuário ou erro de leitura da tabela.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>POST</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/usuario</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Criação de um novo usuário. Parâmetros: nome, email. Retorno: usuário criado ou erro de inserção.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>PUT</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/usuario/:id</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Atualização de um usuário. Parâmetros: id do usuário, nome, email. Retorno: usuário atualizado ou erro de atualização.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>DELETE</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">/usuario/:id</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Exclusão de um usuário. Parâmetros: id do usuário. Retorno: mensagem de exclusão ou erro de exclusão.</td>
      </tr>
    </table>
  </div>
`;

router.get('/', (req: Request, res: Response) => {
  res.send(endpoints);
});

export default router;
