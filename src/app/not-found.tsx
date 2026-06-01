import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="font-display text-6xl font-bold text-brand">404</p>
        <p className="mt-2 text-ink-soft">Sala ou página não encontrada.</p>
        <Link href="/dashboard" className="btn-primary mt-5">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
