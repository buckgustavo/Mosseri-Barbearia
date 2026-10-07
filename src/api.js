// Cliente da API de agendamento. Preco, expediente e horario livre sao decisao
// do backend: a tela so desenha o que ele responde.
//
// Sem VITE_API_URL as chamadas saem na mesma origem, que em dev cai no proxy do
// vite (veja vite.config.js). No GitHub Pages o site e estatico e a API mora em
// outro host, entao o build precisa da variavel.
const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// Fotos vem da API como caminho ("/api/fotos/..."): no Pages a API mora em
// outro host, entao o endereco completo leva a BASE na frente.
export const urlDaApi = (caminho) => (caminho ? BASE + caminho : null);

export class ErroApi extends Error {
  constructor(mensagem, codigo, status) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
  }
}

async function pedir(caminho, opcoes) {
  let resposta;
  try {
    resposta = await fetch(BASE + caminho, opcoes);
  } catch {
    throw new ErroApi("Não consegui falar com o servidor. Tente de novo.", "rede", 0);
  }

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      corpo?.mensagem ?? "Algo deu errado por aqui.",
      corpo?.erro ?? "interno",
      resposta.status
    );
  }
  return corpo;
}

const query = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null)
  ).toString();

export const api = {
  barbeiros: () => pedir("/api/barbeiros"),

  produtos: () => pedir("/api/produtos"),

  aparencia: () => pedir("/api/aparencia"),

  servicos: (barbeiro) => pedir(`/api/servicos?${query({ barbeiro })}`),

  expediente: () => pedir("/api/expediente"),

  disponibilidade: ({ barbeiro, servico, de, dias = 7 }) =>
    pedir(`/api/disponibilidade?${query({ barbeiro, servico, de, dias })}`),

  // O par codigo+telefone e a unica chave da reserva: o codigo sozinho e curto
  // demais. Vai no corpo de um POST, nunca na URL -- URL acaba em log de
  // servidor, de proxy e no historico do navegador.
  consultar: (codigo, telefone) =>
    pedir("/api/agendamentos/consulta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ codigo: codigo.trim(), telefone }),
    }),

  agendar: (reserva) =>
    pedir("/api/agendamentos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reserva),
    }),

  cancelar: (codigo, telefone) =>
    pedir("/api/agendamentos/cancelamento", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ codigo: codigo.trim(), telefone }),
    }),
};

// --------------------------------------------------------------- area gerencial
// A barbearia entra com uma senha so e recebe um token de 12h. Ele fica no
// localStorage: cookie nao serve porque no GitHub Pages o site e a API vivem em
// origens diferentes. Token morto (401) e apagado na hora -- a tela volta pro
// login em vez de insistir com credencial que o servidor ja recusou.
const CHAVE_TOKEN = "mosseri:admin";

