import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PELES } from '../formatos.js';
import { AuthCasca, BotaoGoogle, CampoIcone, Divisor, SeletorPerfil } from '../components/AuthPartes.jsx';

export default function Cadastro() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const codigo = params.get('codigo') || ''; // link de convite da clínica
  const [perfil, setPerfil] = useState(codigo ? 'paciente' : 'clinica');
  const [f, setF] = useState({
    responsavel: '', nome: '', telefone: '', cidade: '', especialidade: '',
    data_nascimento: '', tipo_pele: '', email: '', senha: '', confirmar: '',
  });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={`/${usuario.perfil}`} replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ehClinica = perfil === 'clinica';
  const concluir = (dados) => { entrar(dados); navegar(`/${dados.usuario.perfil}`); };

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (f.senha !== f.confirmar) return setErro('As senhas não conferem.');
    setEnviando(true);
    try {
      const corpo = ehClinica
        ? { responsavel: f.responsavel, nome: f.nome, telefone: f.telefone, cidade: f.cidade, especialidade: f.especialidade, email: f.email, senha: f.senha }
        : { nome: f.nome, telefone: f.telefone, data_nascimento: f.data_nascimento, tipo_pele: f.tipo_pele, email: f.email, senha: f.senha, codigo_clinica: codigo };
      concluir(await api.post(`/auth/${perfil}/register`, corpo));
    } catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  }

  return (
    <AuthCasca subtitulo="Crie sua conta para começar">
      <SeletorPerfil perfil={perfil} aoMudar={setPerfil} />
      <div className="mt-4"><BotaoGoogle perfil={perfil} aoEntrar={concluir} aoErro={setErro} /></div>
      <Divisor />
      <form onSubmit={enviar} className="space-y-4">
        {ehClinica ? (
          <>
            <CampoIcone id="resp" rotulo="Seu nome" placeholder="Como devemos te chamar" required value={f.responsavel} onChange={set('responsavel')} autoComplete="name" />
            <CampoIcone id="nome" rotulo="Nome da clínica" placeholder="Clínica Bella Pele" required value={f.nome} onChange={set('nome')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoIcone id="tel" rotulo="Telefone" placeholder="(11) 90000-0000" type="tel" value={f.telefone} onChange={set('telefone')} />
              <CampoIcone id="cid" rotulo="Cidade" placeholder="São Paulo" value={f.cidade} onChange={set('cidade')} />
            </div>
            <CampoIcone id="esp" rotulo="Especialidade" placeholder="Dermatologia estética" value={f.especialidade} onChange={set('especialidade')} />
          </>
        ) : (
          <>
            <CampoIcone id="nome" rotulo="Nome completo" placeholder="Como devemos te chamar" required value={f.nome} onChange={set('nome')} autoComplete="name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoIcone id="tel" rotulo="Telefone" placeholder="(11) 90000-0000" type="tel" value={f.telefone} onChange={set('telefone')} />
              <CampoIcone id="nasc" rotulo="Nascimento" type="date" value={f.data_nascimento} onChange={set('data_nascimento')} />
            </div>
            <div>
              <label className="rotulo" htmlFor="pele">Tipo de pele</label>
              <select id="pele" className="campo" value={f.tipo_pele} onChange={set('tipo_pele')}>
                <option value="">Não informado</option>
                {Object.entries(PELES).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </div>
          </>
        )}
        <CampoIcone id="email" rotulo="E-mail" icone={Mail} type="email" placeholder="voce@exemplo.com" required autoComplete="email" value={f.email} onChange={set('email')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoIcone id="senha" rotulo="Senha" icone={Lock} type="password" placeholder="••••••••" required minLength={8} autoComplete="new-password" value={f.senha} onChange={set('senha')} />
          <CampoIcone id="conf" rotulo="Confirmar senha" icone={Lock} type="password" placeholder="••••••••" required minLength={8} autoComplete="new-password" value={f.confirmar} onChange={set('confirmar')} />
        </div>
        <p className="-mt-2 text-xs text-suave">Use pelo menos 8 caracteres.</p>
        {erro && <p role="alert" className="erro">{erro}</p>}
        <button className="btn-primario w-full !rounded-2xl !py-3.5 text-base" disabled={enviando}>
          {enviando ? 'Criando…' : ehClinica ? 'Criar conta da clínica' : 'Criar minha conta'}
        </button>
      </form>
      <p className="mt-5 text-center text-suave">
        Já tem conta? <Link to="/" className="font-semibold text-tinta">Entrar</Link>
      </p>
    </AuthCasca>
  );
}
