import { useState } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts"

const COR        = "#b8930a"   // amarelo mostarda principal
const COR_ESCURA = "#8a6d00"   // amarelo escuro
const COR_CLARA  = "#fefce8"   // amarelo muito claro (fundo de cards)
const COR_BORDA  = "#fde047"   // amarelo vibrante (bordas)
const COR_MEDIA  = "#ca9c00"   // amarelo médio

const kpis = [
  { label: "Orçamento Total 2026",       valor: "R$ 48,2M",  icon: "🏛️",  variacao: "LOA aprovada"              },
  { label: "Executado no Trimestre",     valor: "R$ 11,4M",  icon: "💸",  variacao: "23,7% do orçamento anual"  },
  { label: "Repasses Recebidos",         valor: "R$ 6,8M",   icon: "📥",  variacao: "FNDE + Estado + Município"  },
  { label: "Pagamentos Processados",     valor: 312,          icon: "✅",  variacao: "1º trimestre 2026"         },
]

const setores = ["Todos", "Orçamento", "Repasses", "Pagamentos", "Contratos", "Prestação de Contas"]

const atividades = [
  { setor: "Repasses",           descricao: "Recebimento PDDE — R$ 480 mil para escolas municipais",         data: "27/03", status: "Concluído"    },
  { setor: "Pagamentos",         descricao: "Folha de pagamento de docentes — março 2026",                   data: "25/03", status: "Concluído"    },
  { setor: "Orçamento",          descricao: "Liberação de crédito para GGCARF — material didático",          data: "24/03", status: "Concluído"    },
  { setor: "Contratos",          descricao: "Renovação contrato empresa de transporte escolar",              data: "22/03", status: "Em andamento" },
  { setor: "Prestação de Contas",descricao: "Relatório PNAE — 1º bimestre enviado ao FNDE",                  data: "21/03", status: "Concluído"    },
  { setor: "Repasses",           descricao: "PNAE — verba de alimentação escolar creditada",                  data: "20/03", status: "Concluído"    },
  { setor: "Orçamento",          descricao: "Remanejamento de saldo entre programas — aguardando aprovação", data: "18/03", status: "Aguardando"   },
  { setor: "Pagamentos",         descricao: "Pagamento de fornecedores de material de limpeza",              data: "17/03", status: "Concluído"    },
  { setor: "Contratos",          descricao: "Aditivo contratual — empresa de manutenção predial",            data: "15/03", status: "Alerta"       },
  { setor: "Prestação de Contas",descricao: "Auditoria interna — PNATE 2025 — pendências identificadas",     data: "14/03", status: "Alerta"       },
  { setor: "Repasses",           descricao: "Salário Educação — repasse estadual recebido",                  data: "12/03", status: "Concluído"    },
  { setor: "Orçamento",          descricao: "Liberação de crédito suplementar — infraestrutura escolar",     data: "10/03", status: "Em andamento" },
]

const statusStyle = {
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
  "Em andamento": { bg: "#dbeafe", cor: "#1d4ed8" },
  "Aguardando":   { bg: "#fef9c3", cor: "#a16207" },
  "Alerta":       { bg: "#fee2e2", cor: "#b91c1c" },
}

const setorStyle = {
  "Orçamento":          { bg: "#fefce8", cor: "#854d0e" },
  "Repasses":           { bg: "#dbeafe", cor: "#1d4ed8" },
  "Pagamentos":         { bg: "#dcfce7", cor: "#15803d" },
  "Contratos":          { bg: "#fdf4ff", cor: "#7e22ce" },
  "Prestação de Contas":{ bg: "#fff7ed", cor: "#c2410c" },
}

// Execução orçamentária mensal
const execucaoMensal = [
  { mes: "Jan", previsto: 4000, executado: 3620 },
  { mes: "Fev", previsto: 4000, executado: 3890 },
  { mes: "Mar", previsto: 4000, executado: 3910 },
  { mes: "Abr", previsto: 4200, executado: 0    },
  { mes: "Mai", previsto: 4200, executado: 0    },
  { mes: "Jun", previsto: 4200, executado: 0    },
]

// Distribuição do orçamento por programa
const pizzaOrcamento = [
  { name: "Ensino Fundamental", value: 19200 },
  { name: "Ed. Infantil",       value: 11400 },
  { name: "Ensino Médio",       value:  7600 },
  { name: "Programas Federais", value:  6200 },
  { name: "Gestão/Apoio",       value:  3800 },
]
const CORES_PIZZA = [COR, COR_MEDIA, COR_BORDA, "#fef08a", "#d4a017"]

// Origem dos repasses
const pizzaRepasses = [
  { name: "FNDE Federal",   value: 38 },
  { name: "Governo Estadual",value: 29 },
  { name: "Município",      value: 33 },
]
const CORES_REPASSES = [COR, "#64748b", "#94a3b8"]

// Situação dos contratos
const pizzaContratos = [
  { name: "Vigentes",   value: 34 },
  { name: "A renovar",  value: 8  },
  { name: "Encerrados", value: 11 },
]
const CORES_CONTRATOS = ["#15803d", COR, "#e2e8f0"]

// Evolução dos repasses recebidos
const repassesMensais = [
  { mes: "Jan", fnde: 1200, estado: 800, municipio: 900 },
  { mes: "Fev", fnde: 980,  estado: 750, municipio: 900 },
  { mes: "Mar", fnde: 1540, estado: 820, municipio: 900 },
  { mes: "Abr", fnde: 0,    estado: 0,   municipio: 0   },
  { mes: "Mai", fnde: 0,    estado: 0,   municipio: 0   },
  { mes: "Jun", fnde: 0,    estado: 0,   municipio: 0   },
]

