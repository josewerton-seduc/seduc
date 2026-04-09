import { useState } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts"

const COR         = "#b91c1c"   // vermelho principal
const COR_CLARA   = "#fef2f2"   // vermelho muito claro (fundo de cards)
const COR_BORDA   = "#fca5a5"   // vermelho pastel (bordas)
const COR_MEDIA   = "#dc2626"   // vermelho médio (detalhes)

const kpis = [
  { label: "Professores na Rede",      valor: "1.840",  icon: "👩‍🏫", variacao: "ano letivo 2026"         },
  { label: "Formações Realizadas",     valor: 47,       icon: "📚", variacao: "1º trimestre 2026"        },
  { label: "Componentes Curriculares", valor: 28,       icon: "📐", variacao: "Ed. Infantil ao Médio"     },
  { label: "Índice IDEB Médio",        valor: "5,8",    icon: "📊", variacao: "+0,4 vs. ciclo anterior"  },
]

const setores = ["Todos", "Currículo", "Avaliação", "Formação", "Resultados", "Planejamento"]

const atividades = [
  { setor: "Formação",     descricao: "Oficina de letramento — 84 professores capacitados",        data: "26/03", status: "Concluído"    },
  { setor: "Avaliação",    descricao: "Aplicação do Diagnóstico Municipal — Anos Iniciais",         data: "25/03", status: "Concluído"    },
  { setor: "Currículo",    descricao: "Revisão da matriz curricular de Ciências — EF II",           data: "24/03", status: "Em andamento" },
  { setor: "Resultados",   descricao: "Relatório SAEB 2025 — análise por escola encaminhada",       data: "22/03", status: "Concluído"    },
  { setor: "Formação",     descricao: "Semana pedagógica — planejamento curricular integrado",      data: "21/03", status: "Concluído"    },
  { setor: "Planejamento", descricao: "Calendário de formações 2º trimestre — em elaboração",       data: "20/03", status: "Em andamento" },
  { setor: "Avaliação",    descricao: "Devolutiva do simulado municipal — Língua Portuguesa",       data: "18/03", status: "Concluído"    },
  { setor: "Currículo",    descricao: "Alinhamento BNCC — sequências didáticas de Matemática",      data: "17/03", status: "Aguardando"   },
  { setor: "Resultados",   descricao: "Mapeamento de escolas abaixo da meta IDEB — Alerta",        data: "15/03", status: "Alerta"       },
  { setor: "Formação",     descricao: "Formação continuada — uso de dados em sala de aula",         data: "14/03", status: "Concluído"    },
]

const statusStyle = {
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
  "Em andamento": { bg: "#dbeafe", cor: "#1d4ed8" },
  "Aguardando":   { bg: "#fef9c3", cor: "#a16207" },
  "Alerta":       { bg: "#fee2e2", cor: "#b91c1c" },
}

const setorStyle = {
  "Currículo":    { bg: "#fef2f2", cor: "#b91c1c" },
  "Avaliação":    { bg: "#fff7ed", cor: "#c2410c" },
  "Formação":     { bg: "#fdf4ff", cor: "#7e22ce" },
  "Resultados":   { bg: "#dbeafe", cor: "#1d4ed8" },
  "Planejamento": { bg: "#fef9c3", cor: "#a16207" },
}

// Evolução do índice de desempenho por área ao longo do ano
const evolucaoDesempenho = [
  { mes: "Jan", portugues: 5.1, matematica: 4.8, ciencias: 5.0 },
  { mes: "Fev", portugues: 5.3, matematica: 4.9, ciencias: 5.1 },
  { mes: "Mar", portugues: 5.5, matematica: 5.2, ciencias: 5.3 },
  { mes: "Abr", portugues: 5.4, matematica: 5.3, ciencias: 5.4 },
  { mes: "Mai", portugues: 5.7, matematica: 5.5, ciencias: 5.6 },
  { mes: "Jun", portugues: 5.9, matematica: 5.8, ciencias: 5.7 },
]

// Progresso das ações por setor
const dadosBarras = [
  { setor: "Currículo",    concluido: 18, pendente: 5  },
  { setor: "Avaliação",    concluido: 31, pendente: 6  },
  { setor: "Formação",     concluido: 42, pendente: 8  },
  { setor: "Resultados",   concluido: 24, pendente: 4  },
  { setor: "Planejamento", concluido: 11, pendente: 7  },
]

