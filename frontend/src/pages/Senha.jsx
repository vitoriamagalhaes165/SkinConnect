import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { api } from '../api.js';
import { AuthCasca, CampoIcone, SeletorPerfil } from '../components/AuthPartes.jsx';

export function EsqueciSenha() {
  const [perfil, setPerfil] = useState('clinica');
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    try { await api.post('/auth/esqueci-senha', { email, perfil }); setEnviado(true); }
    catch (err) { setErro(err.message); }
  }

  return (
    <AuthCasca subtitulo="Enviaremos um link para você criar uma nova senha">
      {enviado ? (
        <div className="space-y-4">
          <p className="sucesso">Se existir uma conta com esse e-mail, o link de redefinição já está a caminho. Ele vale por 1 hora.</p>
          <Link to="/" className="btn-primario w-full !rounded-2xl">Voltar para o login</Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <SeletorPerfil perfil={perfil} aoMudar={setPerfil} />
          <CampoIcone id="email" rotulo="E-mail" icone={Mail} type="email" placeholder="voce@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {erro && <p role="alert" className="erro">{erro}</p>}
          <button className="btn-primario w-full !rounded-2xl !py-3.5 text-base">Enviar link</button>
          <p className="text-center"><Link to="/" className="text-suave underline">Voltar para o login</Link></p>
        </form>
      )}
    </AuthCasca>
  );
}

export function RedefinirSenha() {
  const [params] = useSearchParams();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) return setErro('As senhas não conferem.');
    try { await api.post('/auth/redefinir-senha', { token: params.get('token'), perfil: params.get('perfil'), senha }); setPronto(true); }
    catch (err) { setErro(err.message); }
  }

  return (
    <AuthCasca subtitulo="Crie uma nova senha">
      {pronto ? (
        <div className="space-y-4">
          <p className="sucesso">Senha alterada. Agora é só entrar.</p>
          <Link to="/" className="btn-primario w-full !rounded-2xl">Ir para o login</Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <CampoIcone id="s1" rotulo="Nova senha" icone={Lock} type="password" placeholder="••••••••" minLength={8} required autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <CampoIcone id="s2" rotulo="Confirmar senha" icone={Lock} type="password" placeholder="••••••••" minLength={8} required autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          {erro && <p role="alert" className="erro">{erro}</p>}
          <button className="btn-primario w-full !rounded-2xl !py-3.5 text-base">Salvar nova senha</button>
        </form>
      )}
    </AuthCasca>
  );
}
