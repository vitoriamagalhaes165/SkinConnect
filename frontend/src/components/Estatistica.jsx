export default function Estatistica({ rotulo, valor, icone: Icone }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium uppercase tracking-wide text-suave">
        <span>{rotulo}</span>
        <Icone size={20} className="shrink-0 text-verde" aria-hidden="true" />
      </div>
      <p className="mt-2 font-display text-4xl">{valor}</p>
    </div>
  );
}