// Distribuição de professores por nível de formação
const pizzaFormacao = [
  { name: "Especialização", value: 820 },
  { name: "Graduação",      value: 640 },
  { name: "Mestrado",       value: 290 },
  { name: "Doutorado",      value: 90  },
]
const CORES_PIZZA = [COR, "#ef4444", "#fca5a5", "#fde8e8"]

// Adesão a formações por área
const pizzaAdesao = [
  { name: "Participaram", value: 74 },
  { name: "Ausentes",     value: 26 },
]
const CORES_ADESAO = [COR, COR_BORDA]

// Escolas acima/abaixo da meta
const pizzaMeta = [
  { name: "Acima da meta", value: 98 },
  { name: "Abaixo da meta", value: 44 },
]
const CORES_META = ["#15803d", "#fca5a5"]

// Radar de competências curriculares
const dadosRadar = [
  { area: "Língua Port.",   atual: 78, meta: 85 },
  { area: "Matemática",     atual: 71, meta: 85 },
  { area: "Ciências",       atual: 74, meta: 80 },
  { area: "História",       atual: 80, meta: 80 },
  { area: "Geografia",      atual: 77, meta: 80 },
  { area: "Ed. Física",     atual: 85, meta: 80 },
  { area: "Arte",           atual: 82, meta: 80 },
]

const TooltipCustom = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fff", border: `1px solid ${COR_BORDA}`,
        borderRadius: 10, padding: "10px 16px", fontSize: 12,
        boxShadow: `0 4px 12px ${COR}22`
      }}>
        <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value}</b></div>
        ))}
      </div>
    )
  }
  return null
}

export default function GGCARFPage() {
  const [filtroSetor, setFiltroSetor] = useState("Todos")

  const atividadesFiltradas = filtroSetor === "Todos"
    ? atividades
    : atividades.filter(a => a.setor === filtroSetor)

  return (
    <div style={{ minHeight: "100vh", background: "#fff5f5", fontFamily: "'Segoe UI', sans-serif", color: "#1a0a0a" }}>

      <Header
        titulo="GGCARF"
        sub="Currículo, Avaliação, Resultados Educacionais e Formação"
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

        {/* ROSCAS — professores, adesão, metas */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Panorama da Rede Docente</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Formação dos professores, adesão às formações e cumprimento de metas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

            {/* Nível de formação */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>Nível de Formação</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaFormacao} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {pizzaFormacao.map((_, i) => <Cell key={i} fill={CORES_PIZZA[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "professores"]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Adesão às formações */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>Adesão às Formações (%)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaAdesao} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={800}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {pizzaAdesao.map((_, i) => <Cell key={i} fill={CORES_ADESAO[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, ""]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Escolas vs. meta */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>Escolas e Meta IDEB</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaMeta} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={400} animationDuration={800}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {pizzaMeta.map((_, i) => <Cell key={i} fill={CORES_META[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "escolas"]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* LINHA + RADAR */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Linha — evolução do desempenho */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Evolução do Desempenho Educacional</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Índice médio por disciplina ao longo do ano letivo</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoDesempenho}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis domain={[4.5, 6.5]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip content={<TooltipCustom />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="portugues"  name="Língua Port."  stroke={COR}       strokeWidth={2.5} dot={{ r: 4 }} animationDuration={800}  />
                <Line type="monotone" dataKey="matematica" name="Matemática"    stroke="#f97316"   strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1000} />
                <Line type="monotone" dataKey="ciencias"   name="Ciências"      stroke="#a855f7"   strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Barras — progresso por setor */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Progresso por Setor</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Ações concluídas vs. pendentes no trimestre</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosBarras} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="setor" type="category" tick={{ fontSize: 10, fill: "#64748b" }} width={80} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="concluido" name="Concluído" fill={COR}     radius={[0,6,6,0]} stackId="a" />
                <Bar dataKey="pendente"  name="Pendente"  fill={COR_BORDA} radius={[0,6,6,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RADAR — cobertura curricular */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Cobertura Curricular por Componente</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
            Percentual de alinhamento dos planos de aula com a BNCC — situação atual vs. meta anual
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={dadosRadar}>
              <PolarGrid stroke="#fee2e2" />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: "#64748b" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar name="Situação Atual" dataKey="atual" stroke={COR}     fill={COR}     fillOpacity={0.35} />
              <Radar name="Meta"           dataKey="meta"  stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, ""]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* TABELA DE ATIVIDADES */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Atividades Recentes</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Últimas movimentações por setor da gerência</div>
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
