# SkinConnect

Plataforma em que a **clínica** cria planos de cuidados com a pele e o **paciente** cumpre as rotinas diárias, envia fotos e acompanha a evolução.

- **Backend:** Node.js 18+, Express 5, MySQL 8+, JWT, bcrypt, multer, pdfkit, exceljs
- **Frontend:** React 18 (hooks), React Router 6, Chart.js, TailwindCSS, lucide-react (Vite)

## Como rodar

```bash
# 1) Banco (se já criou a versão anterior: DROP DATABASE skinconnect; antes)
mysql -u root -p < database/schema.sql

# 2) API
cd backend
cp .env.example .env        # ajuste DB_* e JWT_SECRET
npm install
npm run dev                 # http://localhost:4000

# 3) Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Telas

| Perfil | Telas |
|---|---|
| Público | Entrar (escolha Clínica/Paciente), Criar conta, Esqueci minha senha, Redefinir senha |
| Clínica | **Painel** (indicadores, adesão por paciente, evolução 14 dias, "Precisam de atenção", recentes) · **Pacientes** (busca, novo paciente, código de convite) · **Ficha do paciente** (evolução, fotos, planos, novo plano) · **Relatórios** (filtros, PDF e Excel) |
| Paciente | **Meu dia** (checklist por período, botão Concluir, sino com alertas) · **Meu plano** · **Evolução** (gráfico, sequência de dias, upload de foto com preview, histórico) |

## Fluxo para testar

1. Em **Criar conta**, cadastre a clínica.
2. Em **Pacientes → Novo paciente**, cadastre a ficha (nome e e-mail). A conta do paciente **se vincula automaticamente** quando ele criar a conta com o mesmo e-mail, ou pelo link de convite (`Copiar link de convite`).
3. Abra a ficha e clique em **Novo plano**: título, objetivo, datas e rotinas (horário, nome, produto, instruções). Novo plano encerra o anterior.
4. Entre como paciente: em **Meu dia**, conclua as rotinas. No horário de cada uma, o sino e um aviso aparecem.
5. Em **Evolução**, envie fotos. A clínica vê tudo na ficha e em **Relatórios**.

## Configurações opcionais

- **Login com Google:** crie um OAuth Client ID (aplicativo Web, origem `http://localhost:5173`) e preencha `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend). Sem isso, o botão aparece mas avisa que não está configurado.
- **Recuperação de senha:** preencha `SMTP_*` e `APP_URL` no backend. Sem SMTP, o link de redefinição é impresso no console do servidor (útil em desenvolvimento).

## Regras de negócio

- **Adesão** = rotinas concluídas ÷ esperadas, dia a dia (esperado = rotinas dos planos vigentes naquele dia). Janelas: 7 dias (painel), 14 (evolução da clínica), 30 (paciente), 7/30/90 (relatórios).
- **Período** (manhã/tarde/noite) vem do horário: antes de 12h, 12h–17h59, a partir de 18h.
- **Precisam de atenção:** pacientes com plano ativo e adesão abaixo de 50% nos últimos 7 dias.
- **Dias seguidos 100%:** sequência de dias com todas as rotinas feitas (o dia de hoje só conta quando completo).
- Cada rotina só pode ser concluída uma vez por dia (índice único em `Execucoes`).
- Fuso das datas do servidor: `DB_TIMEZONE` (padrão `-03:00`).

## Segurança

- Senhas com bcrypt; JWT de 8 h; cada rota exige o perfil correto e filtra pelo `id` do token. A clínica só acessa seus pacientes; o paciente só conclui rotinas dos próprios planos.
- Recuperação de senha: token aleatório guardado só como hash SHA-256, validade de 1 h, uso único; a resposta é a mesma exista ou não a conta.
- Upload: JPG/PNG/WebP, 5 MB, nome aleatório (UUID). As fotos são servidas em `/uploads` por URL não adivinhável, sem login; para sigilo total, sirva-as por rota autenticada ou storage com URL assinada.
- **Atenção à vinculação por e-mail:** quem criar conta com o e-mail de uma ficha ainda não vinculada assume a ficha. Em produção, exija verificação de e-mail (ou use o login com Google, que já vem verificado) antes de liberar os dados.
- Em produção: HTTPS, `JWT_SECRET` longo, `CORS_ORIGIN` restrito e limite de tentativas de login (ex.: `express-rate-limit`).

## API

Base: `http://localhost:4000/api` · Autenticação: `Authorization: Bearer <token>` · Erros: `{ "erro": "mensagem" }`

### Público

| Método | Rota | Corpo |
|---|---|---|
| POST | `/auth/clinica/register` | `responsavel, nome, email, senha, telefone?, cidade?, especialidade?` |
| POST | `/auth/clinica/login` | `email, senha` |
| POST | `/auth/paciente/register` | `nome, email, senha, telefone?, data_nascimento?, tipo_pele?, codigo_clinica?` |
| POST | `/auth/paciente/login` | `email, senha` |
| POST | `/auth/google` | `credential, perfil` (`clinica` ou `paciente`) |
| POST | `/auth/esqueci-senha` | `email, perfil` |
| POST | `/auth/redefinir-senha` | `token, perfil, senha` |

Login e cadastro respondem `{ token, usuario }`. `tipo_pele`: `normal, seca, oleosa, mista, sensivel`.

### Clínica (perfil `clinica`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/clinica/dashboard` | Indicadores, adesão por paciente (7 dias), evolução (14 dias), atenção, recentes |
| GET | `/clinica/pacientes` | `{ codigo, pacientes[] }` com adesão, planos ativos e `conta_vinculada` |
| POST | `/clinica/pacientes` | `nome, email, telefone?, data_nascimento?, tipo_pele?, observacoes?` (vincula se o e-mail já tiver conta sem clínica) |
| GET | `/clinica/pacientes/:id` | Ficha: paciente, evolução (30 dias, fotos) e planos com rotinas |
| POST | `/clinica/pacientes/:id/planos` | `titulo, objetivo?, descricao?, data_inicio?, data_fim?, rotinas: [{ titulo, horario: "HH:MM", produto?, instrucoes? }]` |
| GET | `/clinica/relatorios/adesao` | JSON; query `dias` (7, 30, 90) e `paciente_id` |
| GET | `/clinica/relatorios/adesao.pdf` | Mesmos filtros, em PDF |
| GET | `/clinica/relatorios/adesao.xlsx` | Mesmos filtros, em Excel |

### Paciente (perfil `paciente`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/paciente/hoje` | `{ nome, clinica, plano, rotinas[] }` com `concluida` e `periodo` |
| POST | `/paciente/rotinas/:id/concluir` | Marca a rotina como feita hoje |
| GET | `/paciente/plano` | `{ clinica, plano }` com rotinas |
| GET | `/paciente/evolucao` | `{ adesao_30, concluidas, dias_seguidos, dias[], fotos[] }` |
| POST | `/paciente/fotos` | `multipart/form-data`: `foto`, `descricao?`, `tipo?` (`antes, evolucao, depois`) |

Arquivos de foto: `GET /uploads/<arquivo>`. Saúde da API: `GET /api/saude`.
