import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"

const COR = "#7c3371"
const COR_CLARA = "#f9f0f8"
const COR_BORDA = "#d4a0ce"

const kpis = [
  { label: "Processos Ativos",     valor: 47, icon: "⚖️",  variacao: "+4 este mês" },
  { label: "Pareceres Emitidos",   valor: 23, icon: "📝",  variacao: "este trimestre" },
  { label: "Contratos Analisados", valor: 31, icon: "📋",  variacao: "+2 esta semana" },
  { label: "Pendentes de Prazo",   valor: 8,  icon: "⏰",  variacao: "atenção necessária" },
]

const processos = [
  { id: "JUR-001", tipo: "Contrato",  assunto: "Revisão contrato empresa de limpeza",        prazo: "28/03", diasRestantes: 3,  prioridade: "Alta",  status: "Em andamento" },
  { id: "JUR-002", tipo: "Parecer",   assunto: "Parecer sobre licitação merenda escolar",    prazo: "01/04", diasRestantes: 7,  prioridade: "Alta",  status: "Em andamento" },
  { id: "JUR-003", tipo: "Processo",  assunto: "Ação trabalhista — professor substituto",    prazo: "15/04", diasRestantes: 21, prioridade: "Média", status: "Aguardando"   },
  { id: "JUR-004", tipo: "Contrato",  assunto: "Análise aditivo contrato segurança",         prazo: "10/04", diasRestantes: 16, prioridade: "Média", status: "Em andamento" },
  { id: "JUR-005", tipo: "Parecer",   assunto: "Consulta sobre cessão de uso de imóvel",     prazo: "05/04", diasRestantes: 11, prioridade: "Baixa", status: "Aguardando"   },
  { id: "JUR-006", tipo: "Processo",  assunto: "Impugnação edital — transporte escolar",     prazo: "26/03", diasRestantes: 1,  prioridade: "Alta",  status: "Atrasado"     },
  { id: "JUR-007", tipo: "Contrato",  assunto: "Rescisão contrato fornecedor material",      prazo: "20/04", diasRestantes: 26, prioridade: "Baixa", status: "Aguardando"   },
  { id: "JUR-008", tipo: "Parecer",   assunto: "Parecer sobre acúmulo de cargo — servidor",  prazo: "24/03", diasRestantes: -1, prioridade: "Alta",  status: "Atrasado"     },
]

const barrasPorTipo = [
  { label: "Contratos",  total: 31, concluido: 18 },
  { label: "Pareceres",  total: 23, concluido: 15 },
  { label: "Processos",  total: 19, concluido: 8  },
  { label: "Consultas",  total: 12, concluido: 9  },
]

const prioridadeStyle = {
  "Alta":  { bg: "#fee2e2", cor: "#b91c1c" },
  "Média": { bg: "#fef9c3", cor: "#a16207" },
  "Baixa": { bg: "#dcfce7", cor: "#15803d" },
}

const statusStyle = {
  "Em andamento": { bg: "#dbeafe", cor: "#1d4ed8" },
  "Aguardando":   { bg: "#f3e8ff", cor: "#7e22ce" },
  "Atrasado":     { bg: "#fee2e2", cor: "#b91c1c" },
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
}

const tipoStyle = {
  "Contrato": { bg: "#fdf4ff", cor: "#7c3371" },
  "Parecer":  { bg: "#f0f9ff", cor: "#0369a1" },
  "Processo": { bg: "#fff7ed", cor: "#c2410c" },
}

const filtrosTipo = ["Todos", "Contrato", "Parecer", "Processo"]
const filtrosStatus = ["Todos", "Em andamento", "Aguardando", "Atrasado"]

