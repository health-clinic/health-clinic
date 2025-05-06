# 🏥 postinho-de-saude-backend

Software para agendamento de consultas no "Postinho de Saúde" do SUS.  
Projeto desenvolvido no **Curso Superior de Análise e Desenvolvimento de Sistemas** do **Centro Universitário Uniftec**.

> ⚠️ **Este README está em desenvolvimento e pode ser atualizado futuramente.**

## 👥 Equipe

- Daniel Moroni Ostoic Urbin
- Douglas Zakicheski
- Gabriel Vargas Oliveira
- Pedro Henrique Capssa
- Victoria Brombatti
- Vinicius Meert
- William Trevisan

**Orientadora:** Prof. Ms. Stéfani Valmini

---

## 📚 Sobre o Projeto

O **Postinho de Saúde** é um sistema de agendamento de consultas nas **Unidades Básicas de Saúde (UBS)**, facilitando o acesso da população aos serviços de saúde pública.

Este trabalho foi apresentado como parte da disciplina de **Engenharia de Software**, no Curso de Análise e Desenvolvimento de Sistemas, com o objetivo de automatizar os principais processos identificados em um estudo de caso sobre as UBS.

### ✨ Funcionalidades principais

- Solicitação e confirmação de agendamentos de consultas
- Acesso a orientações médicas e informações de cuidados de saúde
- Consulta às datas de futuras consultas com especialistas
- Integração entre app mobile (Android) e backend (REST API)

---

## 🛠️ Tecnologias Utilizadas

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (Valkey)
- Docker
- Amazon ECS (deploy)

---

## 🚀 Como executar o projeto em desenvolvimento

### Pré-requisitos

- Docker
- Docker Compose

### Rodando com Docker

1. Clone o repositório:

    ```bash
    git clone git@github.com:health-clinic/health-clinic.git postinho-de-saude-backend
    cd postinho-de-saude-backend
    ```

2. Crie o arquivo `.env` baseado no `.env.example`:

    ```bash
    cp .env.example .env
    ```

   Edite o arquivo `.env` com suas configurações locais.

3. Inicie o ambiente:

    ```bash
    docker compose up --build
    ```

O backend estará disponível em [http://localhost:3000](http://localhost:3000)

---

## 🌐 Endpoints principais

- `GET /health` → Health check
- `POST /api/v1/auth/register` → Criação de novo usuário
- `POST /api/v1/auth/login` → Login do usuário
- `POST /api/v1/auth/forgot-password` → Solicitação de redefinição de senha
- `POST /api/v1/auth/verify-code` → Verificação de código enviado por e-mail
- `POST /api/v1/auth/reset-password` → Redefinição de senha

---

## 📝 Resumo acadêmico

O projeto visa oferecer uma plataforma prática e intuitiva para agendamento de consultas médicas no SUS, usando tecnologias modernas para assegurar **eficiência**, **segurança** e **escalabilidade**.

O sistema foi idealizado para ser acessível via aplicativo mobile (Android) e garantir integração com o backend via API RESTful.

A proposta inclui também funcionalidades educacionais, como orientações de saúde e visualização de prescrições, fortalecendo o cuidado contínuo com a saúde da comunidade.

---

**Caxias do Sul - RS**  
Projeto iniciado em 2024 | Repositório criado em 2025
