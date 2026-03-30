import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

const COR = "#1a3a8f"
const COR_CLARA = "#f0f4ff"
const COR_BORDA = "#a0b4f0"

const chamadosPorSetor = [
  { setor: "Transporte",         abertos: 12, concluidos: 9  },
  { setor: "T.I",                abertos: 28, concluidos: 22 },
  { setor: "Coord. Predial",     abertos: 17, concluidos: 14 },
  { setor: "Suporte Técnico",    abertos: 34, concluidos: 28 },
  { setor: "Atend. Professores", abertos: 21, concluidos: 18 },
]

const statusChamados = [
  { name: "Concluídos",   value: 91 },
  { name: "Em andamento", value: 23 },
  { name: "Aguardando",   value: 19 },
]

const CORES_PIZZA = ["#1a3a8f", "#4a6fd4", "#a0b4f0"]

const timeline = [
  { data: "03/03", setor: "T.I",                descricao: "Instalação de equipamentos — EE João XXIII",       status: "Concluído"    },
  { data: "05/03", setor: "Coord. Predial",      descricao: "Reforma telhado — EE Assis Chateaubriand",         status: "Concluído"    },
  { data: "07/03", setor: "Transporte",          descricao: "Manutenção veículo escolar — Van 04",              status: "Em andamento" },
  { data: "10/03", setor: "Suporte Técnico",     descricao: "Troca projetor — EE Barão de Mauá",               status: "Concluído"    },
  { data: "12/03", setor: "Atend. Professores",  descricao: "Suporte sistema de notas — 14 professores",        status: "Concluído"    },
  { data: "14/03", setor: "T.I",                 descricao: "Instalação rede Wi-Fi — EE Rui Barbosa",           status: "Em andamento" },
  { data: "17/03", setor: "Coord. Predial",      descricao: "Pintura externa — EE Santos Dumont",               status: "Aguardando"   },
  { data: "19/03", setor: "Suporte Técnico",     descricao: "Configuração laboratório de informática",          status: "Aguardando"   },
]

const metricas = [
  { label: "Chamados este mês",     valor: "133",  sub: "+12% vs mês anterior",  icon: "📋" },
  { label: "Taxa de conclusão",     valor: "68%",  sub: "91 de 133 chamados",    icon: "✅" },
  { label: "Escolas atendidas",     valor: "47",   sub: "de 52 unidades",        icon: "🏫" },
  { label: "Tempo médio resposta",  valor: "1.8d", sub: "Meta: 2 dias",          icon: "⏱️" },
]

const statusStyle = {
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
  "Em andamento": { bg: "#fef9c3", cor: "#a16207" },
  "Aguardando":   { bg: "#fee2e2", cor: "#b91c1c" },
}

const setorStyle = {
  bg: COR_CLARA, cor: COR
}

const TooltipCustom = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #1a3a8f22" }}>
        <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value}</b></div>
        ))}
      </div>
    )
  }
  return null
}

export default function RedeFisicaPage() {
  const navigate = useNavigate()
  const [setorAtivo, setSetorAtivo] = useState("Todos")
  const setores = ["Todos", "Transporte", "T.I", "Coord. Predial", "Suporte Técnico", "Atend. Professores"]

  const timelineFiltrada = setorAtivo === "Todos"
    ? timeline
    : timeline.filter(t => t.setor === setorAtivo)

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Segoe UI', sans-serif" }}>

      <Header
        titulo="Gerência Geral de Rede Física"
        sub="Painel de acompanhamento operacional"
        extra="Março 2026"
        cor={COR}
      />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {metricas.map(m => (
            <div key={m.label} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              boxShadow: `0 2px 12px ${COR}18`, borderLeft: `4px solid ${COR}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: COR }}>{m.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* GRÁFICOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Barras */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Chamados por Setor</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Abertos vs. concluídos no mês</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chamadosPorSetor} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0eaff" />
                <XAxis dataKey="setor" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="abertos"    name="Abertos"    fill="#4a6fd4" radius={[6,6,0,0]} />
                <Bar dataKey="concluidos" name="Concluídos" fill={COR}     radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pizza */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Status Geral dos Chamados</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Distribuição por situação atual</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusChamados}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                  animationBegin={0} animationDuration={800}
                >
                  {statusChamados.map((_, i) => (
                    <Cell key={i} fill={CORES_PIZZA[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "chamados"]} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABELA */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Atividades Recentes</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Últimas ocorrências registradas</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {setores.map(s => (
                <button key={s} onClick={() => setSetorAtivo(s)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: setorAtivo === s ? COR : COR_CLARA,
                  color: setorAtivo === s ? "#fff" : COR,
                  transition: "all 0.2s",
                }}>{s}</button>
              ))}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                {["DATA", "SETOR", "DESCRIÇÃO", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timelineFiltrada.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                  <td style={{ padding: "12px", fontSize: 12, color: "#475569" }}>{item.data}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: COR_CLARA, color: COR, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{item.setor}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155" }}>{item.descricao}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: statusStyle[item.status]?.bg,
                      color: statusStyle[item.status]?.cor,
                      borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600,
                    }}>{item.status}</span>
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
