import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { SignInButton } from "@/components/AuthButtons";
import { AutodocLogo, AmbarSignature } from "@/components/Brand";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const devEnabled = process.env.ENABLE_DEV_LOGIN === "true";
  const msConfigured = !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
  const isProd = process.env.NODE_ENV === "production";

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md animate-rise">
        <div className="card overflow-hidden">
          <div className="bg-brand px-7 py-8 text-white">
            <AutodocLogo variant="white" size={26} />
            <p className="mt-5 font-display text-xl font-bold leading-snug">Reserva de Salas</p>
            <p className="mt-1.5 text-sm text-white/85">
              Agende as salas de reunião da Autodoc em segundos. Entre com seu e-mail corporativo.
            </p>
          </div>
          <div className="px-7 py-8">
            {msConfigured ? (
              <>
                <SignInButton className="btn-primary w-full" />
                <p className="mt-4 text-center text-xs text-ink-mute">
                  Acesso restrito aos Autodockers (Microsoft 365).
                </p>
              </>
            ) : (
              <p className="rounded-xl border border-paper-line bg-paper px-3.5 py-3 text-center text-xs text-ink-mute">
                Login Microsoft ainda não configurado.
              </p>
            )}

            {devEnabled && (
              <div className="mt-6 border-t border-paper-line pt-5">
                <p className="label">Login de desenvolvimento</p>
                <form
                  action={async (formData) => {
                    "use server";
                    await signIn("dev-login", {
                      email: String(formData.get("email") ?? ""),
                      name: String(formData.get("name") ?? ""),
                      redirectTo: "/dashboard",
                    });
                  }}
                  className="space-y-2"
                >
                  <input name="email" type="email" required placeholder="voce@autodoc.com.br" className="field" />
                  <input name="name" type="text" placeholder="Seu nome (opcional)" className="field" />
                  <button type="submit" className="btn-dark w-full">
                    Entrar sem senha
                  </button>
                </form>
                <p className="mt-2 text-xs text-ink-mute">
                  {isProd
                    ? "Modo de teste: só e-mails do ADMIN_EMAILS entram. Desligue com ENABLE_DEV_LOGIN=false depois de configurar o Azure."
                    : "Só local. Use um e-mail do ADMIN_EMAILS para entrar como TI/Admin."}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between px-1">
          <span className="text-xs text-ink-mute">Salas com aprovação · convites no calendário</span>
          <AmbarSignature />
        </div>
      </div>
    </main>
  );
}
