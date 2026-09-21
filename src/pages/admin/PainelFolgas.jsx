import { useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import { dataLegivel, hojeLocal, telefoneLegivel, useAcao, useRecurso } from "./comum";

const VAZIO = { barbeiro: "", data: hojeLocal(), inicio: "09:00", fim: "20:00", motivo: "" };

// Feriado, folga e curso. Sem isso a barbearia fecha um dia escrevendo SQL --
// era a pendência mais antiga do backend.
export default function PainelFolgas({ aoExpirar, barbeiros }) {
  const [form, setForm] = useState(VAZIO);
  const [atingidas, setAtingidas] = useState(null);
  const { dados, erro, carregando, recarregar } = useRecurso(() => admin.bloqueios({}), aoExpirar);
  const acao = useAcao(aoExpirar);

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: e.target.value }),
  });

  async function criar(evento) {
    evento.preventDefault();
    const criado = await acao.executar(() =>
      admin.criarBloqueio({
        ...(form.barbeiro ? { barbeiro: form.barbeiro } : {}),
        data: form.data,
        inicio: form.inicio,
        fim: form.fim,
        ...(form.motivo.trim() ? { motivo: form.motivo.trim() } : {}),
      })
    );
    if (!criado) return;
    // Bloquear não cancela nada: quem já estava marcado continua marcado, e
    // alguém precisa ligar pra essas pessoas.
    setAtingidas(criado.reservasAtingidas.length ? criado.reservasAtingidas : null);
    setForm({ ...VAZIO, data: form.data });
    recarregar();
  }

  async function remover(bloqueio) {
    if (!window.confirm(`Liberar ${dataLegivel(bloqueio.data)}, ${bloqueio.inicio} às ${bloqueio.fim}?`)) return;
    if (await acao.executar(() => admin.removerBloqueio(bloqueio.id))) recarregar();
  }

  return (
    <div className="admin-painel">
      <form className="admin-form" onSubmit={criar}>
        <div className="admin-form-campos">
          <label className="campo">
            <span>Dia</span>
            <input type="date" required {...campo("data")} />
          </label>
          <label className="campo">
            <span>Das</span>
            <input type="time" required step="300" {...campo("inicio")} />
          </label>
          <label className="campo">
            <span>Às</span>
            <input type="time" required step="300" {...campo("fim")} />
          </label>
          <label className="campo">
            <span>Quem para</span>
            <select {...campo("barbeiro")}>
              <option value="">A casa inteira</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </label>
          <label className="campo cresce">
            <span>Motivo (opcional)</span>
            <input maxLength={120} placeholder="feriado, curso, folga" {...campo("motivo")} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={acao.ocupado}>
            {acao.ocupado ? "Salvando…" : "Bloquear"}
          </button>
        </div>
        <Erro>{acao.erro}</Erro>
      </form>

      {atingidas && (
        <div className="admin-aviso">
          <strong>Atenção:</strong> {atingidas.length} reserva(s) já marcada(s) nessa faixa
          continuam de pé. Ligue para remarcar:
          <ul>
            {atingidas.map((r) => (
              <li key={r.codigo}>
                {r.horario} · {r.cliente.nome} · {telefoneLegivel(r.cliente.telefone)} ({r.codigo})
              </li>
            ))}
          </ul>
          <button className="btn-linha" onClick={() => setAtingidas(null)}>Entendi</button>
        </div>
      )}

      <Erro>{erro}</Erro>

      <Estado
        carregando={carregando}
        vazio={dados && !dados.length ? "Nenhuma folga ou feriado nos próximos 60 dias." : null}
      >
        <div className="admin-lista">
          {dados?.map((b) => (
            <div className="admin-linha" key={b.id}>
              <div className="linha-principal">
                <strong>{dataLegivel(b.data)}</strong>
                <span className="apagado">{b.dia}</span>
                <span>{b.inicio} às {b.fim}</span>
                <span className="pill">{b.barbeiro ? b.barbeiro.nome : "casa inteira"}</span>
                {b.motivo && <span className="apagado">{b.motivo}</span>}
              </div>
              <button className="btn-linha" onClick={() => remover(b)} disabled={acao.ocupado}>
                Liberar
              </button>
            </div>
          ))}
        </div>
      </Estado>
    </div>
  );
}
