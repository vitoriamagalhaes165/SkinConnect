import { useEffect, useRef } from 'react';
import { Building2, User } from 'lucide-react';
import { api } from '../api.js';

export function AuthCasca({ subtitulo, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:justify-center">
      <h1 className="font-display text-4xl font-semibold">SkinConnect</h1>
      <p className="mt-2 text-center text-suave">{subtitulo}</p>
      <div className="card mt-8 w-full max-w-[560px] p-6 sm:p-8">{children}</div>
    </div>
  );
}

export function SeletorPerfil({ perfil, aoMudar }) {
  const opcoes = [
    ['clinica', Building2, 'Clínica / Profissional', 'Painel, pacientes e planos'],
    ['paciente', User, 'Paciente', 'Meu checklist e evolução'],
  ];
  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label="Tipo de conta">
      {opcoes.map(([valor, Icone, titulo, desc]) => {
        const ativo = perfil === valor;
        return (
          <button
            key={valor} type="button" aria-pressed={ativo} onClick={() => aoMudar(valor)}
            className={`rounded-2xl border p-4 text-left transition-colors ${ativo ? 'border-verde bg-verde-claro' : 'border-linha bg-white hover:bg-verde-claro/50'}`}
          >
            <Icone size={22} className={ativo ? 'text-verde' : 'text-suave'} aria-hidden="true" />
            <span className="mt-3 block font-semibold leading-tight">{titulo}</span>
            <span className="mt-1 block text-sm text-suave">{desc}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CampoIcone({ id, rotulo, icone: Icone, acao, ...props }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="rotulo" htmlFor={id}>{rotulo}</label>
        {acao}
      </div>
      <div className="relative">
        {Icone && <Icone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave" aria-hidden="true" />}
        <input id={id} className={`campo ${Icone ? 'pl-11' : ''}`} {...props} />
      </div>
    </div>
  );
}

export const Divisor = () => (
  <div className="my-5 flex items-center gap-4 text-sm text-suave" aria-hidden="true">
    <span className="h-px flex-1 bg-linha" />OU<span className="h-px flex-1 bg-linha" />
  </div>
);

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function BotaoGoogle({ perfil, aoEntrar, aoErro }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    const iniciar = () => {
      if (!ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try { aoEntrar(await api.post('/auth/google', { credential, perfil })); }
          catch (e) { aoErro(e.message); }
        },
      });
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill',
        logo_alignment: 'center', locale: 'pt-BR', width: Math.min(400, ref.current.clientWidth || 400),
      });
    };
    if (window.google?.accounts?.id) { iniciar(); return; }
    let s = document.querySelector('script[data-gsi]');
    if (!s) {
      s = Object.assign(document.createElement('script'), { src: 'https://accounts.google.com/gsi/client', async: true });
      s.dataset.gsi = '1';
      document.head.appendChild(s);
    }
    s.addEventListener('load', iniciar);
    return () => s.removeEventListener('load', iniciar);
  }, [perfil]);

  if (CLIENT_ID) return <div ref={ref} className="flex min-h-[44px] justify-center" />;
  return (
    <button type="button" className="btn-contorno w-full !rounded-2xl !py-3 font-medium"
      onClick={() => aoErro('Login com Google ainda não foi configurado (defina VITE_GOOGLE_CLIENT_ID).')}>
      <GoogleG /> Continuar com Google
    </button>
  );
}
