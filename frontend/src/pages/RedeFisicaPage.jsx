import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

// ============================================================
// DADOS FICTÍCIOS — substitua pelos reais quando disponível
// ============================================================

const chamadosPorSetor = [
  { setor: "Transporte", abertos: 12, concluidos: 9 },
  { setor: "T.I", abertos: 28, concluidos: 22 },
  { setor: "Coord. Predial", abertos: 17, concluidos: 14 },
  { setor: "Suporte Técnico", abertos: 34, concluidos: 28 },
  { setor: "Atend. Professores", abertos: 21, concluidos: 18 }
]

const statusChamados = [
  { name: "Concluídos", value: 91 },
  { name: "Em andamento", value: 23 },
  { name: "Aguardando", value: 19 }
]

const CORES_PIZZA = ["#2d6a2d", "#6ab06a", "#c8e0c8"]

const timeline = [
  { data: "03/03", setor: "T.I", descricao: "Instalação de equipamentos — EE João XXIII", status: "Concluído" },
  { data: "05/03", setor: "Coord. Predial", descricao: "Reforma telhado — EE Assis Chateaubriand", status: "Concluído" },
  { data: "07/03", setor: "Transporte", descricao: "Manutenção veículo escolar — Van 04", status: "Em andamento" },
  { data: "10/03", setor: "Suporte Técnico", descricao: "Troca projetor — EE Barão de Mauá", status: "Concluído" },
  { data: "12/03", setor: "Atend. Professores", descricao: "Suporte sistema de notas — 14 professores", status: "Concluído" },
  { data: "14/03", setor: "T.I", descricao: "Instalação rede Wi-Fi — EE Rui Barbosa", status: "Em andamento" },
  { data: "17/03", setor: "Coord. Predial", descricao: "Pintura externa — EE Santos Dumont", status: "Aguardando" },
  { data: "19/03", setor: "Suporte Técnico", descricao: "Configuração laboratório de informática", status: "Aguardando" }
]

const corStatus = {
  "Concluído": { bg: "#f0f7f0", text: "#2d6a2d", border: "#c8e0c8" },
  "Em andamento": { bg: "#fff8e6", text: "#b07a00", border: "#ffe4a0" },
  "Aguardando": { bg: "#fff0f0", text: "#c53030", border: "#fed7d7" }
}

const metricas = [
  { label: "Chamados este mês", valor: "133", sub: "+12% vs mês anterior", icone: "📋" },
  { label: "Taxa de conclusão", valor: "68%", sub: "91 de 133 chamados", icone: "✓" },
  { label: "Escolas atendidas", valor: "47", sub: "de 52 unidades", icone: "🏫" },
  { label: "Tempo médio resposta", valor: "1.8d", sub: "Meta: 2 dias", icone: "⏱" }
]

// ============================================================

