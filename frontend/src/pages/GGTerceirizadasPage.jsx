//const POWERBI_URL = "https://app.powerbi.com/links/18h9JJyt34?ctid=28567d34-5f70-445d-8364-e72e919a41d3&pbi_source=linkShare"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
const kpis = [
  { label: "Contratos Ativos",     valor: 34, icon: "📋", variacao: "+3 este mês" },
  { label: "Empresas Cadastradas", valor: 2, icon: "🏢", variacao: "+1 este mês" },
  { label: "Fiscalizações",        valor: 27, icon: "🔍", variacao: "este trimestre" },
  { label: "Pendências",           valor: 5,  icon: "⚠️", variacao: "em aberto" },
]

const linhaLabels    = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
const linhaAtivos    = [28, 29, 31, 30, 33, 34]
const linhaEncerrando = [4, 3, 5, 4, 3, 5]

const pizza = [
  { label: "SEDUC",     valor: 38, cor: "#1d7fc4" },
  { label: "Vereador A",   valor: 25, cor: "#38bdf8" },
  { label: "Vereador B",  valor: 20, cor: "#0369a1" },
  { label: "Vereador C", valor: 10, cor: "#7dd3fc" },
  { label: "Vereador D",      valor: 7,  cor: "#bae6fd" },
]

const atividades = [
  { data: "03/03", empresa: "Solserv",     descricao: "Renovação contrato — Lote 02",         status: "Concluído"    },
  { data: "05/03", empresa: "Shallon",    descricao: "Vistoria de conformidade",             status: "Concluído"    },
  { data: "07/03", empresa: "ManutechPE",  descricao: "Revisão de cláusulas contratuais",     status: "Em andamento" },
  { data: "10/03", empresa: "AlimEscolar", descricao: "Entrega de documentação fiscal",       status: "Concluído"    },
  { data: "12/03", empresa: "LimpeJá",     descricao: "Ocorrência — ausência de funcionário", status: "Pendente"     },
  { data: "14/03", empresa: "SegurNet",    descricao: "Relatório mensal enviado",             status: "Concluído"    },
]

const filtros = ["Todos", "Solserv", "Shallon"]

const statusStyle = {
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
  "Em andamento": { bg: "#fef9c3", cor: "#a16207" },
  "Pendente":     { bg: "#fee2e2", cor: "#b91c1c" },
}

function LinhaChart() {
  const W = 420, H = 160
  const pad = { top: 16, right: 16, bottom: 28, left: 32 }
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom
  const maxV = 40
  const px = (i) => pad.left + (i / (linhaLabels.length - 1)) * iW
  const py = (v) => pad.top + iH - (v / maxV) * iH
  const pathAtivos = linhaAtivos.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ")
  const pathEnc    = linhaEncerrando.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ")
  const areaAtivos = `${pathAtivos} L${px(linhaAtivos.length - 1)},${py(0)} L${px(0)},${py(0)} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {[0, 10, 20, 30, 40].map(v => (
        <g key={v}>
          <line x1={pad.left} y1={py(v)} x2={W - pad.right} y2={py(v)} stroke="#e0f2fe" strokeWidth="1" />
          <text x={pad.left - 4} y={py(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
        </g>
      ))}
      <path d={areaAtivos} fill="#1d7fc422" />
      <path d={pathAtivos} fill="none" stroke="#1d7fc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pathEnc}    fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round" />
      {linhaAtivos.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="4" fill="#1d7fc4" stroke="#fff" strokeWidth="1.5" />)}
      {linhaLabels.map((l, i) => <text key={l} x={px(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#64748b">{l}</text>)}
    </svg>
  )
}

function PizzaChart() {
  const cx = 90, cy = 90, r = 72, inner = 40
  let angulo = -Math.PI / 2
  const total = pizza.reduce((s, p) => s + p.valor, 0)
  const fatias = pizza.map(p => {
    const start = angulo
    const sweep = (p.valor / total) * 2 * Math.PI
    angulo += sweep
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(angulo), y2 = cy + r * Math.sin(angulo)
    const xi1 = cx + inner * Math.cos(start), yi1 = cy + inner * Math.sin(start)
    const xi2 = cx + inner * Math.cos(angulo), yi2 = cy + inner * Math.sin(angulo)
    const large = sweep > Math.PI ? 1 : 0
    return { ...p, d: `M${xi1},${yi1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${inner},${inner} 0 ${large},0 ${xi1},${yi1} Z` }
  })
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {fatias.map(f => <path key={f.label} d={f.d} fill={f.cor} stroke="#fff" strokeWidth="2" />)}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#0369a1">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#64748b">contratos</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pizza.map(p => (
          <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: p.cor, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#475569" }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginLeft: "auto" }}>{p.valor}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GGTerceirizadasPage() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState("Todos")

  const atividadesFiltradas = filtro === "Todos"
    ? atividades
    : atividades.filter(a => a.empresa === filtro)

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7ff", fontFamily: "'Segoe UI', sans-serif", color: "#0c4a6e" }}>

      {/* HEADER */}
        <Header
    titulo="Gerência Geral das Terceirizadas"
    sub="Painel de gestão contratual"
    extra="Março 2026"
    cor="#1d7fc4"
    />
      <main style={{ padding: "28px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", paddingTop: "calc(64px)", gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              boxShadow: "0 2px 12px #1d7fc411", borderLeft: "4px solid #1d7fc4",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0369a1" }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{k.variacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* GRÁFICOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }}>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px #1d7fc411" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0369a1", marginBottom: 4 }}>Evolução de Contratos</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Ativos vs. a encerrar nos próximos 30 dias</div>
            <LinhaChart />
            <div style={{ display: "flex", gap: 20, marginTop: 10, justifyContent: "center" }}>
              {[
                { cor: "#1d7fc4", label: "Contratos ativos", tipo: "solid" },
                { cor: "#f97316", label: "A encerrar", tipo: "dashed" },
              ].map(l => (
                <span key={l.label} style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="22" height="8">
                    <line x1="0" y1="4" x2="22" y2="4" stroke={l.cor} strokeWidth="2.5"
                      strokeDasharray={l.tipo === "dashed" ? "5,3" : "0"} strokeLinecap="round" />
                  </svg>
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px #1d7fc411" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0369a1", marginBottom: 4 }}>Contratos por Tipo</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Distribuição por categoria de serviço</div>
            <PizzaChart />
          </div>
        </div>

        {/* ATIVIDADES */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px #1d7fc411" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0369a1" }}>Ocorrências Recentes</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Últimas movimentações contratuais</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filtros.map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: filtro === f ? "#1d7fc4" : "#e0f2fe",
                  color: filtro === f ? "#fff" : "#0369a1",
                  transition: "all 0.2s",
                }}>{f}</button>
              ))}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0f2fe" }}>
                {["DATA", "EMPRESA", "DESCRIÇÃO", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atividadesFiltradas.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f9ff" }}>
                  <td style={{ padding: "12px", fontSize: 12, color: "#475569" }}>{a.data}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{a.empresa}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155" }}>{a.descricao}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: statusStyle[a.status]?.bg,
                      color: statusStyle[a.status]?.cor,
                      borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600,
                    }}>{a.status}</span>
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
