export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/auth";
import { AutodocLogo, AutodocMark, AmbarSignature } from "@/components/Brand";

export default async function Home() {
  const session = await auth();
  const logged = !!session?.user;

  const features = [
    {
      title: "Reserve em segundos",
      desc: "Escolha a sala, o horário e os participantes. Se estiver livre, está reservado.",
    },
    {
      title: "Aprovação quando precisa",
      desc: "Salas restritas, como a da diretoria, passam por aprovação antes de confirmar.",
    },
    {
      title: "Convite no calendário",
      desc: "Quem participa recebe o convite por e-mail e adiciona a reunião com um clique.",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Topo */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <AutodocLogo size={26} />
        <Link href={logged ? "/dashboard" : "/login"} className="btn-dark text-sm">
          {logged ? "Ir para minhas salas" : "Entrar"}
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-rise">
              <span className="badge border-brand/20 bg-brand-soft text-brand-dark">
                Ferramenta interna · Autodoc
              </span>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl">
                Salas de reunião,<br />
                <span className="text-brand">sem bagunça de agenda.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-ink-soft">
                Um único lugar para reservar as salas da Autodoc, evitar choques de horário e manter todo
                mundo no mesmo calendário.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={logged ? "/dashboard" : "/login"} className="btn-primary px-6 py-3 text-base">
                  {logged ? "Ver as salas" : "Entrar com Microsoft"}
                </Link>
                <span className="text-sm text-ink-mute">Login com seu e-mail corporativo</span>
              </div>
            </div>

            {/* Cartão decorativo da marca */}
            <div className="relative animate-rise [animation-delay:120ms]">
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between bg-ink px-6 py-5 text-white">
                  <AutodocLogo variant="white" size={22} />
                  <span className="text-xs text-white/70">Hoje</span>
                </div>
                <div className="space-y-3 p-6">
                  {[
                    { t: "Alinhamento de projeto", r: "Sala Atlântico", h: "09:00–10:00", s: "Confirmada", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                    { t: "Reunião de diretoria", r: "Sala Diretoria", h: "11:00–12:00", s: "Pendente", cls: "border-amber-200 bg-amber-50 text-amber-700" },
                    { t: "Daily do time", r: "Sala Pacífico", h: "14:30–15:00", s: "Confirmada", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                  ].map((b) => (
                    <div key={b.t} className="flex items-center gap-3 rounded-xl border border-paper-line bg-paper-card p-3">
                      <span className="h-9 w-1 rounded-full bg-brand" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b.t}</p>
                        <p className="truncate text-xs text-ink-mute">{b.r} · {b.h}</p>
                      </div>
                      <span className={`badge ${b.cls}`}>{b.s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute -right-6 -top-6 -z-10 opacity-10">
                <AutodocMark size={160} className="text-brand" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-paper-line bg-paper-card/60">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title} className="card p-6 animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <AutodocMark size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-ink-mute">
        <span>© {new Date().getFullYear()} Autodoc · Reserva de Salas</span>
        <AmbarSignature />
      </footer>
    </main>
  );
}
