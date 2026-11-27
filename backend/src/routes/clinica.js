import { Router } from 'express';
import { pool } from '../db.js';
import { exigirPerfil } from '../middleware/auth.js';
import {
  TIPOS_PELE, pct, serieDiaria, somarPorPaciente, somarPorDia, planosAtivos, planosComRotinas, resumoEvolucao,
} from '../services/adesao.js';

const r = Router();
r.use(exigirPerfil('clinica'));

const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const limpo = (v) => (texto(v) ? v.trim() : null);
const emailOk = (v) => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v.trim());
const dataOk = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const horaOk = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

// ---------- Painel ----------
r.get('/dashboard', async (req, res) => {
  const clinicaId = req.usuario.id;
  const [[clinica]] = await pool.query('SELECT nome FROM Clinicas WHERE id = ?', [clinicaId]);
  const [pacientes] = await pool.query('SELECT id, nome, criado_em FROM Pacientes WHERE clinica_id = ?', [clinicaId]);
  const [serie, ativos] = await Promise.all([serieDiaria({ clinicaId, dias: 14 }), planosAtivos(clinicaId)]);

  const dias14 = somarPorDia(serie);
  const datas7 = new Set(dias14.slice(-7).map((d) => d.data));
  const soma7 = somarPorPaciente(serie.filter((s) => datas7.has(s.data)));

  const lista = pacientes.map((p) => {
    const t = soma7.get(p.id) || { esperado: 0, feitas: 0 };
    return {
      id: p.id, nome: p.nome, criado_em: p.criado_em,
      esperado: t.esperado, concluidas: t.feitas, adesao: pct(t.feitas, t.esperado),
      planos_ativos: ativos.get(p.id)?.n || 0,
    };
  });
  const esp7 = lista.reduce((s, p) => s + p.esperado, 0);
  const fei7 = lista.reduce((s, p) => s + p.concluidas, 0);
  const hoje = dias14.at(-1) || { esperado: 0, feitas: 0 };

  res.json({
    clinica,
    ate: dias14.at(-1)?.data || null,
    totais: {
      pacientes: lista.length,
      planos_ativos: lista.reduce((s, p) => s + p.planos_ativos, 0),
      adesao_media_7d: pct(fei7, esp7),
      concluidas_hoje: hoje.feitas,
      esperadas_hoje: hoje.esperado,
    },
    por_paciente: lista.map(({ id, nome, adesao, esperado }) => ({ id, nome, adesao, esperado })),
    evolucao: dias14.map(({ data, adesao }) => ({ data, adesao })),
    atencao: lista.filter((p) => p.planos_ativos > 0 && p.adesao < 50).sort((a, b) => a.adesao - b.adesao).slice(0, 5),
    recentes: [...lista].sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 4),
  });
});

// ---------- Pacientes ----------
r.get('/pacientes', async (req, res) => {
  const clinicaId = req.usuario.id;
  const [[{ codigo }]] = await pool.query('SELECT codigo FROM Clinicas WHERE id = ?', [clinicaId]);
  const [pacientes] = await pool.query(
    `SELECT id, nome, email, telefone, tipo_pele, conta_vinculada FROM Pacientes WHERE clinica_id = ? ORDER BY nome`,
    [clinicaId]
  );
  const [serie, ativos] = await Promise.all([serieDiaria({ clinicaId, dias: 7 }), planosAtivos(clinicaId)]);
  const soma = somarPorPaciente(serie);
  res.json({
    codigo,
    pacientes: pacientes.map((p) => {
      const t = soma.get(p.id) || { esperado: 0, feitas: 0 };
      return { ...p, conta_vinculada: Boolean(p.conta_vinculada), planos_ativos: ativos.get(p.id)?.n || 0, adesao: pct(t.feitas, t.esperado) };
    }),
  });
});