// Barras — pagamentos por categoria
const pagamentosCat = [
  { categoria: "Pessoal",       valor: 6800 },
  { categoria: "Material",      valor: 1240 },
  { categoria: "Serviços",      valor: 1870 },
  { categoria: "Contratos",     valor: 920  },
  { categoria: "Investimentos", valor: 570  },
]

const TooltipCustom = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fff", border: `1px solid ${COR_BORDA}`,
        borderRadius: 10, padding: "10px 16px", fontSize: 12,
        boxShadow: `0 4px 12px ${COR}33`
      }}>
        <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            ● {p.name}: <b>{typeof p.value === "number" && p.value > 100 ? `R$ ${p.value.toLocaleString("pt-BR")}` : p.value}</b>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const TooltipMil = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fff", border: `1px solid ${COR_BORDA}`,
        borderRadius: 10, padding: "10px 16px", fontSize: 12,
        boxShadow: `0 4px 12px ${COR}33`
      }}>
        <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            ● {p.name}: <b>R$ {p.value.toLocaleString("pt-BR")}k</b>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function GerenciaFinanceiraPage() {
  const [filtroSetor, setFiltroSetor] = useState("Todos")

  const atividadesFiltradas = filtroSetor === "Todos"
    ? atividades
    : atividades.filter(a => a.setor === filtroSetor)

  const percExecutado = ((11400 / 48200) * 100).toFixed(1)

  return (
    <div style={{ minHeight: "100vh", background: "#fffef0", fontFamily: "'Segoe UI', sans-serif", color: "#1a1200" }}>

      <Header
        titulo="Gerência Financeira"
        sub="Orçamento, Repasses, Pagamentos e Contratos"
        cor={COR}
      />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              boxShadow: `0 2px 12px ${COR}22`, borderLeft: `4px solid ${COR}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COR }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{k.variacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* BARRA DE PROGRESSO ORÇAMENTÁRIO */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}18`, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Execução Orçamentária 2026</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Percentual do orçamento anual já executado até março</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: COR }}>{percExecutado}%</div>
          </div>
          <div style={{ background: COR_CLARA, borderRadius: 99, height: 18, overflow: "hidden", border: `1px solid ${COR_BORDA}` }}>
            <div style={{
              width: `${percExecutado}%`, height: "100%",
              background: `linear-gradient(90deg, ${COR_ESCURA}, ${COR}, ${COR_BORDA})`,
              borderRadius: 99, transition: "width 1s ease"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
            <span>R$ 0</span>
            <span style={{ color: COR, fontWeight: 600 }}>R$ 11,4M executado</span>
            <span>Meta anual: R$ 48,2M</span>
          </div>
        </div>

        {/* ROSCAS — orçamento, repasses, contratos */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Panorama Financeiro</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>Distribuição do orçamento, origem dos repasses e situação dos contratos</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>Orçamento por Programa (R$ mil)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaOrcamento} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}
                    label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}
                  >
                    {pizzaOrcamento.map((_, i) => <Cell key={i} fill={CORES_PIZZA[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`R$ ${v.toLocaleString("pt-BR")}k`, ""]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>Origem dos Repasses (%)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaRepasses} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={800}
                    label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}
                  >
                    {pizzaRepasses.map((_, i) => <Cell key={i} fill={CORES_REPASSES[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, ""]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: COR, marginBottom: 8 }}>Situação dos Contratos</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pizzaContratos} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" animationBegin={400} animationDuration={800}
                    label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}
                  >
                    {pizzaContratos.map((_, i) => <Cell key={i} fill={CORES_CONTRATOS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "contratos"]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AREA + BARRAS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Área — execução mensal previsto vs executado */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Execução Mensal (R$ mil)</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Previsto vs. executado ao longo do ano letivo</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={execucaoMensal}>
                <defs>
                  <linearGradient id="gradPrevisto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COR_BORDA} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COR_BORDA} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradExecutado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COR} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={COR} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} domain={[0, 5000]} />
                <Tooltip content={<TooltipMil />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="previsto"   name="Previsto"   stroke={COR_BORDA}  strokeWidth={2} fill="url(#gradPrevisto)"   />
                <Area type="monotone" dataKey="executado"  name="Executado"  stroke={COR}        strokeWidth={2.5} fill="url(#gradExecutado)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Barras — pagamentos por categoria */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Pagamentos por Categoria (R$ mil)</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Total empenhado no 1º trimestre por natureza de despesa</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pagamentosCat} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="categoria" type="category" tick={{ fontSize: 10, fill: "#64748b" }} width={90} />
                <Tooltip content={<TooltipMil />} />
                <Bar dataKey="valor" name="Valor" fill={COR} radius={[0, 6, 6, 0]}>
                  {pagamentosCat.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COR_ESCURA : i === 4 ? COR_BORDA : COR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINHA — repasses ao longo do trimestre */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Evolução dos Repasses Recebidos (R$ mil)</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
            Repasses mensais por fonte — FNDE Federal, Governo Estadual e Município
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={repassesMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip content={<TooltipMil />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="fnde"      name="FNDE Federal"     stroke={COR}       strokeWidth={2.5} dot={{ r: 4 }} animationDuration={800}  />
              <Line type="monotone" dataKey="estado"    name="Gov. Estadual"    stroke="#64748b"   strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1000} />
              <Line type="monotone" dataKey="municipio" name="Município"        stroke="#f97316"   strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1200} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TABELA DE ATIVIDADES */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Movimentações Recentes</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Últimas ações financeiras registradas na gerência</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {setores.map(s => (
                <button key={s} onClick={() => setFiltroSetor(s)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: filtroSetor === s ? COR : COR_CLARA,
                  color: filtroSetor === s ? "#fff" : COR_ESCURA,
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
