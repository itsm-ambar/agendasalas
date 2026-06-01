import { signIn, signOut } from "@/auth";

export function SignInButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
      }}
    >
      <button type="submit" className={className ?? "btn-primary"}>
        <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden>
          <rect width="10" height="10" x="1" y="1" fill="#f25022" />
          <rect width="10" height="10" x="12" y="1" fill="#7fba00" />
          <rect width="10" height="10" x="1" y="12" fill="#00a4ef" />
          <rect width="10" height="10" x="12" y="12" fill="#ffb900" />
        </svg>
        Entrar com Microsoft
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button type="submit" className="btn-ghost text-xs">
        Sair
      </button>
    </form>
  );
}
