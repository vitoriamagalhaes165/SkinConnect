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

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // permite <img> vindo do frontend
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '100kb' }));

// Fotos: nomes aleatórios (UUID) e sem listagem de diretório
app.use('/uploads', express.static(UPLOAD_DIR, { index: false, dotfiles: 'deny', maxAge: '7d' }));

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
