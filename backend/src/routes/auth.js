import 'dotenv/config';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db.js';
import { assinarToken } from '../middleware/auth.js';
import { enviarEmail } from '../services/email.js';
import { TIPOS_PELE } from '../services/adesao.js';

const r = Router();
const google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const limpo = (v) => (texto(v) ? v.trim() : null);
const emailOk = (v) => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v.trim());
const normEmail = (v) => String(v || '').trim().toLowerCase();
const dataOk = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const senhaOk = (v) => typeof v === 'string' && v.length >= 8;
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const gerarCodigo = () => Array.from(crypto.randomBytes(8), (b) => ALFABETO[b % ALFABETO.length]).join('');
const TABELA = { clinica: 'Clinicas', paciente: 'Pacientes' };

const sessao = (perfil, u) => ({
  token: assinarToken({ id: u.id, perfil }),
  usuario: { id: u.id, nome: u.nome, perfil },
});

async function criarClinica({ nome, responsavel, telefone, cidade, especialidade, email, senhaHash }) {
  const [ins] = await pool.query(
    `INSERT INTO Clinicas (nome, responsavel, telefone, cidade, especialidade, email, senha_hash, codigo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, responsavel, telefone, cidade, especialidade, email, senhaHash, gerarCodigo()]
  );
  return { id: ins.insertId, nome };
}

// ---------- Clínica ----------
r.post('/clinica/register', async (req, res) => {
  const b = req.body || {};
  if (!texto(b.responsavel)) return res.status(400).json({ erro: 'Informe seu nome.' });
  if (!texto(b.nome)) return res.status(400).json({ erro: 'Informe o nome da clínica.' });
  if (!emailOk(b.email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (!senhaOk(b.senha)) return res.status(400).json({ erro: 'A senha deve ter pelo menos 8 caracteres.' });
  try {
    const c = await criarClinica({
      nome: b.nome.trim(), responsavel: b.responsavel.trim(), telefone: limpo(b.telefone),
      cidade: limpo(b.cidade), especialidade: limpo(b.especialidade),
      email: normEmail(b.email), senhaHash: await bcrypt.hash(b.senha, 10),
    });
    res.status(201).json(sessao('clinica', c));
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    throw e;
  }
});

r.post('/clinica/login', async (req, res) => {
  const [[c]] = await pool.query('SELECT id, nome, senha_hash FROM Clinicas WHERE email = ?', [normEmail(req.body?.email)]);
  if (!c?.senha_hash || !(await bcrypt.compare(String(req.body?.senha || ''), c.senha_hash)))
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  res.json(sessao('clinica', c));
});

// ---------- Paciente ----------
r.post('/paciente/register', async (req, res) => {
  const b = req.body || {};
  if (!texto(b.nome)) return res.status(400).json({ erro: 'Informe seu nome.' });
  if (!emailOk(b.email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (!senhaOk(b.senha)) return res.status(400).json({ erro: 'A senha deve ter pelo menos 8 caracteres.' });
  if (b.data_nascimento && !dataOk(b.data_nascimento)) return res.status(400).json({ erro: 'Data de nascimento inválida.' });

  const email = normEmail(b.email);
  const telefone = limpo(b.telefone);
  const nascimento = b.data_nascimento || null;
  const pele = TIPOS_PELE.includes(b.tipo_pele) ? b.tipo_pele : null;
  const hash = await bcrypt.hash(b.senha, 10);

  let clinicaId = null;
  if (texto(b.codigo_clinica)) {
    const [[c]] = await pool.query('SELECT id FROM Clinicas WHERE codigo = ?', [b.codigo_clinica.trim().toUpperCase()]);
    if (!c) return res.status(400).json({ erro: 'Código de convite não encontrado.' });
    clinicaId = c.id;
  }

  const [[ex]] = await pool.query('SELECT id, conta_vinculada FROM Pacientes WHERE email = ?', [email]);
  if (ex) {
    if (ex.conta_vinculada) return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    // ficha criada pela clínica: a conta se vincula automaticamente pelo e-mail
    await pool.query(
      `UPDATE Pacientes SET senha_hash = ?, conta_vinculada = 1, nome = ?, telefone = COALESCE(?, telefone),
              data_nascimento = COALESCE(?, data_nascimento), tipo_pele = COALESCE(?, tipo_pele),
              clinica_id = COALESCE(clinica_id, ?) WHERE id = ?`,
      [hash, b.nome.trim(), telefone, nascimento, pele, clinicaId, ex.id]
    );
    return res.status(201).json(sessao('paciente', { id: ex.id, nome: b.nome.trim() }));
  }
  const [ins] = await pool.query(
    `INSERT INTO Pacientes (clinica_id, nome, email, telefone, data_nascimento, tipo_pele, senha_hash, conta_vinculada)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [clinicaId, b.nome.trim(), email, telefone, nascimento, pele, hash]
  );
  res.status(201).json(sessao('paciente', { id: ins.insertId, nome: b.nome.trim() }));
});

