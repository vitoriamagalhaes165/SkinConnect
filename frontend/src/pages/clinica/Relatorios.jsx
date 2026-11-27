import { useEffect, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { api } from '../../api.js';
import { dataBR } from '../../formatos.js';

export default function Relatorios() {
  const [dias, setDias] = useState('30');
  const [pacienteId, setPacienteId] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [rel, setRel] = useState(null);
  const [erro, setErro] = useState('');
  const [baixando, setBaixando] = useState('');

  const consulta = `dias=${dias}${pacienteId ? `&paciente_id=${pacienteId}` : ''}`;
  useEffect(() => { api.get('/clinica/pacientes').then((d) => setPacientes(d.pacientes)).catch(() => {}); }, []);
  useEffect(() => { api.get(`/clinica/relatorios/adesao?${consulta}`).then(setRel).catch((e) => setErro(e.message)); }, [consulta]);

  async function baixar(ext) {
    setErro(''); setBaixando(ext);
    try { await api.baixar(`/clinica/relatorios/adesao.${ext}?${consulta}`, `adesao-skinconnect.${ext}`); }
    catch (e) { setErro(e.message); }
    finally { setBaixando(''); }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Relatórios</h1>
          <p className="mt-2 text-lg text-suave">Exporte a adesão dos pacientes em PDF ou Excel.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Período" className="campo !w-auto !rounded-full" value={dias} onChange={(e) => setDias(e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <select aria-label="Paciente" className="campo !w-auto !rounded-full" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}>
            <option value="">Todos os pacientes</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <button className="btn-primario !px-6" onClick={() => baixar('pdf')} disabled={!!baixando}><FileDown size={18} aria-hidden="true" />{baixando === 'pdf' ? 'Gerando…' : 'Baixar PDF'}</button>
        <button className="btn-contorno !px-6" onClick={() => baixar('xlsx')} disabled={!!baixando}><FileSpreadsheet size={18} aria-hidden="true" />{baixando === 'xlsx' ? 'Gerando…' : 'Baixar Excel'}</button>
      </div>
      {erro && <p role="alert" className="erro">{erro}</p>}

      <div className="card overflow-x-auto">
        {!rel ? <p className="p-6 text-suave">Carregando…</p> : rel.linhas.length === 0 ? <p className="p-6 text-suave">Nenhum paciente para exibir.</p> : (
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-linha text-suave">
                <th className="px-4 py-4 font-normal">Paciente</th><th className="px-4 font-normal">Plano</th><th className="px-4 font-normal">Tipo de pele</th>
                <th className="px-4 text-right font-normal">Rotinas/dia</th><th className="px-4 text-right font-normal">Esperado</th>
                <th className="px-4 text-right font-normal">Concluído</th><th className="px-4 text-right font-normal">Adesão</th>
              </tr>
            </thead>
            <tbody>
              {rel.linhas.map((l) => (
                <tr key={l.paciente_id} className="border-b border-linha last:border-0">
                  <td className="px-4 py-4 font-medium">{l.nome}</td>
                  <td className="px-4 text-suave">{l.plano || '—'}</td>
                  <td className="px-4 text-suave">{l.tipo_pele || '—'}</td>
                  <td className="px-4 text-right tabular-nums">{l.rotinas_dia}</td>
                  <td className="px-4 text-right tabular-nums">{l.esperado}</td>
                  <td className="px-4 text-right tabular-nums">{l.concluido}</td>
                  <td className="px-4 text-right font-semibold tabular-nums">{l.adesao == null ? '—' : `${l.adesao}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {rel?.periodo && <p className="text-sm text-suave">Período analisado: {dataBR(rel.periodo.inicio)} a {dataBR(rel.periodo.fim)}.</p>}
    </div>
  );
}
