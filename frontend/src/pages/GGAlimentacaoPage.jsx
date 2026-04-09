import { useState } from "react"
import Header from "../components/Header"

const COR = "#c0521a"
const COR_CLARA = "#fff7f0"
const COR_BORDA = "#f4b48a"

const kpis = [
  { label: "Escolas Atendidas",    valor: 142, icon: "🏫", variacao: "rede completa"   },
  { label: "Refeições/Dia",        valor: "18.4k", icon: "🍽️", variacao: "média diária" },
  { label: "Fornecedores Ativos",  valor: 9,   icon: "🚚", variacao: "+1 este mês"     },
  { label: "Itens com Alerta",     valor: 6,   icon: "⚠️", variacao: "revisão necessária" },
]

const tiposEscola = ["Todas", "CMEI", "EM", "ETI"]

const escolas = [
  { nome: "CMEI Jardim das Flores",   tipo: "CMEI", utensilios: "Bom",     estoque: "Regular", orcamento: 92,  status: "Regular"  },
  { nome: "CMEI Sol Nascente",        tipo: "CMEI", utensilios: "Ótimo",   estoque: "Bom",     orcamento: 78,  status: "OK"       },
  { nome: "EM Assis Chateaubriand",   tipo: "EM",   utensilios: "Regular", estoque: "Crítico", orcamento: 61,  status: "Alerta"   },
  { nome: "EM Barão de Mauá",         tipo: "EM",   utensilios: "Bom",     estoque: "Bom",     orcamento: 84,  status: "OK"       },
  { nome: "EM João XXIII",            tipo: "EM",   utensilios: "Crítico", estoque: "Regular", orcamento: 45,  status: "Crítico"  },
  { nome: "ETI Rui Barbosa",          tipo: "ETI",  utensilios: "Ótimo",   estoque: "Bom",     orcamento: 88,  status: "OK"       },
  { nome: "ETI Getúlio Vargas",       tipo: "ETI",  utensilios: "Bom",     estoque: "Bom",     orcamento: 95,  status: "OK"       },
  { nome: "CMEI Estrela do Amanhã",   tipo: "CMEI", utensilios: "Regular", estoque: "Crítico", orcamento: 52,  status: "Alerta"   },
  { nome: "EM Santos Dumont",         tipo: "EM",   utensilios: "Bom",     estoque: "Regular", orcamento: 73,  status: "Regular"  },
  { nome: "ETI Dom Helder Câmara",    tipo: "ETI",  utensilios: "Regular", estoque: "Bom",     orcamento: 69,  status: "Regular"  },
]

const qualidadeStyle = {
  "Ótimo":   { bg: "#dcfce7", cor: "#15803d" },
  "Bom":     { bg: "#dbeafe", cor: "#1d4ed8" },
  "Regular": { bg: "#fef9c3", cor: "#a16207" },
  "Crítico": { bg: "#fee2e2", cor: "#b91c1c" },
}

const statusStyle = {
  "OK":      { bg: "#dcfce7", cor: "#15803d" },
  "Regular": { bg: "#fef9c3", cor: "#a16207" },
  "Alerta":  { bg: "#ffedd5", cor: "#c2410c" },
  "Crítico": { bg: "#fee2e2", cor: "#b91c1c" },
}

const orcamentoMensal = [
  { mes: "Jan", usado: 78 },
  { mes: "Fev", usado: 82 },
  { mes: "Mar", usado: 91 },
  { mes: "Abr", usado: 67 },
  { mes: "Mai", usado: 74 },
  { mes: "Jun", usado: 88 },
]

const distribuicao = [
  { tipo: "CMEI", escolas: 48, refeicoes: 5200, cor: "#c0521a" },
  { tipo: "EM",   escolas: 71, refeicoes: 9800, cor: "#e8834a" },
  { tipo: "ETI",  escolas: 23, refeicoes: 3400, cor: "#f4b48a" },
]

function OrcamentoChart() {
  const max = 100
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140, padding: "0 8px" }}>
      {orcamentoMensal.map(m => {
        const cor = m.usado >= 90 ? "#ef4444" : m.usado >= 75 ? "#f97316" : COR
        return (
          <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{m.usado}%</span>
            <div style={{
              width: "100%",
              height: `${(m.usado / max) * 100}px`,
              background: cor,
              borderRadius: "6px 6px 0 0",
              opacity: 0.85,
            }} />
            <span style={{ fontSize: 10, color: "#64748b" }}>{m.mes}</span>
          </div>
        )
      })}
    </div>
  )
}