export const tokenAdmin = {
  ler() {
    try {
      return localStorage.getItem(CHAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(token) {
    try {
      localStorage.setItem(CHAVE_TOKEN, token);
    } catch {
      /* sem storage a sessao vale so enquanto a aba estiver aberta */
    }
  },
  limpar() {
    try {
      localStorage.removeItem(CHAVE_TOKEN);
    } catch {
      /* nada a limpar */
    }
  },
};

let tokenNaMemoria = null;

const corpo = (dados) => ({
  body: JSON.stringify(dados),
  headers: { "content-type": "application/json" },
});

async function pedirAdmin(caminho, opcoes = {}) {
  const token = tokenAdmin.ler() ?? tokenNaMemoria;
  if (!token) throw new ErroApi("Sessão encerrada. Entre de novo.", "nao_autorizado", 401);

  try {
    return await pedir(caminho, {
      ...opcoes,
      headers: { ...opcoes.headers, authorization: `Bearer ${token}` },
    });
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) {
      tokenAdmin.limpar();
      tokenNaMemoria = null;
    }
    throw e;
  }
}

function guardarSessao(sessao) {
  tokenNaMemoria = sessao.token;
  tokenAdmin.guardar(sessao.token);
  return sessao;
}

export const admin = {
  temToken: () => Boolean(tokenAdmin.ler() ?? tokenNaMemoria),

  entrar: async (senha) =>
    guardarSessao(await pedir("/api/admin/sessao", { method: "POST", ...corpo({ senha }) })),

  conferir: () => pedirAdmin("/api/admin/sessao"),

  sair: async () => {
    try {
      await pedirAdmin("/api/admin/sessao", { method: "DELETE" });
    } catch {
      /* token ja podia estar vencido; o que importa e sumir com ele daqui */
    } finally {
      tokenAdmin.limpar();
      tokenNaMemoria = null;
    }
  },

  trocarSenha: async (atual, nova) =>
    guardarSessao(await pedirAdmin("/api/admin/senha", { method: "POST", ...corpo({ atual, nova }) })),

  agenda: (data) => pedirAdmin(`/api/admin/agenda?${query({ data })}`),

  cancelarReserva: (codigo) =>
    pedirAdmin(`/api/admin/agendamentos/${encodeURIComponent(codigo)}`, { method: "DELETE" }),

  barbeiros: () => pedirAdmin("/api/admin/barbeiros"),
  criarBarbeiro: (dados) => pedirAdmin("/api/admin/barbeiros", { method: "POST", ...corpo(dados) }),
  editarBarbeiro: (id, dados) =>
    pedirAdmin(`/api/admin/barbeiros/${encodeURIComponent(id)}`, { method: "PATCH", ...corpo(dados) }),
  removerBarbeiro: (id) =>
    pedirAdmin(`/api/admin/barbeiros/${encodeURIComponent(id)}`, { method: "DELETE" }),
  enviarFotoBarbeiro: (id, imagem) =>
    pedirAdmin(`/api/admin/barbeiros/${encodeURIComponent(id)}/foto`, {
      method: "PUT",
      body: imagem,
      headers: { "content-type": imagem.type || "image/jpeg" },
    }),
  removerFotoBarbeiro: (id) =>
    pedirAdmin(`/api/admin/barbeiros/${encodeURIComponent(id)}/foto`, { method: "DELETE" }),

  servicos: () => pedirAdmin("/api/admin/servicos"),
  criarServico: (dados) => pedirAdmin("/api/admin/servicos", { method: "POST", ...corpo(dados) }),
  editarServico: (id, dados) =>
    pedirAdmin(`/api/admin/servicos/${encodeURIComponent(id)}`, { method: "PATCH", ...corpo(dados) }),
  removerServico: (id) =>
    pedirAdmin(`/api/admin/servicos/${encodeURIComponent(id)}`, { method: "DELETE" }),

  definirPreco: (servico, barbeiro, preco) =>
    pedirAdmin("/api/admin/precos", { method: "PUT", ...corpo({ servico, barbeiro, preco }) }),
  removerPreco: (servico, barbeiro) =>
    pedirAdmin(
      `/api/admin/precos/${encodeURIComponent(servico)}/${encodeURIComponent(barbeiro)}`,
      { method: "DELETE" }
    ),

  expediente: () => pedirAdmin("/api/admin/expediente"),
  salvarExpediente: (semana) =>
    pedirAdmin("/api/admin/expediente", { method: "PUT", ...corpo({ semana }) }),

  produtos: () => pedirAdmin("/api/admin/produtos"),
  criarProduto: (dados) => pedirAdmin("/api/admin/produtos", { method: "POST", ...corpo(dados) }),
  editarProduto: (id, dados) =>
    pedirAdmin(`/api/admin/produtos/${encodeURIComponent(id)}`, { method: "PATCH", ...corpo(dados) }),
  removerProduto: (id) =>
    pedirAdmin(`/api/admin/produtos/${encodeURIComponent(id)}`, { method: "DELETE" }),
  // A imagem vai crua no corpo, com o tipo dela no Content-Type.
  enviarFotoProduto: (id, imagem) =>
    pedirAdmin(`/api/admin/produtos/${encodeURIComponent(id)}/foto`, {
      method: "PUT",
      body: imagem,
      headers: { "content-type": imagem.type || "image/jpeg" },
    }),
  removerFotoProduto: (id) =>
    pedirAdmin(`/api/admin/produtos/${encodeURIComponent(id)}/foto`, { method: "DELETE" }),

  salvarAparencia: (escalaFonte) =>
    pedirAdmin("/api/admin/aparencia", { method: "PUT", ...corpo({ escalaFonte }) }),

  bloqueios: ({ de, dias = 60 } = {}) => pedirAdmin(`/api/admin/bloqueios?${query({ de, dias })}`),
  criarBloqueio: (dados) => pedirAdmin("/api/admin/bloqueios", { method: "POST", ...corpo(dados) }),
  removerBloqueio: (id) => pedirAdmin(`/api/admin/bloqueios/${id}`, { method: "DELETE" }),
};
