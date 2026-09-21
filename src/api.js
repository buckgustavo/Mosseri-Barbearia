// Cliente da API de agendamento. Preco, expediente e horario livre sao decisao
// do backend: a tela so desenha o que ele responde.
//
// Sem VITE_API_URL as chamadas saem na mesma origem, que em dev cai no proxy do
// vite (veja vite.config.js). No GitHub Pages o site e estatico e a API mora em
// outro host, entao o build precisa da variavel.
const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

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

  servicos: (barbeiro) => pedir(`/api/servicos?${query({ barbeiro })}`),

  expediente: () => pedir("/api/expediente"),

  disponibilidade: ({ barbeiro, servico, de, dias = 7 }) =>
    pedir(`/api/disponibilidade?${query({ barbeiro, servico, de, dias })}`),

  // O par codigo+telefone e a unica chave da reserva: o codigo sozinho e curto
  // demais. Vem digitado pelo cliente, entao vai codificado na URL.
  consultar: (codigo, telefone) =>
    pedir(`/api/agendamentos/${encodeURIComponent(codigo.trim())}?${query({ telefone })}`),

  agendar: (reserva) =>
    pedir("/api/agendamentos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reserva),
    }),

  cancelar: (codigo, telefone) =>
    pedir(`/api/agendamentos/${encodeURIComponent(codigo.trim())}?${query({ telefone })}`, {
      method: "DELETE",
    }),
};
