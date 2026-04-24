export function AppBadge() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-lg font-black text-accent">
        +58
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-muted">Los+58</p>
        <p className="text-xs text-muted/80">Seguridad y ruta</p>
      </div>
    </div>
  );
}
