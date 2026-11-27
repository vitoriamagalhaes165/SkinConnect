import 'dotenv/config';

export async function enviarEmail({ para, assunto, texto }) {
  const apiKey = process.env.BREVO_API_KEY;
  const remetente = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !remetente) {
    throw new Error('Brevo não configurado.');
  }

  const resposta = await fetch(
    'https://api.brevo.com/v3/smtp/email',
    {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'SkinConnect',
          email: remetente
        },
        to: [{ email: para }],
        subject: assunto,
        textContent: texto
      })
    }
  );

  if (!resposta.ok) {
    throw new Error(`Erro ao enviar e-mail: ${resposta.status}`);
  }

  return await resposta.json();
}