import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '../../api.js';
import PlanoCard from '../../components/PlanoCard.jsx';

export default function MeuPlano() {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => { api.get('/paciente/plano').then(setD).catch((e) => setErro(e.message)); }, []);

  if (erro) return <p role="alert" className="erro">{erro}</p>;
  if (!d) return <p className="text-suave">Carregando…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Meu plano de cuidados</h1>
        {d.clinica && <p className="mt-2 flex items-center gap-2 text-lg text-suave"><Building2 size={18} aria-hidden="true" />{d.clinica}</p>}
      </header>
      {d.plano ? <PlanoCard plano={d.plano} /> : <p className="card p-7 text-suave">Sua clínica ainda não criou um plano para você.</p>}
    </div>
  );
}
