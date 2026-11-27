const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const fileUrl = (caminho) => `${BASE}${caminho}`;

async function request(path, { method = 'GET', body, form } = {}) {
  const token = localStorage.getItem('sc_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_usuario');
      window.location.href = '/';
    }
    const dados = await res.json().catch(() => ({}));
    throw new Error(dados.erro || 'Algo deu errado. Tente novamente.');
  }
  return res;
}

export const api = {
  get: async (p) => (await request(p)).json(),
  post: async (p, body) => (await request(p, { method: 'POST', body })).json(),
  upload: async (p, form) => (await request(p, { method: 'POST', form })).json(),
  baixar: async (p, nomeArquivo) => {
    const blob = await (await request(p)).blob();
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: nomeArquivo }).click();
    URL.revokeObjectURL(url);
  },
};
