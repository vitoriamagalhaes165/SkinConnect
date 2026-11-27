import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const Ctx = createContext(null);
export const useHoje = () => useContext(Ctx);

/** Carrega as rotinas de hoje e dispara alertas internos no horário de cada uma. */
export function HojeProvider({ children }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [alertas, setAlertas] = useState([]);
  const avisadas = useRef(new Set());
  const rotinasRef = useRef([]);
  rotinasRef.current = dados?.rotinas || [];

  const carregar = useCallback(
    () => api.get('/paciente/hoje').then((d) => { setDados(d); setErro(''); }).catch((e) => setErro(e.message)),
    []
  );

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    const checar = () => {
      const agora = new Date();
      const hora = agora.toTimeString().slice(0, 5);
      const novas = rotinasRef.current.filter((r) => {
        const chave = `${agora.toDateString()}-${r.id}`;
        return !r.concluida && r.horario === hora && !avisadas.current.has(chave);
      });
      if (!novas.length) return;
      novas.forEach((r) => {
        avisadas.current.add(`${agora.toDateString()}-${r.id}`);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('SkinConnect', { body: `${r.horario} · ${r.titulo}` });
        }
      });
      setAlertas((a) => [...novas.map((r) => ({ id: r.id, titulo: r.titulo, horario: r.horario, lida: false })), ...a]);
    };
    checar();
    const t = setInterval(checar, 15000);
    return () => clearInterval(t);
  }, []);

 async function concluir(id) {
  await api.post(`/paciente/rotinas/${id}/concluir`);
 
  setDados((d) => ({
  ...d,
  rotinas: d.rotinas.map((r) => r.id===id ? { ...r, concluida: !r.concluida } : r)
 }));
}

  // alerta só vale enquanto a rotina estiver pendente
  const pendentes = new Set((dados?.rotinas || []).filter((r) => !r.concluida).map((r) => r.id));
  const visiveis = alertas.filter((a) => pendentes.has(a.id));
  const marcarLidas = () => setAlertas((a) => a.map((x) => ({ ...x, lida: true })));

  return (
    <Ctx.Provider value={{ dados, erro, concluir, alertas: visiveis, marcarLidas }}>{children}</Ctx.Provider>
  );
}
