export function ScreenHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-3 pb-1">
      <p className="text-sm uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
      <div className="space-y-2">
        <h1 className="max-w-sm text-3xl font-semibold leading-tight text-ink">
          {title}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted">{description}</p>
      </div>
    </header>
  );
}
