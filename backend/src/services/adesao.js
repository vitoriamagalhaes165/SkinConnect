import { pool } from '../db.js';

export const TIPOS_PELE = ['normal', 'seca', 'oleosa', 'mista', 'sensivel'];
export const periodoDe = (horario) => {
  const h = Number(horario.slice(0, 2));
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
};
export const pct = (feitas, esperado) => (esperado ? Math.min(100, Math.round((feitas * 100) / esperado)) : 0);

/**
 * Série diária (esperado x feito) por paciente nos últimos `dias` dias, incluindo hoje.
 * Esperado no dia = nº de rotinas dos planos vigentes naquele dia. Precisa de MySQL 8 (CTE).
 */
export async function serieDiaria({ clinicaId, pacienteId, dias }) {
  const where = [];
  const params = [dias - 1];
  if (clinicaId) { where.push('pa.clinica_id = ?'); params.push(clinicaId); }
  if (pacienteId) { where.push('pa.id = ?'); params.push(pacienteId); }
  if (!where.length) throw new Error('serieDiaria exige clinicaId ou pacienteId');

  const [rows] = await pool.query(
    `WITH RECURSIVE dias AS (
       SELECT CURDATE() - INTERVAL ? DAY AS d
       UNION ALL
       SELECT d + INTERVAL 1 DAY FROM dias WHERE d < CURDATE()
     )
     SELECT pa.id AS paciente_id, dias.d AS data,
            (SELECT COUNT(*) FROM Rotinas r JOIN Planos pl ON pl.id = r.plano_id
              WHERE pl.paciente_id = pa.id AND pl.data_inicio <= dias.d
                AND (pl.data_fim IS NULL OR pl.data_fim >= dias.d)) AS esperado,
            (SELECT COUNT(*) FROM Execucoes e WHERE e.paciente_id = pa.id AND e.data = dias.d) AS feitas
       FROM Pacientes pa CROSS JOIN dias
      WHERE ${where.join(' AND ')}
      ORDER BY dias.d`,
    params
  );
  return rows.map((r) => ({ paciente_id: r.paciente_id, data: r.data, esperado: Number(r.esperado), feitas: Number(r.feitas) }));
}

export function somarPorPaciente(serie) {
  const m = new Map();
  for (const r of serie) {
    const t = m.get(r.paciente_id) || { esperado: 0, feitas: 0 };
    t.esperado += r.esperado;
    t.feitas += r.feitas;
    m.set(r.paciente_id, t);
  }
  return m;
}

export function somarPorDia(serie) {
  const m = new Map();
  for (const r of serie) {
    const t = m.get(r.data) || { data: r.data, esperado: 0, feitas: 0 };
    t.esperado += r.esperado;
    t.feitas += r.feitas;
    m.set(r.data, t);
  }
  return [...m.values()].map((t) => ({ ...t, adesao: t.esperado ? pct(t.feitas, t.esperado) : null }));
}

/** Dias seguidos com 100% (hoje só conta se já estiver completo). */
export function diasSeguidos(dias) {
  let n = 0;
  for (let i = dias.length - 1; i >= 0; i--) {
    const d = dias[i];
    if (d.esperado > 0 && d.feitas >= d.esperado) n++;
    else if (i === dias.length - 1) continue;
    else break;
  }
  return n;
}

/** Plano vigente de cada paciente da clínica: Map<paciente_id, {n, titulo, rotinas}> */
export async function planosAtivos(clinicaId) {
  const [rows] = await pool.query(
    `SELECT pl.paciente_id, pl.titulo, COUNT(r.id) AS rotinas
       FROM Planos pl LEFT JOIN Rotinas r ON r.plano_id = pl.id
      WHERE pl.clinica_id = ? AND pl.ativo = 1 AND pl.data_inicio <= CURDATE()
        AND (pl.data_fim IS NULL OR pl.data_fim >= CURDATE())
      GROUP BY pl.id ORDER BY pl.id`,
    [clinicaId]
  );
  const m = new Map();
  for (const r of rows) {
    const x = m.get(r.paciente_id) || { n: 0, titulo: null, rotinas: 0 };
    x.n += 1; x.titulo = r.titulo; x.rotinas = Number(r.rotinas);
    m.set(r.paciente_id, x);
  }
  return m;
}

export async function planosComRotinas(where, params) {
  const [planos] = await pool.query(
    `SELECT pl.id, pl.paciente_id, pl.titulo, pl.objetivo, pl.descricao, pl.data_inicio, pl.data_fim, pl.ativo
       FROM Planos pl WHERE ${where} ORDER BY pl.ativo DESC, pl.id DESC`,
    params
  );
  if (planos.length) {
    const [rot] = await pool.query(
      `SELECT id, plano_id, titulo, produto, instrucoes, TIME_FORMAT(horario, '%H:%i') AS horario
         FROM Rotinas WHERE plano_id IN (?) ORDER BY horario, id`,
      [planos.map((p) => p.id)]
    );
    for (const p of planos) {
      p.ativo = Boolean(p.ativo);
      p.rotinas = rot.filter((x) => x.plano_id === p.id).map((x) => ({ ...x, periodo: periodoDe(x.horario) }));
    }
  }
  return planos;
}

export async function fotosPaciente(pacienteId) {
  const [rows] = await pool.query(
    `SELECT id, CONCAT('/uploads/', caminho) AS url, descricao, tipo, criado_em
       FROM Fotos WHERE paciente_id = ? ORDER BY criado_em DESC`,
    [pacienteId]
  );
  return rows;
}

/** Dados da tela "Evolução" (paciente) e da ficha (clínica). */
export async function resumoEvolucao(pacienteId) {
  const [serie60, fotos] = await Promise.all([serieDiaria({ pacienteId, dias: 60 }), fotosPaciente(pacienteId)]);
  const dias60 = somarPorDia(serie60);
  const dias30 = dias60.slice(-30);
  const esperado = dias30.reduce((s, d) => s + d.esperado, 0);
  const concluidas = dias30.reduce((s, d) => s + d.feitas, 0);
  return {
    adesao_30: pct(concluidas, esperado),
    concluidas,
    dias_seguidos: diasSeguidos(dias60),
    dias: dias30.map(({ data, adesao }) => ({ data, adesao })),
    fotos,
  };
}
