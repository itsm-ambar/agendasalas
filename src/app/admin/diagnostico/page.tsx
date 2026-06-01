import { requireAdmin } from "@/lib/authz";
import { graphStatus } from "@/lib/graph-mail";
import { TestEmailButton } from "@/components/TestEmailButton";

export const dynamic = "force-dynamic";

function Row({ label, ok, value }: { label: string; ok: boolean; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2">
        {value && <span className="font-mono text-xs text-ink-mute">{value}</span>}
        <span className={`badge ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {ok ? "OK" : "Faltando"}
        </span>
      </span>
    </div>
  );
}

export default async function DiagnosticoPage() {
  const admin = await requireAdmin();
  const s = graphStatus();
  const msLogin = !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Diagnóstico</h1>
        <p className="mt-1 text-ink-soft">Verifica a configuração de login e envio de e-mails.</p>
      </div>

      <section>
        <p className="label">Configuração detectada</p>
        <div className="card divide-y divide-paper-line">
          <Row label="Login Microsoft (client ID)" ok={msLogin} />
          <Row label="Graph · Tenant" ok={s.tenant} />
          <Row label="Graph · Client ID" ok={s.clientId} />
          <Row label="Graph · Client Secret" ok={s.clientSecret} />
          <Row label="Graph · Caixa remetente (MAIL_FROM)" ok={!!s.mailFrom} value={s.mailFrom} />
        </div>
        <p className="mt-2 text-xs text-ink-mute">
          Tudo OK aqui significa que as variáveis existem. O envio só funciona de fato se a permissão de
          aplicativo <b>Mail.Send</b> estiver concedida no Azure (o teste abaixo confirma isso).
        </p>
      </section>

      <section>
        <p className="label">Teste de envio</p>
        <div className="card p-5">
          <p className="mb-3 text-sm text-ink-soft">
            Envia um e-mail de teste para <b>{admin.email}</b>. Se falhar, a mensagem de erro do Graph aparece aqui
            (ex.: <span className="font-mono text-xs">Forbidden</span> = falta a permissão Mail.Send).
          </p>
          <TestEmailButton />
        </div>
      </section>
    </div>
  );
}
