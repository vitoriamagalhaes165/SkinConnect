import { Flame, Target, CheckCircle2 } from 'lucide-react';
import { fileUrl } from '../api.js';
import { dataBR, TIPOS_FOTO } from '../formatos.js';
import Estatistica from './Estatistica.jsx';
import { LinhaAdesao } from './charts.jsx';

/** Números e gráfico de evolução (usado pelo paciente e na ficha da clínica) */
export function EvolucaoResumo({ evolucao }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Estatistica rotulo="Adesão (30 dias)" valor={`${evolucao.adesao_30}%`} icone={Target} />
        <Estatistica rotulo="Rotinas concluídas" valor={evolucao.concluidas} icone={CheckCircle2} />
        <Estatistica rotulo="Dias seguidos 100%" valor={evolucao.dias_seguidos} icone={Flame} />
      </div>
      <section className="card p-7">
        <h2 className="text-xl">Adesão diária</h2>
        <p className="mb-4 text-suave">Percentual de rotinas concluídas nos últimos 30 dias</p>
        <LinhaAdesao pontos={evolucao.dias} />
      </section>
    </>
  );
}

export function GaleriaFotos({ fotos }) {
  if (!fotos.length) return <p className="text-suave">Nenhuma foto enviada ainda.</p>;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {fotos.map((f) => (
        <li key={f.id} className="card overflow-hidden rounded-3xl">
          <img src={fileUrl(f.url)} alt={f.descricao || `Foto de ${dataBR(f.criado_em)}`} loading="lazy" className="aspect-square w-full object-cover" />
          <div className="p-3 text-sm">
            <p className="font-medium">{TIPOS_FOTO[f.tipo]} · {dataBR(f.criado_em)}</p>
            {f.descricao && <p className="text-suave">{f.descricao}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