function RedeFisicaPage() {
  const navigate = useNavigate()
  const [setorAtivo, setSetorAtivo] = useState("Todos")
  const setores = ["Todos", "Transporte", "T.I", "Coord. Predial", "Suporte Técnico", "Atend. Professores"]

  const timelineFiltrada = setorAtivo === "Todos"
    ? timeline
    : timeline.filter(t => t.setor === setorAtivo)

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <Header
        titulo="Gerência Geral de Rede Física"
        sub="Painel de acompanhamento operacional"
        extra="Março 2026"
      />

      <div style={styles.corpo}>

        {/* MÉTRICAS */}
        <div style={styles.metricasGrid}>
          {metricas.map((m, i) => (
            <div key={i} style={styles.metricaCard}>
              <span style={styles.metricaIcone}>{m.icone}</span>
              <div>
                <p style={styles.metricaValor}>{m.valor}</p>
                <p style={styles.metricaLabel}>{m.label}</p>
                <p style={styles.metricaSub}>{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* GRÁFICOS */}
        <div style={styles.graficosRow}>

          {/* BARRAS */}
          <div style={styles.graficoCard}>
            <h3 style={styles.graficoTitulo}>Chamados por setor</h3>
            <p style={styles.graficoSub}>Abertos vs concluídos no mês</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chamadosPorSetor} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="setor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="abertos" name="Abertos" fill="#6ab06a" radius={[4,4,0,0]} />
                <Bar dataKey="concluidos" name="Concluídos" fill="#2d6a2d" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PIZZA */}
          <div style={styles.graficoCard}>
            <h3 style={styles.graficoTitulo}>Status geral dos chamados</h3>
            <p style={styles.graficoSub}>Distribuição por situação atual</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusChamados}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChamados.map((_, i) => (
                    <Cell key={i} fill={CORES_PIZZA[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* TIMELINE */}
        <div style={styles.timelineCard}>
          <div style={styles.timelineHeader}>
            <div>
              <h3 style={styles.graficoTitulo}>Atividades recentes</h3>
              <p style={styles.graficoSub}>Últimas ocorrências registradas</p>
            </div>
            {/* Filtro por setor */}
            <div style={styles.filtros}>
              {setores.map(s => (
                <button
                  key={s}
                  style={{
                    ...styles.filtroBotao,
                    background: setorAtivo === s ? "#2d6a2d" : "#f0f7f0",
                    color: setorAtivo === s ? "#fff" : "#2d6a2d",
                    border: `1px solid ${setorAtivo === s ? "#2d6a2d" : "#c8e0c8"}`
                  }}
                  onClick={() => setSetorAtivo(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <table style={styles.tabela}>
            <thead>
              <tr>
                {["Data", "Setor", "Descrição", "Status"].map(col => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timelineFiltrada.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                  <td style={styles.td}>{item.data}</td>
                  <td style={styles.td}>
                    <span style={styles.setorTag}>{item.setor}</span>
                  </td>
                  <td style={{ ...styles.td, maxWidth: "360px" }}>{item.descricao}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusTag,
                      background: corStatus[item.status].bg,
                      color: corStatus[item.status].text,
                      border: `1px solid ${corStatus[item.status].border}`
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f9f7",
    display: "flex",
    flexDirection: "column"
  },

  // HEADER
  header: {
    background: "#fff",
    borderBottom: "1px solid #e0ece0",
    padding: "0 2.5rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
  },
  headerEsquerda: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  headerChevron: {
    width: "6px",
    height: "36px",
    background: "#2d6a2d",
    borderRadius: "3px"
  },
  headerTitulo: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a2e1a",
    margin: 0
  },
  headerSub: {
    fontSize: "11px",
    color: "#888",
    margin: 0
  },
  headerData: {
    fontSize: "13px",
    color: "#888",
    fontWeight: "500"
  },
  btnVoltar: {
    padding: "7px 14px",
    borderRadius: "8px",
    border: "1px solid #c8e0c8",
    background: "transparent",
    color: "#2d6a2d",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.15s"
  },

  // CORPO
  corpo: {
    padding: "2rem 2.5rem",
    paddingTop: "calc(64px + 2rem)",  // ← altura do header + espaço original
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },

  // MÉTRICAS
  metricasGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem"
  },
  metricaCard: {
    background: "#fff",
    border: "1px solid #e0ece0",
    borderRadius: "12px",
    padding: "1.2rem 1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  metricaIcone: {
    fontSize: "28px",
    lineHeight: 1
  },
  metricaValor: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a2e1a",
    margin: 0,
    lineHeight: 1
  },
  metricaLabel: {
    fontSize: "12px",
    color: "#555",
    margin: "4px 0 2px",
    fontWeight: "500"
  },
  metricaSub: {
    fontSize: "11px",
    color: "#2d6a2d",
    margin: 0
  },

  // GRÁFICOS
  graficosRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  },
  graficoCard: {
    background: "#fff",
    border: "1px solid #e0ece0",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  graficoTitulo: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a2e1a",
    margin: 0
  },
  graficoSub: {
    fontSize: "12px",
    color: "#888",
    margin: "4px 0 1rem"
  },

  // TIMELINE / TABELA
  timelineCard: {
    background: "#fff",
    border: "1px solid #e0ece0",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.2rem",
    flexWrap: "wrap",
    gap: "12px"
  },
  filtros: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap"
  },
  filtroBotao: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s"
  },
  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#888",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e0ece0"
  },
  td: {
    padding: "12px 14px",
    color: "#333",
    borderBottom: "1px solid #f0f7f0",
    verticalAlign: "middle"
  },
  setorTag: {
    background: "#f0f7f0",
    color: "#2d6a2d",
    border: "1px solid #c8e0c8",
    borderRadius: "20px",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  statusTag: {
    borderRadius: "20px",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  }
}

export default RedeFisicaPage