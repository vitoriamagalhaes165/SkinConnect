import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Entrar from './pages/Entrar.jsx';
import Cadastro from './pages/Cadastro.jsx';
import { EsqueciSenha, RedefinirSenha } from './pages/Senha.jsx';
import Painel from './pages/clinica/Painel.jsx';
import Pacientes from './pages/clinica/Pacientes.jsx';
import PacienteFicha from './pages/clinica/PacienteFicha.jsx';
import Relatorios from './pages/clinica/Relatorios.jsx';
import MeuDia from './pages/paciente/MeuDia.jsx';
import MeuPlano from './pages/paciente/MeuPlano.jsx';
import Evolucao from './pages/paciente/Evolucao.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Entrar />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      <Route path="/clinica" element={<ProtectedRoute perfil="clinica" />}>
        <Route index element={<Painel />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="pacientes/:id" element={<PacienteFicha />} />
        <Route path="relatorios" element={<Relatorios />} />
      </Route>

      <Route path="/paciente" element={<ProtectedRoute perfil="paciente" />}>
        <Route index element={<MeuDia />} />
        <Route path="plano" element={<MeuPlano />} />
        <Route path="evolucao" element={<Evolucao />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
