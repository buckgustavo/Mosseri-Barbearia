import { useMemo, useState } from "react";

// Barbeiros. O preco muda conforme quem atende: o site de agendamento marca
// varios servicos como "atendimento exclusivo com Edson Thiago", mais caros
// que os mesmos servicos feitos pela equipe.
const BARBERS = [
  { id: "edson", name: "Thiago", foto: "thiago", desc: "Atendimento exclusivo" },
  { id: "equipe", name: "Juan", foto: "juan", desc: "Equipe Mosseri" },
];

// Servicos reais, com duracao em minutos e preco por barbeiro.
// Preco ausente = aquele barbeiro nao faz o servico.
const SERVICES = [
  { name: "Corte (social ou degradê)", grupo: "Serviços", min: 30, preco: { equipe: 35, edson: 40 } },
  { name: "Barboterapia", grupo: "Serviços", min: 30, preco: { equipe: 35, edson: 40 } },
  { name: "Sobrancelha", grupo: "Serviços", min: 5, preco: { equipe: 10, edson: 10 } },
  { name: "Hidratação de cabelo", grupo: "Serviços", min: 20, preco: { equipe: 30, edson: 30 } },
  { name: "Desondulação masculina", grupo: "Serviços", min: 20, preco: { equipe: 80, edson: 80 } },
  { name: "Corte + Barboterapia", grupo: "Combos", min: 60, preco: { equipe: 65, edson: 70 } },
  { name: "Corte + Sobrancelha", grupo: "Combos", min: 30, preco: { equipe: 45, edson: 50 } },
  { name: "Corte + Barboterapia + Sobrancelha", grupo: "Combos", min: 60, preco: { edson: 80 } },
  { name: "Corte + Barba + Sobrancelha", grupo: "Combos", min: 60, preco: { equipe: 70 } },
  { name: "Corte + Hidratação", grupo: "Combos", min: 40, preco: { equipe: 65 } },
  { name: "Prótese capilar (manutenção)", grupo: "Combos", min: 90, preco: { equipe: 150, edson: 150 } },
];

// Expediente real. As faixas alimentam a tabela e tambem geram os horarios
// disponiveis, entao os dois nunca saem de sincronia.
const EXPEDIENTE = {
  1: { dia: "Segunda-feira", faixas: [["14:30", "20:00"]] },
  2: { dia: "Terça-feira", faixas: [["09:00", "12:00"], ["14:00", "20:00"]] },
  3: { dia: "Quarta-feira", faixas: [["09:00", "12:00"], ["14:00", "20:00"]] },
  4: { dia: "Quinta-feira", faixas: [["09:00", "12:00"], ["14:00", "20:00"]] },
  5: { dia: "Sexta-feira", faixas: [["09:00", "12:00"], ["14:00", "20:00"]] },
  6: { dia: "Sábado", faixas: [["09:00", "12:00"], ["14:00", "17:00"]] },
  0: { dia: "Domingo", faixas: [] },
};

const DAYS = [
  { dow: "Seg", dom: 24, mon: "Ago", semana: 1 },
  { dow: "Ter", dom: 25, mon: "Ago", semana: 2 },
  { dow: "Qua", dom: 26, mon: "Ago", semana: 3 },
  { dow: "Qui", dom: 27, mon: "Ago", semana: 4 },
  { dow: "Sex", dom: 28, mon: "Ago", semana: 5 },
  { dow: "Sáb", dom: 29, mon: "Ago", semana: 6 },
  { dow: "Dom", dom: 30, mon: "Ago", semana: 0 },
];

const PASSO = 30; // intervalo entre horarios oferecidos, em minutos

const paraMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const paraHora = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const duracao = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
};

// Um horario so entra na lista se o servico inteiro couber dentro da faixa.
function gerarHorarios(faixas, minutosServico) {
  const out = [];
  for (const [ini, fim] of faixas) {
    const inicio = paraMin(ini);
    const limite = paraMin(fim) - minutosServico;
    for (let t = inicio; t <= limite; t += PASSO) out.push(paraHora(t));
  }
  return out;
}

