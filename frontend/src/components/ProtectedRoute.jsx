import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Layout from './Layout.jsx';

export default function ProtectedRoute({ perfil }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/" replace />;
  if (usuario.perfil !== perfil) return <Navigate to={`/${usuario.perfil}`} replace />;
  return (
    <Layout perfil={perfil}>
      <Outlet />
    </Layout>
  );
}
