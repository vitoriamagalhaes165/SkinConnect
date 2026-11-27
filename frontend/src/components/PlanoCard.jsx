import { Calendar, Target } from 'lucide-react';
import { dataBR, PERIODOS } from '../formatos.js';

export default function PlanoCard({ plano }) {
  return (
    <article className="card overflow-hidden">
      <div className="space-y-2 p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">{plano.titulo}</h2>
          <span className={`rounded-full px-3 py-0.5 text-sm font-medium ${plano.ativo ? 'bg-verde-claro text-verde-escuro' : 'bg-linha text-suave'}`}>
            {plano.ativo ? 'Ativo' : 'Encerrado'}
          </span>
        </div>
        {plano.objetivo && <p className="flex items-center gap-2 text-suave"><Target size={18} aria-hidden="true" />{plano.objetivo}</p>}
        <p className="flex items-center gap-2 text-suave">
          <Calendar size={18} aria-hidden="true" />
          {dataBR(plano.data_inicio)}{plano.data_fim ? ` até ${dataBR(plano.data_fim)}` : ' · sem data de término'}
        </p>
      </div>
      <div className="border-t border-linha p-7">
        {plano.descricao && <p className="mb-5 text-suave">{plano.descricao}</p>}
        <ul className="divide-y divide-linha">
          {plano.rotinas.map((r) => (
            <li key={r.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="grid h-[52px] w-[70px] shrink-0 place-items-center rounded-2xl bg-verde-claro font-semibold tabular-nums">{r.horario}</span>
              <div className="min-w-0">
                <p className="font-medium">{r.titulo}</p>
                <p className="text-sm text-suave">{PERIODOS[r.periodo]}{r.produto ? ` · ${r.produto}` : ''}</p>
                {r.instrucoes && <p className="mt-1 text-suave">{r.instrucoes}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
