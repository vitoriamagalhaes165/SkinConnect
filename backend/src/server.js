import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { UPLOAD_DIR } from './middleware/upload.js';
import authRoutes from './routes/auth.js';
import clinicaRoutes from './routes/clinica.js';
import pacienteRoutes from './routes/paciente.js';
import relatorioRoutes from './routes/relatorios.js';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // permite <img> vindo do frontend
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '100kb' }));

// Fotos protegidas por autenticação e permissão
app.get('/uploads/:arquivo', async (req, res, next) => {
  res.set('Cache-Control', 'private, no-store');

  const cab = req.headers.authorization || '';
  const token = cab.startsWith('Bearer ') ? cab.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }

  let usuario;

  try {
    usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
  }

  const arquivo = req.params.arquivo;

  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/i.test(arquivo)) {
    return res.status(404).json({ erro: 'Foto não encontrada.' });
  }

  try {
    const [fotos] = await pool.query(
      `SELECT f.caminho
       FROM Fotos f
       JOIN Pacientes p ON p.id = f.paciente_id
       WHERE f.caminho = ?
       AND (
         (? = 'paciente' AND p.id = ?)
         OR
         (? = 'clinica' AND p.clinica_id = ?)
       )
       LIMIT 1`,
      [arquivo, usuario.perfil, usuario.id,
       usuario.perfil, usuario.id]
    );

    if (!fotos.length) {
      return res.status(404).json({ erro: 'Foto não encontrada.' });
    }

    res.sendFile(arquivo, {
      root: UPLOAD_DIR,
      dotfiles: 'deny',
      cacheControl: false
    });
  } catch (erro) {
    next(erro);
  }
});

app.get('/api/saude', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/clinica', clinicaRoutes);
app.use('/api/clinica/relatorios', relatorioRoutes);
app.use('/api/paciente', pacienteRoutes);

app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.startsWith('Envie uma imagem')) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'A imagem deve ter no máximo 5 MB.' : err.message;
    return res.status(400).json({ erro: msg });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const porta = Number(process.env.PORT || 4000);
app.listen(porta, () => console.log(`SkinConnect API em http://localhost:${porta}`));
