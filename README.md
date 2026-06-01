# AgendaSalas 🗓️

Sistema de **reserva de salas de reunião** para a empresa. Login com e-mail corporativo (Microsoft 365), reserva instantânea quando a sala está livre, **aprovação da diretoria** para salas restritas, **convites de calendário (.ics)** automáticos por e-mail e um **painel administrativo** para TI e recepção.

**Stack:** Next.js (App Router) + TypeScript · Auth.js (Microsoft Entra ID) · Prisma + Supabase (Postgres) · Resend (e-mail) · deploy na Vercel.

---

## ✨ O que já vem pronto

- **Login SSO** com a conta Microsoft 365 da empresa (Entra ID / Azure AD).
- **Reserva com checagem de conflito** — não deixa duas reuniões na mesma sala no mesmo horário.
- **Fluxo de aprovação**: salas marcadas como "requer aprovação" (ex.: Sala Diretoria) ficam *pendentes* até a diretoria/TI aprovar. As demais confirmam na hora.
- **Convite automático**: ao confirmar, organizador e participantes recebem um e-mail com anexo `.ics` (cai no Outlook/Google como convite com Aceitar/Recusar).
- **Painel Admin** (TI / Recepção): visão geral da agenda de todas as salas, aprovações, gestão de salas e papéis de usuário.
- **Papéis**: Colaborador · Recepção · Diretoria (aprova) · TI/Admin (administra tudo).

---

## 🚀 Deploy do zero (≈ 30 min)

### 1) Banco de dados — Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **Project Settings → Database → Connection string**.
3. Copie **duas** strings:
   - **Transaction pooler** (porta `6543`) → vira a `DATABASE_URL` (adicione `?pgbouncer=true&connection_limit=1` ao final).
   - **Direct connection** (porta `5432`) → vira a `DIRECT_URL`.

> Por que duas? A Vercel é serverless: o app usa o *pooler* (6543); as migrations precisam da conexão *direta* (5432).

### 2) Login — Microsoft Entra ID (Azure AD)

No [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID → App registrations → New registration**:

- **Supported account types:** *Accounts in this organizational directory only* (restringe à sua empresa).
- **Redirect URI** (Web):
  - `https://SEU-DOMINIO/api/auth/callback/microsoft-entra-id`
  - e para dev: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
- Em **Certificates & secrets → New client secret**, copie o **Value** (não o Secret ID).
- Anote: **Application (client) ID**, **Directory (tenant) ID** e o **secret**.

Preencha:
```
AUTH_MICROSOFT_ENTRA_ID_ID      = Application (client) ID
AUTH_MICROSOFT_ENTRA_ID_SECRET  = secret Value
AUTH_MICROSOFT_ENTRA_ID_ISSUER  = https://login.microsoftonline.com/<TENANT-ID>/v2.0
```

### 3) Convites por e-mail — Resend (opcional, mas recomendado)

1. Crie conta em [resend.com](https://resend.com), verifique o domínio da empresa.
2. Gere uma API key → `RESEND_API_KEY`.
3. Ajuste `EMAIL_FROM` para um remetente do seu domínio verificado.

> Sem `RESEND_API_KEY` o sistema **funciona** normalmente, mas os convites não são enviados (ficam só registrados no log). Bom para testar.

### 4) GitHub

```bash
git init
git add .
git commit -m "AgendaSalas"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/agendasalas.git
git push -u origin main
```

### 5) Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório do GitHub.
2. Framework: **Next.js** (detectado automaticamente).
3. Em **Environment Variables**, cole todas as variáveis do `.env.example` já preenchidas
   (gere o `AUTH_SECRET` com `npx auth secret`).
4. **Deploy.** O build roda `prisma generate && next build` automaticamente.

### 6) Criar as tabelas no banco

Com a `DATABASE_URL`/`DIRECT_URL` no seu `.env` local:
```bash
npm install
npx prisma db push     # cria as tabelas no Supabase
npm run db:seed        # popula 4 salas de exemplo (incl. Sala Diretoria c/ aprovação)
```
(Alternativa: rode esses comandos uma vez na sua máquina apontando para o Supabase de produção.)

### 7) Domínio próprio

Na Vercel → **Project → Settings → Domains** → adicione seu domínio e aponte o DNS conforme as instruções (CNAME/A record). Depois **atualize a Redirect URI no Azure** para o domínio final.

### 8) Primeiro acesso de admin

Coloque seu e-mail (e o da recepção) em `ADMIN_EMAILS`. No primeiro login eles já entram como **TI/Admin** e podem promover os demais em **Painel Admin → Usuários**.

---

## 🧪 Rodando localmente

```bash
cp .env.example .env      # preencha as variáveis
npm install
npx prisma db push
npm run db:seed
npm run dev               # http://localhost:3000
```

---

## 🔮 Fase 2 — Integração nativa com Teams

Hoje os convites vão como `.ics` (universal, funciona em qualquer calendário). O caminho de Teams "de verdade" reaproveita **o mesmo login Entra ID** e usa o **Microsoft Graph**:

- Trocar o envio de `.ics` por `POST /me/events` (ou `/me/calendar/events`) criando o evento **com link do Teams** (`isOnlineMeeting: true`).
- Reservar a sala como **recurso (room resource)** do Exchange/Outlook em vez de só registrar no nosso banco.
- Para isso, adicionar os escopos `Calendars.ReadWrite` e `OnlineMeetings.ReadWrite` no app do Azure e usar o `access_token` que o Auth.js já guarda na tabela `Account`.

O ponto de troca é único e isolado: a função `sendInvite` em [`src/lib/email.ts`](src/lib/email.ts). É só plugar uma `createGraphEvent` no lugar (ou ao lado) dela.

---

## 🗂️ Estrutura

```
prisma/schema.prisma     Modelo: User, Room, Booking, Attendee (+ tabelas Auth.js)
prisma/seed.ts           Salas de exemplo
src/auth.ts              Auth.js (Entra ID + Prisma adapter + papéis)
src/middleware.ts        Protege /dashboard e /admin por papel
src/lib/bookings.ts      Regras: conflito, criação, aprovar/recusar, cancelar
src/lib/email.ts         Geração do .ics + envio (Resend)  ← ponto da Fase 2
src/app/dashboard/*      Área do colaborador (salas, reserva, minhas reservas)
src/app/admin/*          Painel TI/Recepção (visão geral, aprovações, salas, usuários)
```

---

## ⚙️ Notas

- A regra de "sala com aprovação" é por sala: marque `requiresApproval` em **Admin → Salas** (a *Sala Diretoria* do seed já vem assim).
- Conflitos consideram reservas **confirmadas e pendentes** como ocupando o horário; a aprovação revalida o conflito no momento de aprovar.
- Mudança de papel de um usuário passa a valer no acesso **após ele logar de novo** (o papel fica no token de sessão).
- Fuso configurável em `APP_TIMEZONE` (padrão `America/Sao_Paulo`).
