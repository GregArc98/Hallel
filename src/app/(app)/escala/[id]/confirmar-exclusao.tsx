"use client";

import type { ReactNode } from "react";

export function ConfirmarExclusaoCulto({
  action,
  id,
  descricao,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className="border-t pt-5"
      onSubmit={(e) => {
        if (!confirm(`Excluir o culto de ${descricao}?\n\nA escala e o repertório dele também serão apagados. Não dá para desfazer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {children}
    </form>
  );
}
