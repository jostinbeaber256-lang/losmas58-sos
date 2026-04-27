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
    <header className="los-section-head los-section-head-center pb-1">
      <p className="los-section-kicker text-accent">{eyebrow}</p>
      <div className="los-section-stack">
        <h1 className="los-section-title max-w-xl">{title}</h1>
        <p className="los-section-copy max-w-xl">{description}</p>
      </div>
    </header>
  );
}
