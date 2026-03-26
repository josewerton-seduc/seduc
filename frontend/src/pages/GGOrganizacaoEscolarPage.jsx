import { useState, useEffect } from "react"
import Header from "../components/Header"

const COR = "#2d6a4f"
const COR_CLARA = "#f0f7f2"
const COR_BORDA = "#a8d5b5"

const kpis = [
  { label: "Unidades Escolares", valor: 142, icon: "🏫", variacao: "rede completa"     },
  { label: "Matrículas Ativas",  valor: "18.2k", icon: "📋", variacao: "ano letivo 2026" },
  { label: "Em Busca Ativa",     valor: 134, icon: "🔍", variacao: "crianças localizadas" },
  { label: "Rotas de Transporte",valor: 38,  icon: "🚌", variacao: "em operação"       },
]

const setores = ["Todos", "Transporte", "Matrícula", "Busca Ativa", "Infraestrutura", "Planejamento"]

const atividades = [
  { setor: "Matrícula",      descricao: "Transferência EM Barão de Mauá → ETI Rui Barbosa", data: "24/03", status: "Concluído"    },
  { setor: "Busca Ativa",    descricao: "Visita domiciliar — 12 crianças localizadas",       data: "23/03", status: "Concluído"    },
  { setor: "Transporte",     descricao: "Nova rota criada — Zona Rural Norte",               data: "22/03", status: "Em andamento" },
  { setor: "Infraestrutura", descricao: "Vistoria terreno novo CMEI — Bairro das Graças",    data: "21/03", status: "Aguardando"   },
  { setor: "Matrícula",      descricao: "Período de rematrícula 2026 encerrado",             data: "20/03", status: "Concluído"    },
  { setor: "Planejamento",   descricao: "Mapeamento demanda ETI — Zona Sul",                 data: "19/03", status: "Em andamento" },
  { setor: "Busca Ativa",    descricao: "Relatório mensal — 23 evadidos recuperados",        data: "18/03", status: "Concluído"    },
  { setor: "Transporte",     descricao: "Manutenção Van 04 — substituição prevista",         data: "17/03", status: "Alerta"       },
]

const statusStyle = {
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
  "Em andamento": { bg: "#dbeafe", cor: "#1d4ed8" },
  "Aguardando":   { bg: "#fef9c3", cor: "#a16207" },
  "Alerta":       { bg: "#fee2e2", cor: "#b91c1c" },
}

const setorStyle = {
  "Matrícula":      { bg: "#f0fdf4", cor: "#15803d" },
  "Busca Ativa":    { bg: "#fef9c3", cor: "#a16207" },
  "Transporte":     { bg: "#dbeafe", cor: "#1d4ed8" },
  "Infraestrutura": { bg: "#fdf4ff", cor: "#7e22ce" },
  "Planejamento":   { bg: "#fff7ed", cor: "#c2410c" },
}

