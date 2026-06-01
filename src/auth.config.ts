import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const ADMIN_ROUTES = ["/admin"];
const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const ADMIN_ROLES = ["RECEPTION", "IT_ADMIN", "DIRECTOR"];

/**
 * Configuração leve e "edge-safe" (sem Prisma) — usada pelo middleware.
 * A configuração completa (com o adapter do Prisma) fica em src/auth.ts.
 */
export const authConfig = {
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      const needsAuth = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));
      const needsAdmin = ADMIN_ROUTES.some((p) => pathname.startsWith(p));

      if (needsAdmin) {
        if (!isLoggedIn) return false;
        return ADMIN_ROLES.includes(role ?? "");
      }
      if (needsAuth) return isLoggedIn;
      return true;
    },
    // session roda também no middleware (edge) — injeta id/role a partir do token JWT.
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