r.post('/paciente/login', async (req, res) => {
  const [[p]] = await pool.query('SELECT id, nome, senha_hash FROM Pacientes WHERE email = ?', [normEmail(req.body?.email)]);
  if (!p?.senha_hash || !(await bcrypt.compare(String(req.body?.senha || ''), p.senha_hash)))
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  res.json(sessao('paciente', p));
});

// ---------- Google ----------
r.post('/google', async (req, res) => {
  const { credential, perfil } = req.body || {};
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ erro: 'Login com Google não está configurado.' });
  if (!TABELA[perfil] || !texto(credential)) return res.status(400).json({ erro: 'Requisição inválida.' });

  let dados;
  try {
    const ticket = await google.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    dados = ticket.getPayload();
  } catch {
    return res.status(401).json({ erro: 'Não foi possível validar o login do Google.' });
  }
  if (!dados?.email || !dados.email_verified) return res.status(401).json({ erro: 'E-mail do Google não verificado.' });
  const email = normEmail(dados.email);
  const nome = dados.name || email.split('@')[0];

  if (perfil === 'clinica') {
    const [[c]] = await pool.query('SELECT id, nome FROM Clinicas WHERE email = ?', [email]);
    return res.json(sessao('clinica', c || (await criarClinica({ nome, responsavel: nome, email, senhaHash: null }))));
  }
  const [[p]] = await pool.query('SELECT id, nome FROM Pacientes WHERE email = ?', [email]);
  if (p) {
    await pool.query('UPDATE Pacientes SET conta_vinculada = 1 WHERE id = ?', [p.id]);
    return res.json(sessao('paciente', p));
  }
  const [ins] = await pool.query('INSERT INTO Pacientes (nome, email, conta_vinculada) VALUES (?, ?, 1)', [nome, email]);
  res.json(sessao('paciente', { id: ins.insertId, nome }));
});

// ---------- Recuperação de senha ----------
r.post('/esqueci-senha', async (req, res) => {
  const { email, perfil } = req.body || {};
  if (!TABELA[perfil] || !emailOk(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  const [[u]] = await pool.query(`SELECT id FROM ${TABELA[perfil]} WHERE email = ?`, [normEmail(email)]);
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
      'INSERT INTO RedefinicoesSenha (perfil, usuario_id, token_hash, expira_em) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [perfil, u.id, hash]
    );
    const link = `${process.env.APP_URL || 'http://localhost:5173'}/redefinir-senha?perfil=${perfil}&token=${token}`;
    await enviarEmail({
      para: normEmail(email),
      assunto: 'Redefinir sua senha do SkinConnect',
      texto: `Use o link abaixo para criar uma nova senha. Ele vale por 1 hora.\n\n${link}\n\nSe você não pediu isso, ignore este e-mail.`,
    });
  }
  // mesma resposta exista ou não a conta (não revela quem está cadastrado)
  res.json({ ok: true });
});

r.post('/redefinir-senha', async (req, res) => {
  const { token, perfil, senha } = req.body || {};
  if (!TABELA[perfil] || !texto(token)) return res.status(400).json({ erro: 'Link inválido.' });
  if (!senhaOk(senha)) return res.status(400).json({ erro: 'A senha deve ter pelo menos 8 caracteres.' });
  const hashToken = crypto.createHash('sha256').update(token).digest('hex');
  const [[t]] = await pool.query(
    'SELECT id, usuario_id FROM RedefinicoesSenha WHERE token_hash = ? AND perfil = ? AND usado = 0 AND expira_em > NOW()',
    [hashToken, perfil]
  );
  if (!t) return res.status(400).json({ erro: 'Link inválido ou expirado. Peça um novo.' });
  const extra = perfil === 'paciente' ? ', conta_vinculada = 1' : '';
  await pool.query(`UPDATE ${TABELA[perfil]} SET senha_hash = ?${extra} WHERE id = ?`, [await bcrypt.hash(senha, 10), t.usuario_id]);
  await pool.query('UPDATE RedefinicoesSenha SET usado = 1 WHERE id = ?', [t.id]);
  res.json({ ok: true });
});

export default r;
