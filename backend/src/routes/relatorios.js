import { Router } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { pool } from '../db.js';
import { exigirPerfil } from '../middleware/auth.js';
import { pct, serieDiaria, somarPorPaciente, planosAtivos } from '../services/adesao.js';

const r = Router();
r.use(exigirPerfil('clinica'));

const PELE = { normal: 'Normal', seca: 'Seca', oleosa: 'Oleosa', mista: 'Mista', sensivel: 'Sensível' };
const dataBR = (s) => s.split('-').reverse().join('/');

async function montar(req) {
  const dias = [7, 30, 90].includes(Number(req.query.dias)) ? Number(req.query.dias) : 30;
  const pacienteId = Number(req.query.paciente_id) || null;
  const clinicaId = req.usuario.id;

  const [pacs] = await pool.query(
    `SELECT id, nome, tipo_pele FROM Pacientes WHERE clinica_id = ? ${pacienteId ? 'AND id = ?' : ''} ORDER BY nome`,
    pacienteId ? [clinicaId, pacienteId] : [clinicaId]
  );
  if (!pacs.length) return { periodo: null, linhas: [] };

  const [serie, ativos] = await Promise.all([serieDiaria({ clinicaId, pacienteId, dias }), planosAtivos(clinicaId)]);
  const soma = somarPorPaciente(serie);
  const linhas = pacs.map((p) => {
    const t = soma.get(p.id) || { esperado: 0, feitas: 0 };
    const plano = ativos.get(p.id);
    return {
      paciente_id: p.id, nome: p.nome, plano: plano?.titulo || null,
      tipo_pele: PELE[p.tipo_pele] || null, rotinas_dia: plano?.rotinas || 0,
      esperado: t.esperado, concluido: t.feitas, adesao: t.esperado ? pct(t.feitas, t.esperado) : null,
    };
  });
  return { periodo: { inicio: serie[0].data, fim: serie.at(-1).data }, linhas };
}

r.get('/adesao', async (req, res) => res.json(await montar(req)));

r.get('/adesao.pdf', async (req, res) => {
  const [[clinica]] = await pool.query('SELECT nome FROM Clinicas WHERE id = ?', [req.usuario.id]);
  const { periodo, linhas } = await montar(req);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="adesao-skinconnect.pdf"');
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#14231F').text('Relatório de adesão — SkinConnect');
  doc.font('Helvetica').fontSize(10).fillColor('#5E7772')
    .text(`${clinica.nome}${periodo ? ` · período ${dataBR(periodo.inicio)} a ${dataBR(periodo.fim)}` : ''}`);
  doc.moveDown(1.2);

  const col = [
    ['Paciente', 40, 190], ['Plano', 235, 170], ['Tipo de pele', 410, 80],
    ['Rotinas/dia', 495, 65], ['Esperado', 565, 60], ['Concluído', 630, 65], ['Adesão', 700, 60],
  ];
  const cab = (y) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#14231F');
    col.forEach(([t, x, w]) => doc.text(t, x, y, { width: w }));
    doc.moveTo(40, y + 15).lineTo(760, y + 15).strokeColor('#D5DAD7').stroke();
    doc.font('Helvetica');
  };
  let y = doc.y;
  cab(y); y += 24;
  for (const l of linhas) {
    if (y > 520) { doc.addPage(); y = 40; cab(y); y += 24; }
    const v = [l.nome, l.plano || '—', l.tipo_pele || '—', String(l.rotinas_dia), String(l.esperado), String(l.concluido), l.adesao == null ? '—' : `${l.adesao}%`];
    doc.fontSize(10).fillColor('#14231F');
    col.forEach(([, x, w], i) => doc.text(v[i], x, y, { width: w, lineBreak: false, ellipsis: true }));
    y += 20;
  }
  if (!linhas.length) doc.text('Nenhum paciente na clínica.', 40, y);
  doc.end();
});

r.get('/adesao.xlsx', async (req, res) => {
  const { linhas } = await montar(req);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Adesão');
  ws.columns = [
    { header: 'Paciente', key: 'nome', width: 32 },
    { header: 'Plano', key: 'plano', width: 28 },
    { header: 'Tipo de pele', key: 'tipo_pele', width: 14 },
    { header: 'Rotinas/dia', key: 'rotinas_dia', width: 13 },
    { header: 'Esperado', key: 'esperado', width: 11 },
    { header: 'Concluído', key: 'concluido', width: 11 },
    { header: 'Adesão (%)', key: 'adesao', width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  linhas.forEach((l) => ws.addRow(l));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="adesao-skinconnect.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

export default r;
