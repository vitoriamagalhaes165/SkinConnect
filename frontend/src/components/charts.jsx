import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { diaMes } from '../formatos.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler);
ChartJS.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
ChartJS.defaults.color = '#5E7772';

const VERDE = '#2A6258';
const pct = { min: 0, max: 100, ticks: { stepSize: 25, callback: (v) => `${v}%` }, grid: { color: '#E6E8E4' }, border: { display: false } };

/** Barras horizontais: adesão (%) por paciente */
export function AdesaoPorPaciente({ pacientes }) {
  return (
    <div style={{ height: Math.max(220, pacientes.length * 44 + 60) }}>
      <Bar
        data={{
          labels: pacientes.map((p) => p.nome),
          datasets: [{ data: pacientes.map((p) => p.adesao), backgroundColor: VERDE, borderRadius: 8, barThickness: 22 }],
        }}
        options={{
          indexAxis: 'y', maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.x}% de adesão` } } },
          scales: { x: pct, y: { grid: { display: false }, border: { display: false } } },
        }}
      />
    </div>
  );
}

/** Linha suave com preenchimento: pontos = [{ data, adesao }] */
export function LinhaAdesao({ pontos, altura = 300 }) {
  return (
    <div style={{ height: altura }}>
      <Line
        data={{
          labels: pontos.map((p) => diaMes(p.data)),
          datasets: [{
            data: pontos.map((p) => p.adesao),
            borderColor: VERDE, borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true,
            backgroundColor: (ctx) => {
              const { chart } = ctx;
              if (!chart.chartArea) return 'transparent';
              const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
              g.addColorStop(0, 'rgba(42,98,88,.22)');
              g.addColorStop(1, 'rgba(42,98,88,0)');
              return g;
            },
          }],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y}%` } } },
          scales: { y: pct, x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 8 } } },
        }}
      />
    </div>
  );
}