// Gráfico de rosca igual ao BI
function RoscaChart({ sim, nao, titulo, legSim = "SIM", legNao = "NÃO" }) {
  const total = sim + nao
  const pctSim = sim / total
  const pctNao = nao / total
  const r = 70, cx = 90, cy = 90, inner = 42
  const circ = 2 * Math.PI * r

  const simDash = pctSim * circ
  const naoDash = pctNao * circ

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COR, marginBottom: 12, textAlign: "center" }}>{titulo}</div>
      <div style={{ position: "relative" }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* fundo */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="26" />
          {/* SIM — verde */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4a7c59" strokeWidth="26"
            strokeDasharray={`${simDash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="butt" />
          {/* NÃO — marrom */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#9ae097" strokeWidth="26"
            strokeDasharray={`${naoDash} ${circ}`}
            strokeDashoffset={circ * 0.25 - simDash}
            strokeLinecap="butt" />
          {/* labels nas fatias */}
          <text x={cx - 28} y={cy - 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
            {nao} ({Math.round(pctNao * 100)}%)
          </text>
          <text x={cx + 30} y={cy + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
            {sim} ({Math.round(pctSim * 100)}%)
          </text>
        </svg>
      </div>
      {/* legenda */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, alignSelf: "flex-end", marginRight: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 2 }}>Possui</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#4a7c59", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#475569" }}>{legSim}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#9ae097", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#475569" }}>{legNao}</span>
        </div>
      </div>
    </div>
  )
}

function BarrasSetor() {
  const dados = [
    { label: "Transporte",     total: 38, ok: 31 },
    { label: "Matrícula",      total: 245, ok: 238 },
    { label: "Busca Ativa",    total: 134, ok: 98 },
    { label: "Infraestrutura", total: 12, ok: 7 },
    { label: "Planejamento",   total: 18, ok: 14 },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {dados.map(d => {
        const pct = Math.round((d.ok / d.total) * 100)
        return (
          <div key={d.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1a3a2a" }}>{d.label}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{d.ok}/{d.total} concluídos</span>
            </div>
            <div style={{ background: "#d1fae5", borderRadius: 8, height: 10, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%",
                background: pct >= 80 ? COR : pct >= 60 ? "#f97316" : "#ef4444",
                borderRadius: 8,
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{pct}% concluído</div>
          </div>
        )
      })}
    </div>
  )
}

export default function GGOrganizacaoPage() {
  const [filtroSetor, setFiltroSetor] = useState("Todos")
  const [dadosPlanilha, setDadosPlanilha] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIQHfxXu2ZDPI2q_zIsa5eIjKgCibY8NYCDTnKhI0Gc3zWtGQlknFU_zSx0P52XBYwCeGEwxYz08Jl/pub?output=csv"
    fetch(url)
      .then(r => r.text())
      .then(csv => {
        const linhas = csv.trim().split("\n").slice(1) // pula cabeçalho
        const dados = linhas.map(l => {
          const cols = l.split(",")
          return { bairro: cols[0]?.trim(), possui: cols[1]?.trim() }
        }).filter(d => d.bairro)
        setDadosPlanilha(dados)
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  const sim = dadosPlanilha.filter(d => d.possui?.toUpperCase() === "SIM").length
  const nao = dadosPlanilha.filter(d => d.possui?.toUpperCase() === "NÃO" || d.possui?.toUpperCase() === "NAO").length

  const atividadesFiltradas = filtroSetor === "Todos"
    ? atividades
    : atividades.filter(a => a.setor === filtroSetor)

  return (
    <div style={{ minHeight: "100vh", background: "#f4faf6", fontFamily: "'Segoe UI', sans-serif", color: "#1a3a2a" }}>

      <Header
        titulo="GG Organização Escolar"
        sub="Painel de gestão e estrutura da rede"
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Rosca CMEI — dados reais da planilha */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COR, marginBottom: 4, alignSelf: "flex-start" }}>📊 Dados da Planilha</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16, alignSelf: "flex-start" }}>Bairros da Sede com CMEIs</div>
            {carregando ? (
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 40 }}>Carregando planilha...</div>
            ) : sim + nao > 0 ? (
              <RoscaChart sim={sim} nao={nao} titulo="Proporção dos Bairros da Sede com CMEIs" />
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 40 }}>Não foi possível carregar os dados.</div>
            )}
          </div>

          {/* Rosca EM — fictício */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COR, marginBottom: 4, alignSelf: "flex-start" }}>📊 Exemplo Fictício</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16, alignSelf: "flex-start" }}>Bairros da Sede com EMs</div>
            <RoscaChart sim={31} nao={9} titulo="Proporção dos Bairros da Sede com EMs" />
          </div>

          {/* Rosca ETI — fictício */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COR, marginBottom: 4, alignSelf: "flex-start" }}>📊 Exemplo Fictício</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16, alignSelf: "flex-start" }}>Bairros da Sede com ETIs</div>
            <RoscaChart sim={14} nao={26} titulo="Proporção dos Bairros da Sede com ETIs" />
          </div>

        </div>

        {/* Progresso por setor */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Progresso por Setor</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Demandas concluídas vs. total por área</div>
          <BarrasSetor />
        </div>

        {/* ATIVIDADES */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Atividades Recentes</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Últimas movimentações por setor</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {setores.map(s => (
                <button key={s} onClick={() => setFiltroSetor(s)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: filtroSetor === s ? COR : COR_CLARA,
                  color: filtroSetor === s ? "#fff" : COR,
                  transition: "all 0.2s",
                }}>{s}</button>
              ))}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                {["SETOR", "DESCRIÇÃO", "DATA", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atividadesFiltradas.map((a, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: setorStyle[a.setor]?.bg, color: setorStyle[a.setor]?.cor,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                    }}>{a.setor}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155" }}>{a.descricao}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#64748b" }}>{a.data}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: statusStyle[a.status]?.bg, color: statusStyle[a.status]?.cor,
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