export default function Agendar() {
  const [barber, setBarber] = useState(BARBERS[0]);
  const [serviceName, setServiceName] = useState(SERVICES[0].name);
  const [day, setDay] = useState(DAYS[3]);
  const [time, setTime] = useState(null);

  // Servicos que o barbeiro escolhido realmente faz
  const disponiveis = useMemo(
    () => SERVICES.filter((s) => s.preco[barber.id] != null),
    [barber]
  );

  const service =
    disponiveis.find((s) => s.name === serviceName) ?? disponiveis[0];
  const preco = service.preco[barber.id];

  const expediente = EXPEDIENTE[day.semana];
  const horarios = useMemo(
    () => gerarHorarios(expediente.faixas, service.min),
    [expediente, service]
  );

  const escolhido = time && horarios.includes(time) ? time : horarios[0] ?? null;

  const grupos = ["Combos", "Serviços"];

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
              {BARBERS.map((b) => (
                <button
                  key={b.id}
                  className={`barber-card ${barber.id === b.id ? "selected" : ""}`}
                  onClick={() => setBarber(b)}
                  aria-pressed={barber.id === b.id}
                >
                  <span className="polaroid-foto">
                    <img src={`/fotos/${b.foto}.jpg`} alt={b.name} />
                  </span>
                  <span className="polaroid-legenda">
                    <span className="barber-name">{b.name}</span>
                    <span className="barber-desc">{b.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="booking-step">
            <div className="step-label">2 · Serviço</div>
            {grupos.map((g) => {
              const doGrupo = disponiveis.filter((s) => s.grupo === g);
              if (!doGrupo.length) return null;
              return (
                <div key={g} className="service-group">
                  <div className="tg-label">{g}</div>
                  <div className="service-list">
                    {doGrupo.map((s) => (
                      <button
                        key={s.name}
                        className={`service-item ${service.name === s.name ? "selected" : ""}`}
                        onClick={() => setServiceName(s.name)}
                        aria-pressed={service.name === s.name}
                      >
                        <span className="service-info">
                          <span className="service-name">{s.name}</span>
                          <span className="service-desc">{duracao(s.min)}</span>
                        </span>
                        <span className="price">R$ {s.preco[barber.id]}</span>
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
                <span className="week-range">24 a 30 de ago</span>
                <button type="button" aria-label="Semana anterior">‹</button>
                <button type="button" aria-label="Próxima semana">›</button>
              </span>
            </div>
            <div className="day-picker">
              {DAYS.map((d) => {
                const fechado = !EXPEDIENTE[d.semana].faixas.length;
                return (
                  <button
                    key={d.dom}
                    disabled={fechado}
                    className={`day-cell ${day.dom === d.dom ? "selected" : ""}`}
                    onClick={() => setDay(d)}
                  >
                    <span className="dow">{d.dow}</span>
                    <span className="dom">{d.dom}</span>
                    <span className="mon">{d.mon}</span>
                  </button>
                );
              })}
            </div>
            <p className="hint">
              Domingo fechado, segunda só a partir das 14:30.
            </p>
          </div>

          <div className="booking-step">
            <div className="step-label">4 · Horário</div>
            {expediente.faixas.map(([ini, fim], i) => {
              const daFaixa = gerarHorarios([[ini, fim]], service.min);
              const turno = paraMin(ini) < 12 * 60 ? "Manhã" : "Tarde";
              return (
                <div className="time-group" key={ini}>
                  <div className="tg-label">
                    {turno} · {ini} às {fim}
                  </div>
                  {daFaixa.length ? (
                    <div className="time-slots">
                      {daFaixa.map((t) => (
                        <button
                          key={t}
                          className={`time-slot ${escolhido === t ? "selected" : ""}`}
                          onClick={() => setTime(t)}
                          aria-pressed={escolhido === t}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="hint">
                      Nenhum horário cabe {duracao(service.min)} nesse turno.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="summary-card">
            <div className="summary-title">Sua reserva</div>
            <div className="summary-row">
              <span className="label">Barbeiro</span>
              <span>{barber.name}</span>
            </div>
            <div className="summary-row">
              <span className="label">Serviço</span>
              <span>{service.name}</span>
            </div>
            <div className="summary-row">
              <span className="label">Duração</span>
              <span>{duracao(service.min)}</span>
            </div>
            <div className="summary-row">
              <span className="label">Quando</span>
              <span>
                {escolhido
                  ? `${day.dow}, ${day.dom}/08 · ${escolhido}`
                  : "Sem horário"}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>R$ {preco}</span>
            </div>
            <button className="btn btn-primary btn-block" disabled={!escolhido}>
              Confirmar reserva
            </button>
            <p className="summary-note">
              Cancelamento até 4h antes. Depois disso a cadeira já está
              bloqueada no seu nome.
            </p>
          </div>

          <div className="summary-title spaced">Horário de atendimento</div>
          <div className="hours-table">
            {[1, 2, 3, 4, 5, 6, 0].map((n) => {
              const e = EXPEDIENTE[n];
              const fechado = !e.faixas.length;
              return (
                <div className="hours-row" key={n}>
                  <span className={`day ${fechado ? "closed" : ""}`}>
                    {e.dia}
                  </span>
                  <span className="time">
                    {fechado ? (
                      <span>Fechado</span>
                    ) : (
                      e.faixas.map(([i, f]) => <span key={i}>{i} às {f}</span>)
                    )}
                  </span>
                </div>
              );
            })}
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
