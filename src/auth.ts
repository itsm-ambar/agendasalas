import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Login de desenvolvimento: entra só com e-mail, SEM senha.
// Liga com ENABLE_DEV_LOGIN=true. ATENÇÃO: em produção, só aceita e-mails
// que estão em ADMIN_EMAILS (allowlist) — desligue assim que o Azure estiver pronto.
const enableDevLogin = process.env.ENABLE_DEV_LOGIN === "true";

const devLogin = Credentials({
  id: "dev-login",
  name: "Dev (sem senha)",
  credentials: { email: { label: "E-mail" }, name: { label: "Nome" } },
  async authorize(creds) {
    const email = String(creds?.email ?? "").toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
    const isAdmin = adminEmails().includes(email);
    // Em produção, restringe o dev-login aos e-mails da allowlist (ADMIN_EMAILS).
    if (process.env.NODE_ENV === "production" && !isAdmin) return null;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: String(creds?.name || email.split("@")[0]),
        role: isAdmin ? "IT_ADMIN" : "USER",
      },
    });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, ...(enableDevLogin ? [devLogin] : [])],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // No primeiro login, "user" é o registro do banco (criado pelo adapter).
      if (user) {
        token.id = user.id as string;
        const email = (user.email ?? "").toLowerCase();
        const dbRole = (user as { role?: string }).role ?? "USER";
        token.role = adminEmails().includes(email) ? "IT_ADMIN" : dbRole;
      }
      // Guarda o access_token da Microsoft p/ chamar o Graph (busca de pessoas).
      if (account?.provider === "microsoft-entra-id" && account.access_token) {
        token.msAccessToken = account.access_token;
        token.msTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
      }
      return token;
    },
  },
  events: {
    // Garante que e-mails listados em ADMIN_EMAILS já nasçam como TI no banco.
    async createUser({ user }) {
      const email = (user.email ?? "").toLowerCase();
      if (email && adminEmails().includes(email)) {
        await prisma.user.update({ where: { id: user.id }, data: { role: "IT_ADMIN" } });
      }
    },
  },
});
