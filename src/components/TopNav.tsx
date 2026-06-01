import Link from "next/link";
import { auth } from "@/auth";
import { ADMIN_ROLES, roleLabel } from "@/lib/authz";
import { SignOutButton } from "@/components/AuthButtons";
import { AutodocLogo } from "@/components/Brand";

export async function TopNav() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  return (
    <header className="sticky top-0 z-30 border-b border-paper-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <AutodocLogo size={24} />
          <span className="hidden text-sm font-medium text-ink-mute sm:inline">· Salas</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link href="/dashboard" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-card hover:text-ink">
            Salas
          </Link>
          <Link
            href="/dashboard/bookings"
            className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-card hover:text-ink"
          >
            Minhas reservas
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 font-medium text-brand-dark hover:bg-brand-soft"
            >
              Painel Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{user.name ?? user.email}</div>
              <div className="text-xs text-ink-mute">{roleLabel(user.role)}</div>
            </div>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
