import { useEffect, useState } from 'react';
import { Check, Moon, Sun, Sunrise } from 'lucide-react';
import { dataExtenso, PERIODOS, primeiroNome } from '../../formatos.js';
import { useHoje } from '../../components/HojeProvider.jsx';

const ICONES = { manha: Sunrise, tarde: Sun, noite: Moon };

export default function MeuDia() {
  const { dados, erro, concluir } = useHoje();
  const [salvando, setSalvando] = useState(null);
  const [erroAcao, setErroAcao] = useState('');
  const [, tic] = useState(0);
  useEffect(() => { const t = setInterval(() => tic((n) => n + 1), 30000); return () => clearInterval(t); }, []);

  if (erro) return <p role="alert" className="erro">{erro}</p>;
  if (!dados) return <p className="text-suave">Carregando…</p>;

  const { rotinas } = dados;
  const feitas = rotinas.filter((r) => r.concluida).length;
  const hora = new Date().toTimeString().slice(0, 5);
  const atrasadas = rotinas.filter((r) => !r.concluida && r.horario < hora).length;
  const porcento = rotinas.length ? Math.round((feitas * 100) / rotinas.length) : 0;

  async function marcar(id) {
    setSalvando(id); setErroAcao('');
    try { await concluir(id); } catch (e) { setErroAcao(e.message); } finally { setSalvando(null); }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">{dataExtenso()}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Olá, {primeiroNome(dados.nome)}</h1>
        {dados.plano && <p className="mt-2 text-lg text-suave">{dados.plano}{dados.clinica ? ` · ${dados.clinica}` : ''}</p>}
      </header>

      {rotinas.length === 0 ? (
        <p className="card p-7 text-suave">Você ainda não tem um plano ativo. Quando sua clínica criar um plano, as rotinas de hoje aparecem aqui.</p>
      ) : (
        <>
          <section className="card p-7">
            <p className="eyebrow">Progresso de hoje</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <p className="font-display text-5xl">{porcento}%</p>
              <p className={atrasadas ? 'text-alerta' : 'text-suave'}>
                {feitas} de {rotinas.length} rotinas · {atrasadas ? `${atrasadas} atrasada(s)` : 'em dia'}
              </p>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-verde-claro" role="progressbar" aria-valuenow={porcento} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso de hoje">
              <div className="h-full rounded-full bg-verde transition-all" style={{ width: `${porcento}%` }} />
            </div>
          </section>

          {erroAcao && <p role="alert" className="erro">{erroAcao}</p>}

          {Object.keys(PERIODOS).map((per) => {
            const lista = rotinas.filter((r) => r.periodo === per);
            if (!lista.length) return null;
            const Icone = ICONES[per];
            return (
              <section key={per} className="space-y-3">
                <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-[0.14em] text-suave"><Icone size={18} aria-hidden="true" />{PERIODOS[per]}</h2>
                {lista.map((r) => (
                  <article key={r.id} className={`card flex items-center gap-4 p-5 ${r.concluida ? 'opacity-70' : ''}`}>
                    <span className="grid h-[58px] w-[70px] shrink-0 place-items-center rounded-2xl bg-verde-claro text-lg font-semibold tabular-nums">{r.horario}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-lg ${r.concluida ? 'line-through' : ''}`}>{r.titulo}</h3>
                      <p className="text-sm text-suave">{r.produto ? `${r.produto} · ` : ''}{PERIODOS[r.periodo]}</p>
                      {r.instrucoes && <p className="mt-0.5 text-suave">{r.instrucoes}</p>}
                    </div>
                    <button className={r.concluida ? 'inline-flex items-center gap-1 font-semibold text-verde' : 'btn-primario !px6'}
                    onClick={() => marcar(r.id)} disabled={salvando === r.id}>
                      <Check size={18} aria-hidden="true" /> 
                      {r.concluida ? 'Concluída' : 'Marcar'}
                    </button>
                  </article>
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
