import { useState, useEffect } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts"

const COR = "#2d6a4f"
const COR_CLARA = "#f0f7f2"
const COR_BORDA = "#a8d5b5"

const kpis = [
  { label: "Unidades Escolares",  valor: 142,    icon: "🏫", variacao: "rede completa"        },
  { label: "Matrículas Ativas",   valor: "18.2k", icon: "📋", variacao: "ano letivo 2026"      },
  { label: "Em Busca Ativa",      valor: 134,    icon: "🔍", variacao: "crianças localizadas"  },
  { label: "Rotas de Transporte", valor: 38,     icon: "🚌", variacao: "em operação"           },
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

const dadosBarras = [
  { setor: "Transporte",     concluido: 31, pendente: 7  },
  { setor: "Matrícula",      concluido: 238, pendente: 7 },
  { setor: "Busca Ativa",    concluido: 98, pendente: 36 },
  { setor: "Infra",          concluido: 7,  pendente: 5  },
  { setor: "Planejamento",   concluido: 14, pendente: 4  },
]

const evolucaoMatriculas = [
  { mes: "Jan", cmei: 5100, em: 9400, eti: 3200 },
  { mes: "Fev", mes2: "Fev", cmei: 5150, em: 9500, eti: 3250 },
  { mes: "Mar", cmei: 5200, em: 9800, eti: 3400 },
  { mes: "Abr", cmei: 5180, em: 9750, eti: 3380 },
  { mes: "Mai", cmei: 5220, em: 9900, eti: 3420 },
  { mes: "Jun", cmei: 5250, em: 10100, eti: 3500 },
]

const TooltipCustom = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #2d6a4f22" }}>
        <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value}</b></div>
        ))}
      </div>
    )
  }
  return null
}

export default function GGOrganizacaoPage() {
  const [filtroSetor, setFiltroSetor] = useState("Todos")
  const [dadosCmei, setDadosCmei] = useState({ sim: 0, nao: 0 })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIQHfxXu2ZDPI2q_zIsa5eIjKgCibY8NYCDTnKhI0Gc3zWtGQlknFU_zSx0P52XBYwCeGEwxYz08Jl/pub?output=csv"
    fetch(url)
      .then(r => r.text())
      .then(csv => {
        const linhas = csv.trim().split("\n").slice(1)
        let sim = 0, nao = 0
        linhas.forEach(l => {
          const cols = l.split(",")
          const val = cols[2]?.trim().toUpperCase().replace(/[^A-Z]/g, "")
          if (val === "SIM") sim++
          else if (val === "NAO") nao++
        })
        setDadosCmei({ sim, nao })
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  const pizzaCmei = [
    { name: "Com CMEI",    value: dadosCmei.sim || 22 },
    { name: "Sem CMEI",    value: dadosCmei.nao || 18 },
  ]
  const pizzaEm = [
    { name: "Com EM",  value: 31 },
    { name: "Sem EM",  value: 9  },
  ]
  const pizzaEti = [
    { name: "Com ETI", value: 14 },
    { name: "Sem ETI", value: 26 },
  ]

  const CORES_CMEI = ["#2d6a4f", "#a8d5b5"]
  const CORES_EM   = ["#1d7fc4", "#bae6fd"]
  const CORES_ETI  = ["#7c3371", "#d4a0ce"]

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

        {/* ROSCAS — bairros com escolas */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Cobertura Escolar por Bairro</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Proporção dos bairros da sede que possuem cada tipo de escola</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

            {/* CMEI — dados reais */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>
                CMEIs {carregando ? "⏳" : "📊"}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaCmei} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {pizzaCmei.map((_, i) => <Cell key={i} fill={CORES_CMEI[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "bairros"]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              {!carregando && dadosCmei.sim === 0 && (
                <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>Usando dados de exemplo</div>
              )}
            </div>

            {/* EM — fictício */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1d7fc4", marginBottom: 8 }}>EMs (Exemplo)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaEm} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={800}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {pizzaEm.map((_, i) => <Cell key={i} fill={CORES_EM[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "bairros"]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ETI — fictício */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#7c3371", marginBottom: 8 }}>ETIs (Exemplo)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaEti} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={400} animationDuration={800}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {pizzaEti.map((_, i) => <Cell key={i} fill={CORES_ETI[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "bairros"]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRÁFICOS LINHA + BARRAS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Linha — evolução matrículas */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Evolução de Matrículas</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Por tipo de escola ao longo do ano</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoMatriculas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f0e8" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip content={<TooltipCustom />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cmei" name="CMEI" stroke="#2d6a4f" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={800} />
                <Line type="monotone" dataKey="em"   name="EM"   stroke="#1d7fc4" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1000} />
                <Line type="monotone" dataKey="eti"  name="ETI"  stroke="#7c3371" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Barras — progresso por setor */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Progresso por Setor</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Demandas concluídas vs. pendentes</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosBarras} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f0e8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="setor" type="category" tick={{ fontSize: 10, fill: "#64748b" }} width={80} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="concluido" name="Concluído" fill={COR}       radius={[0,6,6,0]} stackId="a" />
                <Bar dataKey="pendente"  name="Pendente"  fill="#a8d5b5"   radius={[0,6,6,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABELA */}
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
                    <span style={{ background: setorStyle[a.setor]?.bg, color: setorStyle[a.setor]?.cor, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{a.setor}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155" }}>{a.descricao}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#64748b" }}>{a.data}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: statusStyle[a.status]?.bg, color: statusStyle[a.status]?.cor, borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600 }}>{a.status}</span>
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
