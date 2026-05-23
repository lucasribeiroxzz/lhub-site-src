<div align="center">

# LHUB — Plataforma de E-commerce Digital

Marketplace full stack para venda de produtos digitais, com carteira própria, pagamentos via PIX, API pública versionada e painel administrativo completo. Construído com **Next.js 15** e **TypeScript**.

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)

</div>

---

## Sobre o projeto

LHUB é uma plataforma de e-commerce de produtos digitais que cobre o fluxo completo de uma loja online: catálogo de produtos, carteira com saldo, pagamento via PIX com confirmação automática, entrega de pedidos e gestão administrativa. O sistema também expõe uma API pública versionada para integração com revendedores e serviços externos.

O foco do projeto foi construir uma aplicação real de ponta a ponta — autenticação segura, integração com gateway de pagamento, OAuth de terceiros, controle de estoque e um painel de administração robusto.

---

## Principais funcionalidades

- **Carteira digital** — saldo por usuário com depósito via PIX e confirmação automática de pagamento
- **Catálogo e pedidos** — listagem de produtos, controle de estoque e processamento de pedidos
- **Cupons de desconto** — sistema de cupons por código
- **Programa de afiliados** — recompensas por indicação de novos usuários
- **Autenticação** — login próprio com JWT + sessão e login social via Discord OAuth2
- **API pública (v1)** — endpoints REST autenticados por API Key para integração externa
- **Painel administrativo** — gestão de usuários, estoque, pedidos, métricas e notificações
- **Notificações** — sistema individual e em massa
- **Analytics** — rastreamento de visitas e conversões por região
- **Proteção anti-bot** — Google reCAPTCHA v2

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| ORM / Banco | Prisma + PostgreSQL |
| Autenticação | JWT + sessão própria · Discord OAuth2 |
| Pagamentos | Integração PIX |
| E-mail | Brevo (transacional) |
| Proteção | Google reCAPTCHA v2 |
| Deploy | Vercel / Node |

---

## Arquitetura
lhub/
├── app/
│   ├── api/            # Route Handlers do Next.js
│   │   ├── admin/      # Endpoints administrativos
│   │   ├── auth/       # Autenticação e OAuth
│   │   └── v1/         # API pública versionada
│   ├── dashboard/      # Painel do usuário
│   └── ...             # Páginas públicas
├── components/         # Componentes React reutilizáveis
├── lib/                # Regras de negócio, acesso a dados, utilitários
├── prisma/             # Schema e migrações
├── scripts/            # Seed, migração e manutenção
└── public/             # Arquivos estáticos

---

## Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/lucasribeiroxzz/lhub-site-src
cd lhub-site-src

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Inicie em desenvolvimento
npm run dev
```

**Pré-requisitos:** Node.js 18+ e npm.

---

## Variáveis de ambiente

As principais variáveis necessárias (ver `.env.example` para a lista completa):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `ADMIN_USER` / `ADMIN_PASS` | Credenciais do painel admin |
| `DISCORD_CLIENT_ID` / `SECRET` | OAuth2 do Discord |
| `BREVO_API_KEY` | Envio de e-mails transacionais |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Chave pública do reCAPTCHA |
| `RECAPTCHA_SECRET_KEY` | Chave secreta do reCAPTCHA |

> As chaves de integração de pagamento e serviços externos também são configuradas no `.env`.

---

## API Pública (v1)

Endpoints REST autenticados via API Key (`Authorization: Bearer <api_key>`):

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/balance` | Consultar saldo da conta |
| GET | `/api/v1/products` | Listar produtos |
| GET | `/api/v1/prices` | Consultar preços atuais |
| POST | `/api/v1/orders` | Criar um pedido |
| GET | `/api/v1/orders/:id` | Consultar status do pedido |

Documentação completa disponível em `/docs` na aplicação.

---

## Scripts

```bash
npm run dev       # Ambiente de desenvolvimento
npm run build     # Build de produção
npm run start     # Iniciar em produção

# Manutenção
npx ts-node scripts/seed-admin.ts    # Criar admin inicial
npx ts-node scripts/migrate.ts       # Migrar dados
```

---

## Licença

Projeto privado. Todos os direitos reservados.
