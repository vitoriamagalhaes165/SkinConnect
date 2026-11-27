import { Router } from 'express';
import { pool } from '../db.js';
import { exigirPerfil } from '../middleware/auth.js';
import { uploadFoto } from '../middleware/upload.js';
import { periodoDe, planosComRotinas, resumoEvolucao } from '../services/adesao.js';

const r = Router();
r.use(exigirPerfil('paciente'));

const VIGENTE = `pl.ativo = 1 AND pl.data_inicio <= CURDATE() AND (pl.data_fim IS NULL OR pl.data_fim >= CURDATE())`;

// Tela "Meu dia"
r.get('/hoje', async (req, res) => {
  const [[pac]] = await pool.query(
    'SELECT pa.nome, c.nome AS clinica FROM Pacientes pa LEFT JOIN Clinicas c ON c.id = pa.clinica_id WHERE pa.id = ?',
    [req.usuario.id]
  );
  const [rows] = await pool.query(
    `SELECT r.id, r.titulo, r.produto, r.instrucoes, TIME_FORMAT(r.horario, '%H:%i') AS horario,
            pl.titulo AS plano, (e.id IS NOT NULL) AS concluida
       FROM Rotinas r
       JOIN Planos pl ON pl.id = r.plano_id AND pl.paciente_id = ? AND ${VIGENTE}
       LEFT JOIN Execucoes e ON e.rotina_id = r.id AND e.data = CURDATE()
      ORDER BY r.horario, r.id`,
    [req.usuario.id]
  );
  res.json({
    nome: pac.nome,
    clinica: pac.clinica,
    plano: rows[0]?.plano || null,
    rotinas: rows.map(({ plano, ...x }) => ({ ...x, concluida: Boolean(x.concluida), periodo: periodoDe(x.horario) })),
  });
});

r.post('/rotinas/:id/concluir', async (req, res) => {
  const rotinaId = Number(req.params.id);
  const [[ok]] = await pool.query(
    `SELECT r.id FROM Rotinas r JOIN Planos pl ON pl.id = r.plano_id
      WHERE r.id = ? AND pl.paciente_id = ? AND ${VIGENTE}`,
    [rotinaId, req.usuario.id]
  );
  if (!ok) return res.status(404).json({ erro: 'Rotina não encontrada.' });
  const [resultado] = await pool.query(
  'DELETE FROM Execucoes WHERE rotina_id = ? AND paciente_id = ? AND data = CURDATE()',
  [rotinaId, req.usuario.id]
);

if (resultado.affectedRows === 0) {
  await pool.query(
    'INSERT IGNORE INTO Execucoes (rotina_id, paciente_id, data) VALUES (?, ?, CURDATE())',
    [rotinaId, req.usuario.id]
  );
}
res.json({ ok: true });
});

// Tela "Meu plano"
r.get('/plano', async (req, res) => {
  const [[pac]] = await pool.query(
    'SELECT c.nome AS clinica FROM Pacientes pa LEFT JOIN Clinicas c ON c.id = pa.clinica_id WHERE pa.id = ?',
    [req.usuario.id]
  );
  const planos = await planosComRotinas('pl.paciente_id = ?', [req.usuario.id]);
  res.json({ clinica: pac.clinica, plano: planos.find((p) => p.ativo) || planos[0] || null });
});

// Tela "Evolução"
r.get('/evolucao', async (req, res) => {
  res.json(await resumoEvolucao(req.usuario.id));
});

const TIPOS_FOTO = ['antes', 'evolucao', 'depois'];
r.post('/fotos', uploadFoto, async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Selecione uma foto.' });
  const descricao = String(req.body.descricao || '').trim().slice(0, 200) || null;
  const tipo = TIPOS_FOTO.includes(req.body.tipo) ? req.body.tipo : 'evolucao';
  const [ins] = await pool.query('INSERT INTO Fotos (paciente_id, caminho, descricao, tipo) VALUES (?, ?, ?, ?)', [
    req.usuario.id, req.file.filename, descricao, tipo,
  ]);
  res.status(201).json({ id: ins.insertId, url: `/uploads/${req.file.filename}`, descricao, tipo });
});

export default r;
