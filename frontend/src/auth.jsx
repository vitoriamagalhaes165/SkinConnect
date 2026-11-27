import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sc_usuario')); } catch { return null; }
  });
  const entrar = ({ token, usuario }) => {
    localStorage.setItem('sc_token', token);
    localStorage.setItem('sc_usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  };
  const sair = () => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_usuario');
    setUsuario(null);
  };
  return <AuthContext.Provider value={{ usuario, entrar, sair }}>{children}</AuthContext.Provider>;
}
