import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ErroApi } from "../api";
import { foto } from "../foto";

// Barbeiros, servicos, precos, expediente e horarios livres vem todos da API.
// Esta tela nao decide nada de agenda: se um horario aparece, e porque o
// backend disse que cabe -- e e ele quem confirma de novo no POST.

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Datas andam como "YYYY-MM-DD", igual ao backend. Ler como UTC de proposito:
// a string ja e a data local, e `new Date("2026-08-24")` sem hora escorrega um
// dia pra tras em fuso negativo.
const comoData = (s) => new Date(`${s}T00:00:00Z`);

function somaDias(s, n) {
  const d = comoData(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const rotuloDia = (s) => {
  const d = comoData(s);
  return { dow: DOW[d.getUTCDay()], dom: d.getUTCDate(), mon: MESES[d.getUTCMonth()] };
};

const rotuloCurto = (s) => {
  const { dow, dom } = rotuloDia(s);
  return `${dow}, ${String(dom).padStart(2, "0")}/${s.slice(5, 7)}`;
};

// Segunda-feira da semana de uma data: o grid do dia sempre abre na segunda,
// como no design.
function segundaDa(data) {
  const d = comoData(data);
  return somaDias(data, -((d.getUTCDay() + 6) % 7));
}

const hojeLocal = () => {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

function faixaDaSemana(dias) {
  if (!dias.length) return "";
  const a = rotuloDia(dias[0].data);
  const b = rotuloDia(dias.at(-1).data);
  return a.mon === b.mon
    ? `${a.dom} a ${b.dom} de ${a.mon}`
    : `${a.dom} de ${a.mon} a ${b.dom} de ${b.mon}`;
}

const soDigitos = (tel) => tel.replace(/\D/g, "");

// A reserva nao chega por e-mail nem WhatsApp: o codigo so existe na tela da
// vez. Guardar o par codigo+telefone devolve a reserva quando o cliente voltar.
// Storage pode estar bloqueado (aba anonima, cookie de terceiro), e ai ele cai
// no formulario de consulta -- que continua funcionando.
const CHAVE_RESERVA = "mosseri:reserva";

function lembrarReserva(codigo, telefone) {
  try {
    localStorage.setItem(CHAVE_RESERVA, JSON.stringify({ codigo, telefone }));
  } catch {
    /* sem storage o codigo segue na tela; e o que da pra prometer */
  }
}

function reservaLembrada() {
  try {
    const bruto = localStorage.getItem(CHAVE_RESERVA);
    const guardada = bruto ? JSON.parse(bruto) : null;
    return guardada?.codigo && guardada?.telefone ? guardada : null;
  } catch {
    return null;
  }
}

function esquecerReserva() {
  try {
    localStorage.removeItem(CHAVE_RESERVA);
  } catch {
    /* nada a limpar */
  }
}

// (16) 99394-4841 enquanto digita. O backend guarda so digito, entao a mascara
// aqui e enfeite -- nao pode travar quem cola o numero de outro jeito.
function mascararTelefone(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const corte = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}

// O codigo sai do backend em maiuscula e sem I, O, 0 e 1. Aqui so limpa o que
// o cliente digita ou cola: minuscula, espaco, hifen.
const normalizarCodigo = (valor) =>
  valor.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 6);

export default function Agendar() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [expediente, setExpediente] = useState([]);
  const [erroInicial, setErroInicial] = useState(null);

  const [barbeiroId, setBarbeiroId] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [servicoId, setServicoId] = useState(null);

  const [semana, setSemana] = useState(0); // 0 = semana corrente
  const [agenda, setAgenda] = useState(null);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);
  const [erroAgenda, setErroAgenda] = useState(null);

  const [dataSel, setDataSel] = useState(null);
  const [horaSel, setHoraSel] = useState(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [reserva, setReserva] = useState(null);

  const [consCodigo, setConsCodigo] = useState("");
  const [consTelefone, setConsTelefone] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState(null);

  const barbeiro = barbeiros.find((b) => b.id === barbeiroId) ?? null;
  const servico = servicos.find((s) => s.id === servicoId) ?? null;

  const inicioSemana = useMemo(
    () => somaDias(segundaDa(hojeLocal()), semana * 7),
    [semana]
  );

  // Catalogo: uma vez so, na montagem.
  useEffect(() => {
    let vivo = true;
    Promise.all([api.barbeiros(), api.expediente()])
      .then(([bs, exp]) => {
        if (!vivo) return;
        setBarbeiros(bs);
        setExpediente(exp);
        setBarbeiroId((atual) => atual ?? bs[0]?.id ?? null);
      })
      .catch((e) => vivo && setErroInicial(e.message));
    return () => { vivo = false; };
  }, []);

  // Voltou ao site depois de reservar: busca a reserva de novo pelo par
  // guardado, porque o status pode ter mudado desde entao. Dia que ja passou e
  // reserva cancelada nao voltam -- seria so um fantasma ocupando a tela.
  useEffect(() => {
    const guardada = reservaLembrada();
    if (!guardada) return;
    let vivo = true;
    api.consultar(guardada.codigo, guardada.telefone)
      .then((r) => {
        if (!vivo) return;
        if (r.status !== "confirmado" || r.data < hojeLocal()) return esquecerReserva();
        setReserva(r);
      })
      .catch((e) => {
        // Reserva que nao existe mais some da memoria; queda de rede nao apaga.
        if (e instanceof ErroApi && e.status === 404) esquecerReserva();
      });
    return () => { vivo = false; };
  }, []);

  // Trocou de barbeiro: o catalogo dele e outro, e o preco tambem.
  useEffect(() => {
    if (!barbeiroId) return;
    let vivo = true;
    api.servicos(barbeiroId)
      .then((lista) => {
        if (!vivo) return;
        setServicos(lista);
        // Se ele nao faz o servico escolhido, cai no primeiro que ele faz.
        setServicoId((atual) =>
          lista.some((s) => s.id === atual) ? atual : lista[0]?.id ?? null
        );
      })
      .catch((e) => vivo && setErroAgenda(e.message));
    return () => { vivo = false; };
  }, [barbeiroId]);

  const carregarAgenda = useCallback(async () => {
    if (!barbeiroId || !servicoId) return;
    setCarregandoAgenda(true);
    setErroAgenda(null);
    try {
      setAgenda(
        await api.disponibilidade({
          barbeiro: barbeiroId,
          servico: servicoId,
          de: inicioSemana,
          dias: 7,
        })
      );
    } catch (e) {
      setAgenda(null);
      setErroAgenda(e.message);
    } finally {
      setCarregandoAgenda(false);
    }
  }, [barbeiroId, servicoId, inicioSemana]);

  useEffect(() => { carregarAgenda(); }, [carregarAgenda]);

  const dias = agenda?.dias ?? [];

  // O dia escolhido tem que continuar existindo e tendo horario depois de cada
  // recarga -- trocar de servico pode esvaziar o dia que estava selecionado.
  const dia =
    dias.find((d) => d.data === dataSel && d.horarios.length) ??
    dias.find((d) => d.horarios.length) ??
    null;

  const horario = dia?.horarios.includes(horaSel) ? horaSel : dia?.horarios[0] ?? null;

  const escolher = (data) => { setDataSel(data); setHoraSel(null); };

  async function confirmar(evento) {
    evento.preventDefault();
    if (!dia || !horario || enviando) return;

    setEnviando(true);
    setErroEnvio(null);
    try {
      const criada = await api.agendar({
        barbeiro: barbeiroId,
        servico: servicoId,
        data: dia.data,
        horario,
        nome: nome.trim(),
        telefone,
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      lembrarReserva(criada.codigo, criada.cliente.telefone);
      setReserva(criada);
    } catch (e) {
      setErroEnvio(e.message);
      // 409 e sempre agenda desatualizada: alguem pegou o horario antes.
      if (e instanceof ErroApi && e.status === 409) carregarAgenda();
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    setEnviando(true);
    setErroEnvio(null);
    try {
      setReserva(await api.cancelar(reserva.codigo, reserva.cliente.telefone));
      esquecerReserva();
      carregarAgenda();
    } catch (e) {
      setErroEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  }

  // Sair do cartao pra marcar outra: a memoria guarda uma reserva so, entao a
  // que estava na tela sai junto -- o cliente ainda tem o codigo anotado e a
  // consulta abaixo traz de volta.
  function novaReserva() {
    setReserva(null);
    setObservacao("");
    setHoraSel(null);
    esquecerReserva();
    carregarAgenda();
  }

  async function consultarReserva(evento) {
    evento.preventDefault();
    if (consultando) return;

    setConsultando(true);
    setErroConsulta(null);
    try {
      const encontrada = await api.consultar(consCodigo, consTelefone);
      if (encontrada.status === "confirmado") {
        lembrarReserva(encontrada.codigo, encontrada.cliente.telefone);
      }
      setReserva(encontrada);
      setErroEnvio(null);
      setConsCodigo("");
      setConsTelefone("");
    } catch (e) {
      setErroConsulta(e.message);
    } finally {
      setConsultando(false);
    }
  }

  const grupos = ["Combos", "Serviços"];
  const telefoneOk = soDigitos(telefone).length >= 10;
  const podeConfirmar = Boolean(horario && nome.trim().length >= 2 && telefoneOk);
  const podeConsultar =
    consCodigo.trim().length === 6 && soDigitos(consTelefone).length >= 10;

  if (erroInicial) {
    return (
      <div className="container estado-vazio">
        <h1>A agenda não carregou.</h1>
        <p className="page-lead">{erroInicial}</p>
        <a className="whatsapp-link" href="https://wa.me/5516993944841" target="_blank" rel="noreferrer">
          Agende no WhatsApp: (16) 99394-4841 <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Agendamento</span>
          <h1>Reserve a sua cadeira.</h1>
          <p className="page-lead">
            Atendimento só por hora marcada. Escolha o barbeiro, o serviço, o
            dia e o horário. A cadeira fica bloqueada no seu nome.
          </p>
        </div>
      </div>

      <div className="container booking-grid">
        <div>
          <div className="booking-step">
            <div className="step-label">1 · Barbeiro</div>
            <div className="barber-picker">
              {barbeiros.map((b) => (
                <button
                  key={b.id}
                  className={`barber-card ${barbeiroId === b.id ? "selected" : ""}`}
                  onClick={() => setBarbeiroId(b.id)}
                  aria-pressed={barbeiroId === b.id}
                  disabled={Boolean(reserva)}
                >
                  <span className="polaroid-foto">
                    <img src={foto(b.foto)} alt={b.nome} />
                  </span>
                  <span className="polaroid-legenda">
                    <span className="barber-name">{b.nome}</span>
                    <span className="barber-desc">{b.descricao}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="booking-step">
            <div className="step-label">2 · Serviço</div>
            {grupos.map((g) => {
              const doGrupo = servicos.filter((s) => s.grupo === g);
              if (!doGrupo.length) return null;
              return (
                <div key={g} className="service-group">
                  <div className="tg-label">{g}</div>
                  <div className="service-list">
                    {doGrupo.map((s) => (
                      <button
                        key={s.id}
                        className={`service-item ${servicoId === s.id ? "selected" : ""}`}
                        onClick={() => setServicoId(s.id)}
                        aria-pressed={servicoId === s.id}
                        disabled={Boolean(reserva)}
                      >
                        <span className="service-info">
                          <span className="service-name">{s.nome}</span>
                          <span className="service-desc">{s.duracao}</span>
                        </span>
                        <span className="price">R$ {s.preco}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="booking-step">
            <div className="step-head">
              <span className="step-label">3 · Dia</span>
              <span className="week-nav">
                <span className="week-range">{faixaDaSemana(dias)}</span>
                <button
                  type="button"
                  aria-label="Semana anterior"
                  onClick={() => setSemana((n) => n - 1)}
                  disabled={semana <= 0}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Próxima semana"
                  onClick={() => setSemana((n) => n + 1)}
                >
                  ›
                </button>
              </span>
            </div>
            <div className={`day-picker ${carregandoAgenda ? "carregando" : ""}`}>
              {dias.map((d) => {
                const { dow, dom, mon } = rotuloDia(d.data);
                return (
                  <button
                    key={d.data}
                    disabled={!d.horarios.length || Boolean(reserva)}
                    className={`day-cell ${dia?.data === d.data ? "selected" : ""}`}
                    onClick={() => escolher(d.data)}
                  >
                    <span className="dow">{dow}</span>
                    <span className="dom">{dom}</span>
                    <span className="mon">{mon}</span>
                  </button>
                );
              })}
            </div>
            {erroAgenda ? (
              <p className="hint erro">{erroAgenda}</p>
            ) : (
              <p className="hint">
                Domingo fechado, segunda só a partir das 14:30.
              </p>
            )}
          </div>

          <div className="booking-step">
            <div className="step-label">4 · Horário</div>
            {!dia ? (
              <p className="hint">
                {carregandoAgenda
                  ? "Carregando a agenda…"
                  : "Nenhum horário livre nessa semana. Tente a próxima."}
              </p>
            ) : (
              dia.faixas.map((f) => (
                <div className="time-group" key={f.inicio}>
                  <div className="tg-label">
                    {f.turno} · {f.inicio} às {f.fim}
                  </div>
                  {f.horarios.length ? (
                    <div className="time-slots">
                      {f.horarios.map((t) => (
                        <button
                          key={t}
                          className={`time-slot ${horario === t ? "selected" : ""}`}
                          onClick={() => setHoraSel(t)}
                          aria-pressed={horario === t}
                          disabled={Boolean(reserva)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="hint">
                      Nenhum horário livre {servico ? `de ${servico.duracao} ` : ""}
                      nesse turno.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          {reserva ? (
            <div className="summary-card">
              <div className="summary-title">
                {reserva.status === "cancelado" ? "Reserva cancelada" : "Reserva confirmada"}
              </div>

              <div className="codigo-reserva">
                <span className="label">Código</span>
                <strong>{reserva.codigo}</strong>
              </div>

              <div className="summary-row">
                <span className="label">Barbeiro</span>
                <span>{reserva.barbeiro.nome}</span>
              </div>
              <div className="summary-row">
                <span className="label">Serviço</span>
                <span>{reserva.servico.nome}</span>
              </div>
              <div className="summary-row">
                <span className="label">Quando</span>
                <span>
                  {rotuloCurto(reserva.data)} · {reserva.horario} às {reserva.termina}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>R$ {reserva.preco}</span>
              </div>

              {erroEnvio && <p className="form-erro">{erroEnvio}</p>}

              {reserva.status === "confirmado" ? (
                <>
                  <button
                    className="btn btn-outline btn-block"
                    onClick={cancelar}
                    disabled={enviando || !reserva.podeCancelar}
                  >
                    {enviando ? "Cancelando…" : "Cancelar reserva"}
                  </button>
                  <p className="summary-note">
                    {reserva.podeCancelar
                      ? `Guarde o código ${reserva.codigo}. Cancelamento até 4h antes; depois disso a cadeira já está bloqueada no seu nome.`
                      : "Falta menos de 4h para o horário: a cadeira já está bloqueada. Para desmarcar, fale com a barbearia."}
                  </p>
                  <button type="button" className="btn-linha" onClick={novaReserva}>
                    Marcar outro horário
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-block" onClick={novaReserva}>
                    Fazer outra reserva
                  </button>
                  <p className="summary-note">
                    O horário voltou pra agenda. Até logo.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form className="summary-card" onSubmit={confirmar}>
              <div className="summary-title">Sua reserva</div>
              <div className="summary-row">
                <span className="label">Barbeiro</span>
                <span>{barbeiro?.nome ?? "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Serviço</span>
                <span>{servico?.nome ?? "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Duração</span>
                <span>{servico?.duracao ?? "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">Quando</span>
                <span>
                  {dia && horario ? `${rotuloCurto(dia.data)} · ${horario}` : "Sem horário"}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{servico ? `R$ ${servico.preco}` : "—"}</span>
              </div>

              <div className="campo">
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como te chamamos"
                  autoComplete="name"
                  maxLength={80}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="telefone">WhatsApp</label>
                <input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                  placeholder="(16) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="observacao">Observação (opcional)</label>
                <input
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Algo que o barbeiro precise saber"
                  maxLength={280}
                />
              </div>

              {erroEnvio && <p className="form-erro">{erroEnvio}</p>}

              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={!podeConfirmar || enviando}
              >
                {enviando ? "Reservando…" : "Confirmar reserva"}
              </button>
              <p className="summary-note">
                Cancelamento até 4h antes. Depois disso a cadeira já está
                bloqueada no seu nome.
              </p>
            </form>
          )}

          {!reserva && (
            <form className="summary-card" onSubmit={consultarReserva}>
              <div className="summary-title">Já tem reserva?</div>
              <p className="summary-note">
                O código apareceu na confirmação. Com ele e o telefone você vê
                os detalhes e cancela, de qualquer aparelho.
              </p>
              <div className="campo">
                <label htmlFor="cons-codigo">Código</label>
                <input
                  id="cons-codigo"
                  className="codigo"
                  value={consCodigo}
                  onChange={(e) => setConsCodigo(normalizarCodigo(e.target.value))}
                  placeholder="K7M2QX"
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={6}
                />
              </div>
              <div className="campo">
                <label htmlFor="cons-telefone">WhatsApp</label>
                <input
                  id="cons-telefone"
                  value={consTelefone}
                  onChange={(e) => setConsTelefone(mascararTelefone(e.target.value))}
                  placeholder="(16) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              {erroConsulta && <p className="form-erro">{erroConsulta}</p>}

              <button
                className="btn btn-outline btn-block"
                type="submit"
                disabled={!podeConsultar || consultando}
              >
                {consultando ? "Buscando…" : "Ver minha reserva"}
              </button>
            </form>
          )}

          <div className="summary-title spaced">Horário de atendimento</div>
          <div className="hours-table">
            {expediente.map((e) => (
              <div className="hours-row" key={e.diaSemana}>
                <span className={`day ${e.fechado ? "closed" : ""}`}>{e.dia}</span>
                <span className="time">
                  {e.fechado ? (
                    <span>Fechado</span>
                  ) : (
                    e.faixas.map((f) => (
                      <span key={f.inicio}>{f.inicio} às {f.fim}</span>
                    ))
                  )}
                </span>
              </div>
            ))}
          </div>

          <a
            className="whatsapp-link"
            href="https://wa.me/5516993944841"
            target="_blank"
            rel="noreferrer"
          >
            Prefere no WhatsApp? (16) 99394-4841 <span aria-hidden="true">→</span>
          </a>

          <p className="summary-note">
            Serviços, durações e preços vêm da agenda da barbearia no
            MinhaAgenda.
          </p>
        </div>
      </div>
    </>
  );
}
