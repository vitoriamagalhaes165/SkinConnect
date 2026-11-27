import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { api } from '../../api.js';
import { TIPOS_FOTO } from '../../formatos.js';
import { EvolucaoResumo, GaleriaFotos } from '../../components/EvolucaoPainel.jsx';

function NovaFoto({ aoEnviar }) {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('evolucao');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!arquivo) { setPreview(''); return; }
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  function escolher(e) {
    const f = e.target.files[0];
    setErro('');
    if (f && f.size > 5 * 1024 * 1024) { setErro('A imagem deve ter no máximo 5 MB.'); setArquivo(null); return; }
    setArquivo(f || null);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviando(true); setErro('');
    const form = new FormData();
    form.append('foto', arquivo); form.append('descricao', descricao); form.append('tipo', tipo);
    try {
      await api.upload('/paciente/fotos', form);
      setArquivo(null); setDescricao(''); setTipo('evolucao');
      aoEnviar();
    } catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  }

  return (
    <form onSubmit={enviar} className="card p-7">
      <h2 className="text-2xl">Nova foto de evolução</h2>
      <p className="mt-1 text-suave">Registre como a pele está hoje. As fotos ficam guardadas no seu histórico e visíveis para sua clínica.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-[250px_1fr]">
        <label className="grid h-[200px] cursor-pointer place-items-center overflow-hidden rounded-3xl border border-dashed border-suave/40 bg-fundo text-suave focus-within:outline focus-within:outline-2 focus-within:outline-verde hover:bg-verde-claro/50">
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={escolher} />
          {preview
            ? <img src={preview} alt="Pré-visualização da foto escolhida" className="h-full w-full object-cover" />
            : <span className="flex flex-col items-center gap-2"><ImagePlus size={26} aria-hidden="true" />Escolher imagem</span>}
        </label>
        <div className="space-y-4">
          <div><label className="rotulo" htmlFor="desc">Descrição</label><textarea id="desc" rows={3} maxLength={200} className="campo" placeholder="Ex.: manhã, após a rotina noturna" value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
          <div>
            <label className="rotulo" htmlFor="tipo">Tipo</label>
            <select id="tipo" className="campo !w-auto !rounded-full pr-8" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {Object.entries(TIPOS_FOTO).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
          </div>
          {erro && <p role="alert" className="erro">{erro}</p>}
          <button className="btn-primario !px-6" disabled={!arquivo || enviando}>{enviando ? 'Enviando…' : 'Salvar foto'}</button>
        </div>
      </div>
    </form>
  );
}

export default function Evolucao() {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState('');
  const carregar = () => api.get('/paciente/evolucao').then(setD).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, []);

  if (erro) return <p role="alert" className="erro">{erro}</p>;
  if (!d) return <p className="text-suave">Carregando…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Minha evolução</h1>
        <p className="mt-2 text-lg text-suave">Acompanhe sua adesão e registre fotos para comparar os resultados.</p>
      </header>
      <EvolucaoResumo evolucao={d} />
      <NovaFoto aoEnviar={carregar} />
      <section className="space-y-4">
        <h2 className="text-2xl">Histórico de fotos</h2>
        <GaleriaFotos fotos={d.fotos} />
      </section>
    </div>
  );
}
