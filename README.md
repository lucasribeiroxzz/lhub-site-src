# LHUB — Plataforma de Serviços Free Fire

Plataforma web completa para venda de diamantes, passes, likes, contas guest, bypass UID, cheat external, modapk Android e streamings para o jogo Free Fire. Construída com Next.js 15, TypeScript e banco de dados em JSON.

---

## Funcionalidades

- **Diamantes** — compra de pacotes de diamantes via contas Garena
- **Passes** — venda de passes de temporada
- **Likes** — sistema de entrega diária automática de likes
- **Conta Guest** — contas nível 15 com troca de nick
- **Bypass UID** — integração com API externa de bypass para emulador
- **Cheat External** — venda de chaves por plano (diário, semanal, quinzenal, mensal)
- **ModApk Android** — venda de chaves de ModApk por plano
- **Streamings** — chaves de streaming (HBO Max, Prime Video, Crunchyroll, Paramount+, Canva Pro, Disney+)
- **Carteira** — depósito via PIX com verificação automática (MisticPay)
- **Cupons** — sistema de desconto por código
- **Afiliados** — ganhe R$5 a cada 3 indicações que recarregarem
- **API Pública** — endpoints v1 para integração externa
- **Painel Admin** — gestão completa de usuários, estoque, pedidos, métricas e notificações
- **Discord OAuth2** — login/vinculação via Discord
- **Notificações** — sistema de notificações por usuário e em massa
- **Analytics** — rastreamento de visitas e compras por estado/cidade

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | JSON em arquivos (pasta `dbs/`) |
| ORM (opcional) | Prisma + PostgreSQL |
| E-mail | Brevo (Sendinblue) |
| Pagamentos | MisticPay (PIX) |
| Auth | JWT + sessão própria |
| Captcha | Google reCAPTCHA v2 |
| Deploy | Vercel / Shardcloud / Node |

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/lhub.git
cd lhub

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Inicie em desenvolvimento
npm run dev
```

---

## Variáveis de Ambiente

Copie `.env` e preencha todos os campos. As principais são:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL do banco PostgreSQL (se usar Prisma) |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `ADMIN_USER` / `ADMIN_PASS` | Credenciais do painel admin |
| `MISTIC_CLIENT_ID` / `SECRET` | API de pagamentos PIX |
| `BREVO_API_KEY` | API de envio de e-mail |
| `RESELLER_KEY` | Chave da API do jogo |
| `DISCORD_CLIENT_ID` / `SECRET` | OAuth2 do Discord |
| `DISCORD_WEBHOOK_URL` | Webhook de notificações admin |
| `LIKES_API_URL` / `KEY` | API externa de likes |
| `BYPASS_API_URL` / `SECRET` | API externa de bypass UID |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Chave pública do reCAPTCHA |
| `RECAPTCHA_SECRET_KEY` | Chave secreta do reCAPTCHA |

---

## Estrutura de Pastas

```
lhub/
├── app/
│   ├── api/            # Rotas de API (Next.js Route Handlers)
│   │   ├── admin/      # Endpoints administrativos
│   │   ├── auth/       # Autenticação e OAuth
│   │   ├── v1/         # API pública v1
│   │   └── ...         # Demais endpoints
│   ├── dashboard/      # Páginas do painel do usuário
│   └── ...             # Páginas públicas
├── components/         # Componentes React reutilizáveis
├── lib/                # Lógica de negócio, banco, utilitários
├── scripts/            # Scripts auxiliares (seed, migração, verificador)
├── prisma/             # Schema Prisma (opcional)
├── public/             # Arquivos estáticos
└── dbs/                # Banco de dados JSON (gerado em runtime)
```

---

## API Pública (v1)

Endpoints disponíveis com autenticação via API Key:

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/balance` | Saldo da conta |
| GET | `/api/v1/products` | Lista de produtos |
| GET | `/api/v1/prices` | Preços atuais |
| POST | `/api/v1/diamonds/send` | Enviar diamantes |
| GET | `/api/v1/diamonds/stock` | Estoque de diamantes |
| POST | `/api/v1/likes` | Comprar likes |
| POST | `/api/v1/passe` | Comprar passe |
| POST | `/api/v1/bypass` | Comprar bypass |
| GET | `/api/v1/cheat/stock` | Estoque de cheat |
| POST | `/api/v1/cheat` | Comprar cheat |
| GET | `/api/v1/modapk/stock` | Estoque de modapk |
| POST | `/api/v1/modapk` | Comprar modapk |

Documentação completa disponível em `/docs` na aplicação.

---

## Scripts

```bash
npm run dev       # Desenvolvimento
npm run build     # Build de produção
npm run start     # Iniciar produção

# Scripts auxiliares
npx ts-node scripts/seed-admin.ts      # Criar admin inicial
npx ts-node scripts/check-admin.ts     # Verificar admin
npx ts-node scripts/migrate.ts         # Migrar dados
npx ts-node scripts/limpar_contas.ts   # Limpar contas sem saldo
```

---

## Sistema de Banco de Dados

O projeto usa arquivos JSON na pasta `dbs/` como banco de dados principal (sem necessidade de servidor externo). Os arquivos são gerados automaticamente na primeira execução.

Para usar PostgreSQL com Prisma, configure `DATABASE_URL` e rode:

```bash
npx prisma migrate dev
```

---

## Licença

Projeto privado. Todos os direitos reservados.
