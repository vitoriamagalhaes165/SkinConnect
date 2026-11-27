import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { AuthCasca, BotaoGoogle, CampoIcone, Divisor, SeletorPerfil } from '../components/AuthPartes.jsx';

export default function Entrar() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState('clinica');
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={`/${usuario.perfil}`} replace />;

  const concluir = (dados) => { entrar(dados); navegar(`/${dados.usuario.perfil}`); };

  async function enviar(e) {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try { concluir(await api.post(`/auth/${perfil}/login`, form)); }
    catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  }

  return (
    <AuthCasca subtitulo="Entre para acompanhar o cuidado com a pele">
      <SeletorPerfil perfil={perfil} aoMudar={setPerfil} />
      <div className="mt-4"><BotaoGoogle perfil={perfil} aoEntrar={concluir} aoErro={setErro} /></div>
      <Divisor />
      <form onSubmit={enviar} className="space-y-4">
        <CampoIcone id="email" rotulo="E-mail" icone={Mail} type="email" placeholder="voce@exemplo.com" autoComplete="email" required
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <CampoIcone id="senha" rotulo="Senha" icone={Lock} type="password" placeholder="••••••••" autoComplete="current-password" required
          value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })}
          acao={<Link to="/esqueci-senha" className="text-sm text-suave underline">Esqueci minha senha</Link>} />
        {erro && <p role="alert" className="erro">{erro}</p>}
        <button className="btn-primario w-full !rounded-2xl !py-3.5 text-base" disabled={enviando}>
          {enviando ? 'Entrando…' : `Entrar como ${perfil === 'clinica' ? 'Clínica' : 'Paciente'}`}
        </button>
      </form>
      <p className="mt-5 text-center text-suave">
        Ainda não tem conta? <Link to="/cadastro" className="font-semibold text-tinta">Criar conta</Link>
      </p>
    </AuthCasca>
  );
}
