export const dataExtenso = () =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
export const dataBR = (s) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '');
export const diaMes = (s) => s.slice(8, 10) + '/' + s.slice(5, 7);
export const primeiroNome = (n) => (n || '').trim().split(/\s+/)[0];
export const PELES = { normal: 'Normal', seca: 'Seca', oleosa: 'Oleosa', mista: 'Mista', sensivel: 'Sensível' };
export const PERIODOS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
export const TIPOS_FOTO = { antes: 'Antes', evolucao: 'Evolução', depois: 'Depois' };
