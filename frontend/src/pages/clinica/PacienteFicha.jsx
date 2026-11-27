import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api.js';
import { dataBR, PELES } from '../../formatos.js';
import Modal from '../../components/Modal.jsx';
import PlanoCard from '../../components/PlanoCard.jsx';
import { EvolucaoResumo, GaleriaFotos } from '../../components/EvolucaoPainel.jsx';

const rotinaVazia = () => ({ horario: '08:00', titulo: '', produto: '', instrucoes: '' });
const planoVazio = { titulo: '', objetivo: '', descricao: '', data_inicio: '', data_fim: '' };

export default function PacienteFicha() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [plano, setPlano] = useState(planoVazio);
  const [rotinas, setRotinas] = useState([rotinaVazia()]);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.get(`/clinica/pacientes/${id}`).then(setD).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setPlano({ ...plano, [k]: e.target.value });
  const setRot = (i, k, v) => setRotinas(rotinas.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  async function salvar(e) {
    e.preventDefault();
    setErroForm(''); setSalvando(true);
    try {
      await api.post(`/clinica/pacientes/${id}/planos`, { ...plano, rotinas });
      setAberto(false); setPlano(planoVazio); setRotinas([rotinaVazia()]);
      carregar();
    } catch (err) { setErroForm(err.message); }
    finally { setSalvando(false); }
  }

  if (erro) return <p role="alert" className="erro">{erro}</p>;
  if (!d) return <p className="text-suave">Carregando…</p>;
  const { paciente: p, evolucao, planos } = d;

  return (
    <div className="space-y-8">
      <Link to="/clinica/pacientes" className="inline-flex items-center gap-1 text-verde-escuro"><ArrowLeft size={16} aria-hidden="true" />Pacientes</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl">{p.nome}</h1>
          <p className="mt-1 text-suave">{p.email}{p.telefone ? ` · ${p.telefone}` : ''}{p.data_nascimento ? ` · nasc. ${dataBR(p.data_nascimento)}` : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.tipo_pele && <span className="chip">Pele {PELES[p.tipo_pele].toLowerCase()}</span>}
            <span className={`chip ${p.conta_vinculada ? 'border-transparent bg-verde-claro text-verde-escuro' : ''}`}>{p.conta_vinculada ? 'Conta vinculada' : 'Aguardando cadastro'}</span>
          </div>
        </div>
        <button className="btn-primario !px-6 !py-3" onClick={() => setAberto(true)}><Plus size={18} aria-hidden="true" />Novo plano</button>
      </header>

      {p.observacoes && (
        <section className="card p-6">
          <h2 className="text-lg">Observações</h2>
          <p className="mt-1 whitespace-pre-line text-suave">{p.observacoes}</p>
        </section>
      )}

      <EvolucaoResumo evolucao={evolucao} />

      <section className="space-y-4">
        <h2 className="text-2xl">Planos de cuidados</h2>
        {planos.length === 0 ? <p className="text-suave">Nenhum plano ainda. Crie o primeiro em "Novo plano".</p>
          : planos.map((pl) => <PlanoCard key={pl.id} plano={pl} />)}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Fotos</h2>
        <GaleriaFotos fotos={evolucao.fotos} />
      </section>

      {aberto && (
        <Modal largo titulo="Novo plano de cuidados" aoFechar={() => setAberto(false)}
          descricao="Criar um plano encerra o plano ativo anterior deste paciente. As rotinas se repetem todos os dias.">
          <form onSubmit={salvar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="rotulo" htmlFor="pt">Título</label><input id="pt" className="campo" placeholder="Protocolo de hidratação" value={plano.titulo} onChange={set('titulo')} required /></div>
              <div><label className="rotulo" htmlFor="po">Objetivo</label><input id="po" className="campo" placeholder="Reduzir ressecamento" value={plano.objetivo} onChange={set('objetivo')} /></div>
            </div>
            <div><label className="rotulo" htmlFor="pd">Descrição</label><textarea id="pd" rows={2} className="campo" value={plano.descricao} onChange={set('descricao')} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="rotulo" htmlFor="pi">Início (padrão: hoje)</label><input id="pi" type="date" className="campo" value={plano.data_inicio} onChange={set('data_inicio')} /></div>
              <div><label className="rotulo" htmlFor="pf">Término (opcional)</label><input id="pf" type="date" className="campo" value={plano.data_fim} onChange={set('data_fim')} /></div>
            </div>

            <fieldset className="space-y-3">
              <legend className="rotulo">Rotinas diárias</legend>
              {rotinas.map((r, i) => (
                <div key={i} className="grid gap-2 rounded-2xl border border-linha bg-white p-3 sm:grid-cols-[110px_1fr_1fr_auto]">
                  <input type="time" aria-label={`Horário da rotina ${i + 1}`} className="campo" value={r.horario} onChange={(e) => setRot(i, 'horario', e.target.value)} required />
                  <input aria-label={`Nome da rotina ${i + 1}`} placeholder="Limpeza suave" className="campo" value={r.titulo} onChange={(e) => setRot(i, 'titulo', e.target.value)} required />
                  <input aria-label={`Produto da rotina ${i + 1}`} placeholder="Produto (ex.: Gel de limpeza)" className="campo" value={r.produto} onChange={(e) => setRot(i, 'produto', e.target.value)} />
                  {rotinas.length > 1
                    ? <button type="button" className="btn-contorno !px-3" aria-label={`Remover rotina ${i + 1}`} onClick={() => setRotinas(rotinas.filter((_, j) => j !== i))}><Trash2 size={18} /></button>
                    : <span />}
                  <input aria-label={`Instruções da rotina ${i + 1}`} placeholder="Instruções (ex.: massagear por 1 minuto com água morna)" className="campo sm:col-span-4" value={r.instrucoes} onChange={(e) => setRot(i, 'instrucoes', e.target.value)} />
                </div>
              ))}
              <button type="button" className="btn-contorno" onClick={() => setRotinas([...rotinas, rotinaVazia()])}><Plus size={16} aria-hidden="true" />Adicionar rotina</button>
            </fieldset>

            {erroForm && <p role="alert" className="erro">{erroForm}</p>}
            <div className="flex justify-end"><button className="btn-primario !px-6" disabled={salvando}>{salvando ? 'Salvando…' : 'Criar plano'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
