import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import Logo from './Logo.jsx';
import Sino from './Sino.jsx';
import { HojeProvider, useHoje } from './HojeProvider.jsx';

const MENUS = {
  clinica: [['/clinica', 'Painel'], ['/clinica/pacientes', 'Pacientes'], ['/clinica/relatorios', 'Relatórios']],
  paciente: [['/paciente', 'Meu dia'], ['/paciente/plano', 'Meu plano'], ['/paciente/evolucao', 'Evolução']],
};

// Aviso em destaque quando chega a hora de uma rotina
function Aviso() {
  const { alertas, marcarLidas } = useHoje();
  const novo = alertas.find((a) => !a.lida);
  if (!novo) return null;
  return (
    <div role="alert" className="fixed inset-x-4 top-20 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-verde px-5 py-4 text-white shadow-card">
      <p><span className="font-semibold">Hora da rotina</span> · {novo.horario} {novo.titulo}</p>
      <button className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold hover:bg-white/25" onClick={marcarLidas}>Ok</button>
    </div>
  );
}

function Casca({ perfil, children }) {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const pill = ({ isActive }) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-[15px] transition-colors ${isActive ? 'bg-verde-claro font-medium text-tinta' : 'text-suave hover:text-tinta'}`;
  const clinica = perfil === 'clinica';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-linha bg-fundo/90 backdrop-blur">
        <div className={`mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 ${clinica ? 'max-w-[1600px] sm:px-8' : 'sm:px-6'}`}>
          <Logo pequeno />
          <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Principal">
            {MENUS[perfil].map(([to, nome]) => (
              <NavLink key={to} to={to} end={to === `/${perfil}`} className={pill}>{nome}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {perfil === 'paciente' && <Sino />}
            <span className="hidden text-[15px] text-suave sm:inline">{usuario.nome}</span>
            <button className="rounded-full p-2 hover:bg-verde-claro" aria-label="Sair" onClick={() => { sair(); navegar('/'); }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      {perfil === 'paciente' && <Aviso />}
      <main className={`mx-auto px-4 py-8 sm:px-8 ${clinica ? 'max-w-[1600px]' : 'max-w-[964px]'}`}>{children}</main>
    </div>
  );
}

export default function Layout({ perfil, children }) {
  const conteudo = <Casca perfil={perfil}>{children}</Casca>;
  return perfil === 'paciente' ? <HojeProvider>{conteudo}</HojeProvider> : conteudo;
}
