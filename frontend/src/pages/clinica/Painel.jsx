import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, CalendarCheck, ClipboardList, TrendingUp, Users } from 'lucide-react';
import { api } from '../../api.js';
import { dataExtenso, diaMes } from '../../formatos.js';
import Estatistica from '../../components/Estatistica.jsx';
import { AdesaoPorPaciente, LinhaAdesao } from '../../components/charts.jsx';

export default function Painel() {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => { api.get('/clinica/dashboard').then(setD).catch((e) => setErro(e.message)); }, []);

  if (erro) return <p role="alert" className="erro">{erro}</p>;
  if (!d) return <p className="text-suave">Carregando…</p>;
  const { totais } = d;
  const temDados = d.por_paciente.some((p) => p.esperado > 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">{dataExtenso()}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{d.clinica.nome}</h1>
        <p className="mt-2 text-lg text-suave">Acompanhe a adesão dos seus pacientes aos planos de cuidado.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estatistica rotulo="Pacientes" valor={totais.pacientes} icone={Users} />
        <Estatistica rotulo="Planos ativos" valor={totais.planos_ativos} icone={ClipboardList} />
        <Estatistica rotulo="Adesão média (7 dias)" valor={`${totais.adesao_media_7d}%`} icone={Activity} />
        <Estatistica rotulo="Rotinas concluídas hoje" valor={`${totais.concluidas_hoje}/${totais.esperadas_hoje}`} icone={CalendarCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-7">
          <h2 className="flex items-center gap-2 text-xl"><TrendingUp size={20} className="text-verde" aria-hidden="true" />Adesão por paciente</h2>
          <p className="mb-4 text-suave">Últimos 7 dias</p>
          {temDados ? <AdesaoPorPaciente pacientes={d.por_paciente.filter((p) => p.esperado > 0)} />
            : <p className="py-10 text-suave">Os gráficos aparecem assim que um paciente tiver um plano ativo.</p>}
        </section>
        <section className="card p-7">
          <h2 className="text-xl">Evolução da clínica</h2>
          <p className="mb-4 text-suave">Adesão média diária nos últimos 14 dias</p>
          {temDados ? <LinhaAdesao pontos={d.evolucao} altura={Math.max(220, d.por_paciente.length * 44 + 60)} />
            : <p className="py-10 text-suave">Sem dados ainda.</p>}
        </section>
      </div>

      <section className="card p-7">
        <h2 className="flex items-center gap-2 text-xl"><AlertTriangle size={20} aria-hidden="true" />Precisam de atenção</h2>
        {d.atencao.length === 0 ? (
          <p className="mt-3 text-suave">Nenhum paciente com adesão abaixo de 50% nos últimos 7 dias.</p>
        ) : (
          <ul className="mt-4 divide-y divide-linha">
            {d.atencao.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-alerta-claro text-sm font-semibold text-alerta">{p.adesao}%</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.nome}</p>
                  <p className="text-sm text-suave">{p.concluidas} rotinas concluídas · {p.planos_ativos} plano(s) ativo(s)</p>
                </div>
                <Link to={`/clinica/pacientes/${p.id}`} className="inline-flex items-center gap-1 font-medium text-verde">Ver ficha <ArrowRight size={16} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-7">
        <h2 className="text-xl">Pacientes recentes</h2>
        {d.recentes.length === 0 ? (
          <p className="mt-3 text-suave">Nenhum paciente ainda. Cadastre o primeiro em <Link to="/clinica/pacientes" className="font-medium text-verde underline">Pacientes</Link>.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.recentes.map((p) => (
              <li key={p.id}>
                <Link to={`/clinica/pacientes/${p.id}`} className="block rounded-3xl border border-linha bg-fundo/60 p-5 hover:bg-verde-claro/50">
                  <p className="text-lg">{p.nome}</p>
                  <p className="mt-1 text-sm text-suave">{p.planos_ativos} plano(s) ativo(s) · adesão {p.adesao}%</p>
                  {d.ate && <p className="mt-3 text-xs text-suave">Últimos 7 dias até {diaMes(d.ate)}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
