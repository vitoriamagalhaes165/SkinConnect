import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useHoje } from './HojeProvider.jsx';

export default function Sino() {
  const { alertas, marcarLidas } = useHoje();
  const [aberto, setAberto] = useState(false);
  const [, atualizar] = useState(0);
  const caixa = useRef(null);
  const naoLidas = alertas.filter((a) => !a.lida).length;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (!caixa.current?.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  const podePedir = 'Notification' in window && Notification.permission === 'default';

  return (
    <div className="relative" ref={caixa}>
      <button
        className="relative rounded-full p-2 hover:bg-verde-claro"
        aria-label={naoLidas ? `Notificações: ${naoLidas} nova(s)` : 'Notificações'}
        aria-expanded={aberto}
        onClick={() => { setAberto(!aberto); if (!aberto) marcarLidas(); }}
      >
        <Bell size={20} />
        {naoLidas > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-alerta ring-2 ring-fundo" />}
      </button>
      {aberto && (
        <div role="dialog" aria-label="Notificações" className="card absolute right-0 z-30 mt-2 w-80 p-4">
          <p className="mb-2 font-semibold">Lembretes de hoje</p>
          {alertas.length === 0 ? (
            <p className="text-sm text-suave">Nenhum lembrete pendente. Avisamos aqui na hora de cada rotina.</p>
          ) : (
            <ul className="space-y-2">
              {alertas.map((a) => (
                <li key={a.id} className="rounded-2xl bg-verde-claro px-3 py-2 text-sm">
                  <span className="font-semibold tabular-nums">{a.horario}</span> · {a.titulo}
                </li>
              ))}
            </ul>
          )}
          {podePedir && (
            <button className="mt-3 text-sm font-semibold text-verde underline" onClick={() => Notification.requestPermission().then(() => atualizar((n) => n + 1))}>
              Receber avisos também fora desta aba
            </button>
          )}
        </div>
      )}
    </div>
  );
}
