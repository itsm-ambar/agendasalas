"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/app/admin/actions";

const ROLES = [
  { value: "USER", label: "Colaborador" },
  { value: "RECEPTION", label: "Recepção" },
  { value: "DIRECTOR", label: "Diretoria" },
  { value: "IT_ADMIN", label: "TI / Admin" },
];

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(role);

  function onChange(next: string) {
    setValue(next);
    startTransition(async () => {
      const res = await setUserRoleAction(userId, next);
      if (!res.ok) {
        alert(res.error ?? "Erro ao alterar papel.");
        setValue(role);
      } else router.refresh();
    });
  }

  return (
    <select
      className="field max-w-[180px] py-1.5 text-sm disabled:opacity-60"
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
