# Rodar localmente (ver layout e testar o fluxo)

Pré-requisito: **Node.js 18+** instalado (`node -v`).

## 1. Instalar dependências
```bash
npm install
```

## 2. Banco de dados (escolha UMA opção)

**Opção A — Supabase (nuvem, nada pra instalar):**
crie um projeto grátis em supabase.com, pegue as connection strings
(Project Settings → Database) e cole em `DATABASE_URL` / `DIRECT_URL`.

**Opção B — Postgres local com Docker (offline):**
```bash
docker run --name agenda-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```
e use as duas iguais:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

## 3. Configurar o ambiente
```bash
cp .env.example .env
npx auth secret        # gera e imprime um AUTH_SECRET (cole no .env)
```
No `.env`, garanta:
```
ENABLE_DEV_LOGIN="true"
ADMIN_EMAILS="voce@autodoc.com.br"   # use este e-mail no login pra virar Admin
```
(Pode deixar as variáveis da Microsoft em branco no teste local.)

## 4. Criar as tabelas e popular as salas
```bash
npx prisma db push     # cria as tabelas
npm run db:seed        # cria 4 salas (incl. Sala Diretoria c/ aprovação)
```

## 5. Subir o app
```bash
npm run dev
```
Abra **http://localhost:3000**

## 6. Entrar
- A home (index) aparece já com a marca Autodoc.
- Clique em **Entrar** → na tela de login use o bloco **"Login de desenvolvimento"**:
  digite o e-mail que está em `ADMIN_EMAILS` → você entra como **TI/Admin** e vê o **Painel Admin**.
- Para simular um colaborador comum, entre com outro e-mail qualquer.

### Testar o fluxo completo
1. Reserve a **Sala Atlântico** (confirma na hora) → veja em "Minhas reservas".
2. Reserve a **Sala Diretoria** → fica **Pendente**.
3. Vá em **Painel Admin → Aprovações** e aprove/recuse.
4. Tente reservar o mesmo horário de novo → o sistema bloqueia o conflito.

> Convites por e-mail: sem `RESEND_API_KEY` eles não são enviados de verdade —
> aparecem no log do terminal (`[email] ...`). É só pra você ver que o gatilho funciona.

## Dica: ver o banco
```bash
npx prisma studio      # abre uma UI do banco em http://localhost:5555
```