function DistribuicaoChart() {
  const totalRef = distribuicao.reduce((s, d) => s + d.refeicoes, 0)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {distribuicao.map(d => {
        const pct = Math.round((d.refeicoes / totalRef) * 100)
        return (
          <div key={d.tipo}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.cor, display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4a1a00" }}>{d.tipo}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>— {d.escolas} escolas</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.cor }}>{d.refeicoes.toLocaleString()} ref/dia</span>
            </div>
            <div style={{ background: "#fff0e6", borderRadius: 8, height: 10, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%",
                background: d.cor, borderRadius: 8,
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{pct}% do total de refeições</div>
          </div>
        )
      })}
    </div>
  )
}

export default function GGAlimentacaoPage() {
  const [tipoFiltro, setTipoFiltro] = useState("Todas")

  const escolasFiltradas = tipoFiltro === "Todas"
    ? escolas
    : escolas.filter(e => e.tipo === tipoFiltro)

  const criticos = escolas.filter(e => e.status === "Crítico" || e.status === "Alerta")

  return (
    <div style={{ minHeight: "100vh", background: "#fff9f5", fontFamily: "'Segoe UI', sans-serif", color: "#2d0e00" }}>

      <Header
        titulo="GG Alimentação Escolar"
        sub="Painel de acompanhamento nutricional"
        cor={COR}
      />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              boxShadow: `0 2px 12px ${COR}18`, borderLeft: `4px solid ${COR}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: COR }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{k.variacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* GRÁFICOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Execução Orçamentária</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>% do orçamento mensal utilizado</div>
            <OrcamentoChart />
            <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
              {[
                { cor: COR,      label: "Normal (< 75%)"  },
                { cor: "#f97316", label: "Atenção (75-89%)" },
                { cor: "#ef4444", label: "Crítico (≥ 90%)"  },
              ].map(l => (
                <span key={l.label} style={{ fontSize: 10, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: l.cor, display: "inline-block" }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Refeições por Tipo de Escola</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Distribuição diária por categoria</div>
            <DistribuicaoChart />
          </div>
        </div>

        {/* ALERTA */}
        {criticos.length > 0 && (
          <div style={{
            background: "#fff7ed", border: "1.5px solid #fdba74", borderRadius: 12,
            padding: "14px 20px", marginBottom: 24,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: "#c2410c", fontSize: 13, marginBottom: 4 }}>
                {criticos.length} escola(s) precisam de atenção!
              </div>
              <div style={{ fontSize: 12, color: "#9a3412" }}>
                {criticos.map(e => e.nome).join(" • ")}
              </div>
            </div>
          </div>
        )}

        {/* TABELA */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Situação por Escola</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Utensílios, estoque e execução orçamentária</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {tiposEscola.map(t => (
                <button key={t} onClick={() => setTipoFiltro(t)} style={{
                  padding: "5px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: tipoFiltro === t ? COR : COR_CLARA,
                  color: tipoFiltro === t ? "#fff" : COR,
                  transition: "all 0.2s",
                }}>{t}</button>
              ))}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                {["ESCOLA", "TIPO", "UTENSÍLIOS", "ESTOQUE", "ORÇAMENTO USADO", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {escolasFiltradas.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{e.nome}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: COR_CLARA, color: COR,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700,
                    }}>{e.tipo}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: qualidadeStyle[e.utensilios]?.bg,
                      color: qualidadeStyle[e.utensilios]?.cor,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                    }}>{e.utensilios}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: qualidadeStyle[e.estoque]?.bg,
                      color: qualidadeStyle[e.estoque]?.cor,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                    }}>{e.estoque}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "#fff0e6", borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{
                          width: `${e.orcamento}%`, height: "100%", borderRadius: 6,
                          background: e.orcamento >= 90 ? "#ef4444" : e.orcamento >= 75 ? "#f97316" : COR,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", minWidth: 30 }}>{e.orcamento}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: statusStyle[e.status]?.bg,
                      color: statusStyle[e.status]?.cor,
                      borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600,
                    }}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}
