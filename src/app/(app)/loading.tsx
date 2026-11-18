/** Esqueleto mostrado enquanto a próxima tela carrega. */
export default function Carregando() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-2/3 rounded-lg bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="h-12 rounded-xl bg-muted" />
      <div className="h-12 rounded-xl bg-muted" />
      <div className="h-12 rounded-xl bg-muted" />
    </div>
  );
}
