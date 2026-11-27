import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, UserPlus } from 'lucide-react';
import { api } from '../../api.js';
import { PELES } from '../../formatos.js';
import Modal from '../../components/Modal.jsx';

const vazio = { nome: '', email: '', telefone: '', data_nascimento: '', tipo_pele: '', observacoes: '' };

export default function Pacientes() {
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState(vazio);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [copiado, setCopiado] = useState(false);

  const carregar = () => api.get('/clinica/pacientes').then(setDados).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function cadastrar(e) {
    e.preventDefault();
    setErro('');
    try {
      const r = await api.post('/clinica/pacientes', f);
      setAberto(false); setF(vazio);
      setAviso(r.vinculado ? 'Paciente vinculado: ele já tinha criado a conta com esse e-mail.' : 'Paciente cadastrado. Quando ele criar a conta com este e-mail, ela se vincula automaticamente.');
      carregar();
    } catch (err) { setErro(err.message); }
  }

  const linkConvite = dados ? `${window.location.origin}/cadastro?codigo=${dados.codigo}` : '';
  const copiar = async () => {
    try { await navigator.clipboard.writeText(linkConvite); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem permissão */ }
  };
  const lista = (dados?.pacientes || []).filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl">Pacientes</h1>
          {dados && (
            <p className="mt-2 text-lg text-suave">
              Código de convite da clínica: {dados.codigo}{' '}
              <button className="text-base font-medium text-verde underline" onClick={copiar}>{copiado ? 'Link copiado' : 'Copiar link de convite'}</button>
            </p>
          )}
        </div>
        <button className="btn-primario !px-6 !py-3" disabled={!dados} onClick={() => { setErro(""); setAberto(true); }}><UserPlus size={18} aria-hidden="true" />Novo paciente</button>
      </header>

      {aviso && <p role="status" className="sucesso">{aviso}</p>}
      {erro && !aberto && <p role="alert" className="erro">{erro}</p>}

      <div className="relative max-w-xl">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave" aria-hidden="true" />
        <input className="campo !rounded-full pl-11" placeholder="Buscar por nome" aria-label="Buscar paciente por nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {!dados ? <p className="text-suave">Carregando…</p> : lista.length === 0 ? (
        <p className="text-suave">{dados.pacientes.length ? 'Nenhum paciente encontrado.' : 'Nenhum paciente ainda. Clique em "Novo paciente" para começar.'}</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-medium">{p.nome}</p>
                <span className="rounded-full bg-verde-claro px-3 py-1 text-sm font-medium">{p.adesao}%</span>
              </div>
              <p className="text-suave">{p.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.tipo_pele && <span className="chip">{PELES[p.tipo_pele]}</span>}
                <span className="chip">{p.planos_ativos} plano(s) ativo(s)</span>
                <span className={`chip ${p.conta_vinculada ? 'border-transparent bg-verde-claro text-verde-escuro' : ''}`}>{p.conta_vinculada ? 'Conta vinculada' : 'Aguardando cadastro'}</span>
              </div>
              <Link to={`/clinica/pacientes/${p.id}`} className="mt-4 inline-flex items-center gap-1 font-medium text-verde-escuro">Abrir ficha <ArrowRight size={16} aria-hidden="true" /></Link>
            </li>
          ))}
        </ul>
      )}

      {aberto && (
        <Modal titulo="Cadastrar paciente" aoFechar={() => setAberto(false)}
          descricao={`Ao usar o e-mail que a pessoa usará para entrar, a conta se vincula automaticamente. Código de convite da clínica: ${dados.codigo}.`}>
          <form onSubmit={cadastrar} className="space-y-4">
            <div><label className="rotulo" htmlFor="n">Nome completo</label><input id="n" className="campo" value={f.nome} onChange={set('nome')} required autoFocus /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="rotulo" htmlFor="e">E-mail</label><input id="e" type="email" className="campo" placeholder="paciente@exemplo.com" value={f.email} onChange={set('email')} required /></div>
              <div><label className="rotulo" htmlFor="t">Telefone</label><input id="t" type="tel" className="campo" placeholder="(11) 90000-0000" value={f.telefone} onChange={set('telefone')} /></div>
              <div><label className="rotulo" htmlFor="d">Nascimento</label><input id="d" type="date" className="campo" value={f.data_nascimento} onChange={set('data_nascimento')} /></div>
              <div>
                <label className="rotulo" htmlFor="p">Tipo de pele</label>
                <select id="p" className="campo" value={f.tipo_pele} onChange={set('tipo_pele')}>
                  <option value="">Não informado</option>
                  {Object.entries(PELES).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                </select>
              </div>
            </div>
            <div><label className="rotulo" htmlFor="o">Observações</label><textarea id="o" rows={3} className="campo" placeholder="Histórico, alergias, indicações" value={f.observacoes} onChange={set('observacoes')} /></div>
            {erro && <p role="alert" className="erro">{erro}</p>}
            <div className="flex justify-end"><button className="btn-primario !px-6">Cadastrar paciente</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