function BarrasChart() {
  const maxTotal = Math.max(...barrasPorTipo.map(b => b.total))
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {barrasPorTipo.map(b => {
        const pct = (b.concluido / b.total) * 100
        return (
          <div key={b.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4a1942" }}>{b.label}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{b.concluido}/{b.total} concluídos</span>
            </div>
            <div style={{ background: "#f3e8ff", borderRadius: 8, height: 10, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COR}, #b05aaa)`,
                borderRadius: 8,
                transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{Math.round(pct)}% concluído</div>
          </div>
        )
      })}
    </div>
  )
}

function PrazosChart() {
  const faixas = [
    { label: "Atrasado",   count: processos.filter(p => p.diasRestantes < 0).length,              cor: "#ef4444" },
    { label: "Urgente (1-3d)", count: processos.filter(p => p.diasRestantes >= 0 && p.diasRestantes <= 3).length, cor: "#f97316" },
    { label: "Próximo (4-14d)", count: processos.filter(p => p.diasRestantes >= 4 && p.diasRestantes <= 14).length, cor: "#eab308" },
    { label: "No prazo (15d+)", count: processos.filter(p => p.diasRestantes >= 15).length,        cor: "#22c55e" },
  ]
  const max = Math.max(...faixas.map(f => f.count))
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 120, padding: "0 8px" }}>
      {faixas.map(f => (
        <div key={f.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: f.cor }}>{f.count}</span>
          <div style={{
            width: "100%",
            height: max > 0 ? `${(f.count / max) * 80}px` : "4px",
            background: f.cor,
            borderRadius: "6px 6px 0 0",
            opacity: 0.85,
            minHeight: 4,
          }} />
          <span style={{ fontSize: 9, color: "#64748b", textAlign: "center", lineHeight: 1.3 }}>{f.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function GGJuridicaPage() {
  const [filtroTipo, setFiltroTipo] = useState("Todos")
  const [filtroStatus, setFiltroStatus] = useState("Todos")

  const processosFiltrados = processos.filter(p => {
    const okTipo   = filtroTipo   === "Todos" || p.tipo   === filtroTipo
    const okStatus = filtroStatus === "Todos" || p.status === filtroStatus
    return okTipo && okStatus
  })

  return (
    <div style={{ minHeight: "100vh", background: "#fdf4ff", fontFamily: "'Segoe UI', sans-serif", color: "#2d0a2a" }}>

      <Header
        titulo="GG Jurídica"
        sub="Painel de acompanhamento processual"
        extra="Março 2026"
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
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Barras de progresso */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Progresso por Categoria</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Concluídos vs. total por tipo de demanda</div>
            <BarrasChart />
          </div>

          {/* Gráfico de prazos */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Situação dos Prazos</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Processos agrupados por urgência</div>
            <PrazosChart />
          </div>
        </div>

        {/* ALERTA ATRASADOS */}
        {processos.some(p => p.status === "Atrasado") && (
          <div style={{
            background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 12,
            padding: "14px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: "#b91c1c", fontSize: 13 }}>Atenção: processos com prazo vencido!</div>
              <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>
                {processos.filter(p => p.status === "Atrasado").map(p => p.id).join(", ")} — verifique imediatamente.
              </div>
            </div>
          </div>
        )}

        {/* TABELA DE PROCESSOS */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Processos em Acompanhamento</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Filtre por tipo ou situação</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filtrosTipo.map(f => (
                <button key={f} onClick={() => setFiltroTipo(f)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: filtroTipo === f ? COR : COR_CLARA,
                  color: filtroTipo === f ? "#fff" : COR,
                  transition: "all 0.2s",
                }}>{f}</button>
              ))}
              <div style={{ width: 1, background: "#e2e8f0", margin: "0 4px" }} />
              {filtrosStatus.map(f => (
                <button key={f} onClick={() => setFiltroStatus(f)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: filtroStatus === f ? "#475569" : "#f1f5f9",
                  color: filtroStatus === f ? "#fff" : "#475569",
                  transition: "all 0.2s",
                }}>{f}</button>
              ))}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                {["ID", "TIPO", "ASSUNTO", "PRAZO", "PRIORIDADE", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processosFiltrados.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                  <td style={{ padding: "12px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>{p.id}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: tipoStyle[p.tipo]?.bg, color: tipoStyle[p.tipo]?.cor,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                    }}>{p.tipo}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#334155" }}>{p.assunto}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.diasRestantes < 0 ? "#b91c1c" : p.diasRestantes <= 3 ? "#f97316" : "#334155" }}>
                      {p.prazo}
                    </div>
                    <div style={{ fontSize: 10, color: p.diasRestantes < 0 ? "#b91c1c" : "#94a3b8" }}>
                      {p.diasRestantes < 0 ? `${Math.abs(p.diasRestantes)}d atrasado` : `${p.diasRestantes}d restantes`}
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: prioridadeStyle[p.prioridade]?.bg, color: prioridadeStyle[p.prioridade]?.cor,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                    }}>{p.prioridade}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: statusStyle[p.status]?.bg, color: statusStyle[p.status]?.cor,
                      borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600,
                    }}>{p.status}</span>
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
