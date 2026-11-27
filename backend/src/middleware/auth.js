import 'dotenv/config';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no arquivo .env');
  process.exit(1);
}

export const assinarToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '8h' });

/** Exige token válido E o perfil indicado ('clinica' ou 'paciente'). */
export const exigirPerfil = (perfil) => (req, res, next) => {
  const cab = req.headers.authorization || '';
  const token = cab.startsWith('Bearer ') ? cab.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    if (dados.perfil !== perfil) return res.status(403).json({ erro: 'Acesso não permitido para este perfil.' });
    req.usuario = dados; // { id, perfil }
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }
};