r.post('/pacientes', async (req, res) => {
  const b = req.body || {};
  if (!texto(b.nome)) return res.status(400).json({ erro: 'Informe o nome do paciente.' });
  if (!emailOk(b.email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (b.data_nascimento && !dataOk(b.data_nascimento)) return res.status(400).json({ erro: 'Data de nascimento inválida.' });
  const email = b.email.trim().toLowerCase();
  const pele = TIPOS_PELE.includes(b.tipo_pele) ? b.tipo_pele : null;
  const clinicaId = req.usuario.id;

  const [[ex]] = await pool.query('SELECT id, clinica_id FROM Pacientes WHERE email = ?', [email]);
  if (ex) {
    if (ex.clinica_id === clinicaId) return res.status(409).json({ erro: 'Este paciente já está na sua clínica.' });
    if (ex.clinica_id) return res.status(409).json({ erro: 'Este e-mail já pertence a outra clínica.' });
    // o paciente já tinha criado a conta sozinho: vincula pelo e-mail
    await pool.query(
      `UPDATE Pacientes SET clinica_id = ?, telefone = COALESCE(?, telefone), data_nascimento = COALESCE(?, data_nascimento),
              tipo_pele = COALESCE(?, tipo_pele), observacoes = COALESCE(?, observacoes) WHERE id = ?`,
      [clinicaId, limpo(b.telefone), b.data_nascimento || null, pele, limpo(b.observacoes), ex.id]
    );
    return res.json({ id: ex.id, vinculado: true });
  }
  const [ins] = await pool.query(
    `INSERT INTO Pacientes (clinica_id, nome, email, telefone, data_nascimento, tipo_pele, observacoes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [clinicaId, b.nome.trim(), email, limpo(b.telefone), b.data_nascimento || null, pele, limpo(b.observacoes)]
  );
  res.status(201).json({ id: ins.insertId, vinculado: false });
});

// Ficha do paciente
r.get('/pacientes/:id', async (req, res) => {
  const [[p]] = await pool.query(
    `SELECT id, nome, email, telefone, data_nascimento, tipo_pele, observacoes, conta_vinculada
       FROM Pacientes WHERE id = ? AND clinica_id = ?`,
    [Number(req.params.id), req.usuario.id]
  );
  if (!p) return res.status(404).json({ erro: 'Paciente não encontrado.' });
  const [evolucao, planos] = await Promise.all([
    resumoEvolucao(p.id),
    planosComRotinas('pl.paciente_id = ? AND pl.clinica_id = ?', [p.id, req.usuario.id]),
  ]);
  res.json({ paciente: { ...p, conta_vinculada: Boolean(p.conta_vinculada) }, evolucao, planos });
});

// ---------- Planos ----------
r.post('/pacientes/:id/planos', async (req, res) => {
  const { titulo, objetivo, descricao, data_inicio, data_fim, rotinas } = req.body || {};
  if (!texto(titulo)) return res.status(400).json({ erro: 'Informe o título do plano.' });
  if (data_inicio && !dataOk(data_inicio)) return res.status(400).json({ erro: 'Data de início inválida.' });
  if (data_fim && !dataOk(data_fim)) return res.status(400).json({ erro: 'Data de término inválida.' });
  if (data_inicio && data_fim && data_fim < data_inicio) return res.status(400).json({ erro: 'O término deve ser depois do início.' });
  if (!Array.isArray(rotinas) || !rotinas.length) return res.status(400).json({ erro: 'Adicione ao menos uma rotina.' });
  if (!rotinas.every((x) => texto(x?.titulo) && horaOk(x?.horario)))
    return res.status(400).json({ erro: 'Cada rotina precisa de nome e horário (HH:MM).' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[pac]] = await conn.query('SELECT id FROM Pacientes WHERE id = ? AND clinica_id = ?', [
      Number(req.params.id), req.usuario.id,
    ]);
    if (!pac) {
      await conn.rollback();
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }
    // o novo plano substitui o anterior
    await conn.query(
      `UPDATE Planos SET ativo = 0, data_fim = LEAST(COALESCE(data_fim, CURDATE()), CURDATE() - INTERVAL 1 DAY)
        WHERE paciente_id = ? AND ativo = 1`,
      [pac.id]
    );
    const [ins] = await conn.query(
      `INSERT INTO Planos (clinica_id, paciente_id, titulo, objetivo, descricao, data_inicio, data_fim)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, CURDATE()), ?)`,
      [req.usuario.id, pac.id, titulo.trim(), limpo(objetivo), limpo(descricao), data_inicio || null, data_fim || null]
    );
    await conn.query('INSERT INTO Rotinas (plano_id, titulo, produto, instrucoes, horario) VALUES ?', [
      rotinas.map((x) => [ins.insertId, x.titulo.trim(), limpo(x.produto), limpo(x.instrucoes), x.horario + ':00']),
    ]);
    await conn.commit();
    res.status(201).json({ id: ins.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export default r;
