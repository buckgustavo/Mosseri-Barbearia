import { useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import Receber from "./Receber";
import {
  dataLegivel, hojeLocal, linkWhatsapp, moeda, reais, somaDias, telefoneLegivel, useAcao, useRecurso,
} from "./comum";

// O dia inteiro numa tela. É o que substitui abrir o banco na mão pra saber
// quem vem hoje -- e o único lugar onde o telefone do cliente aparece.
export default function PainelAgenda({ aoExpirar }) {
  const [data, setData] = useState(hojeLocal());
  const { dados, erro, carregando, recarregar } = useRecurso(
    () => admin.agenda(data),
    aoExpirar,
    data
  );
  const acao = useAcao(aoExpirar);

  async function cancelar(reserva) {
    const certeza = window.confirm(
      `Cancelar a reserva de ${reserva.cliente.nome}, ${reserva.horario}? ` +
      "O horário volta pra agenda e o cliente não é avisado por aqui."
    );
    if (!certeza) return;
    if (await acao.executar(() => admin.cancelarReserva(reserva.codigo))) recarregar();
  }

  const confirmadas = dados?.reservas.filter((r) => r.status === "confirmado") ?? [];

  return (
    <div className="admin-painel">
      <div className="admin-barra">
        <div className="admin-datas">
          <button
            className="btn btn-outline admin-seta"
            onClick={() => setData((d) => somaDias(d, -1))}
            aria-label="Dia anterior"
          >
            ‹
          </button>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value || hojeLocal())}
            aria-label="Dia da agenda"
          />
          <button
            className="btn btn-outline admin-seta"
            onClick={() => setData((d) => somaDias(d, 1))}
            aria-label="Próximo dia"
          >
            ›
          </button>
          <button className="btn btn-outline" onClick={() => setData(hojeLocal())}>
            Hoje
          </button>
        </div>
        {dados && (
          <div className="admin-totais">
            <span>
              <strong>{dados.total}</strong> {dados.total === 1 ? "reserva" : "reservas"}
            </span>
            <span>
              <strong>{moeda(dados.receita)}</strong> no dia
            </span>
            <span>
              <strong>{reais(dados.recebidoCentavos)}</strong> recebido
            </span>
            {dados.cancelados > 0 && <span className="apagado">{dados.cancelados} cancelada(s)</span>}
          </div>
        )}
      </div>

      <Erro>{erro || acao.erro}</Erro>

      <Estado
        carregando={carregando}
        vazio={
          dados && !dados.reservas.length
            ? `Nenhuma reserva em ${dataLegivel(data)} (${dados.dia}).`
            : null
        }
      >
        <div className="admin-lista">
          {dados?.reservas.map((r) => (
            <div
              className={`admin-reserva ${r.status === "cancelado" ? "cancelada" : ""}`}
              key={r.codigo}
            >
              <div className="reserva-hora">
                <strong>{r.horario}</strong>
                <span>{r.termina}</span>
              </div>
              <div className="reserva-corpo">
                <div className="reserva-topo">
                  <span className="reserva-cliente">{r.cliente.nome}</span>
                  <a
                    className="reserva-telefone"
                    href={linkWhatsapp(r.cliente.telefone)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {telefoneLegivel(r.cliente.telefone)}
                  </a>
                </div>
                <div className="reserva-baixo">
                  {r.servico.nome} · {r.duracao} · {r.barbeiro.nome} · {moeda(r.preco)} ·{" "}
                  <span className="codigo-inline">{r.codigo}</span>
                </div>
                {r.observacao && <div className="reserva-obs">“{r.observacao}”</div>}
              </div>
              <div className="reserva-acao">
                {r.status === "confirmado" ? (
                  <>
                    <Receber codigo={r.codigo} conta={r.financeiro} acao={acao} aoMudar={recarregar} />
                    {/* Com pagamento não cancela: o dinheiro sumiria do caixa sem ninguém ver. */}
                    {!r.financeiro.pagamentos.length && (
                      <button className="btn-linha" onClick={() => cancelar(r)} disabled={acao.ocupado}>
                        Cancelar
                      </button>
                    )}
                  </>
                ) : (
                  <span className="pill">cancelada</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Estado>

      {confirmadas.length > 0 && (
        <p className="hint">
          Ninguém é avisado automaticamente: confirmação e lembrete ainda saem no WhatsApp, na mão.
        </p>
      )}
    </div>
  );
}
