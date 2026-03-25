import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"

const gerencias = [
  {
    id: 1,
    nome: "Gerência Geral de Alimentação Escolar",
    descricao: "Responsável pelo planejamento, aquisição e distribuição da alimentação escolar em toda a rede municipal, garantindo nutrição adequada e de qualidade para os alunos.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    )
  },
  {
    id: 2,
    nome: "Gerência Geral de Organização Escolar",
    descricao: "Coordena a estruturação administrativa das unidades escolares, gerenciando matrículas, transferências, documentação e o funcionamento geral das escolas da rede.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    id: 3,
    nome: "Gerência Geral Financeira",
    descricao: "Gerencia os recursos financeiros da secretaria, controlando orçamento, execução de despesas, prestação de contas e planejamento financeiro das ações educacionais.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  },
  {
    id: 4,
    nome: "Gerência Geral de Currículo, Avaliação e Resultados Educacionais e Formação",
    descricao: "Coordena a implementação curricular, avalia os resultados de aprendizagem, analisa indicadores educacionais e promove a formação continuada dos profissionais da educação.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    )
  },
  {
    id: 5,
    nome: "Gerência Geral Jurídica",
    descricao: "Presta assessoria jurídica à secretaria, analisando contratos, emitindo pareceres, acompanhando processos legais e garantindo a conformidade das ações com a legislação vigente.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  },
  {
    id: 6,
    nome: "Gerência Geral das Terceirizadas",
    descricao: "Fiscaliza e coordena os contratos de empresas terceirizadas que prestam serviços à rede municipal de ensino, garantindo qualidade e conformidade contratual.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    id: 7,
    nome: "Gerência Geral de Rede Física",
    descricao: "Responsável pela manutenção, construção e adequação das estruturas físicas das unidades escolares, garantindo ambientes seguros e adequados para o aprendizado.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  {
    id: 8,
    nome: "Gerência Geral do Centro de Distribuição",
    descricao: "Gerencia o recebimento, armazenamento e distribuição de materiais, equipamentos e insumos para todas as unidades escolares da rede municipal de ensino.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  }
]

function CardGerencia({ gerencia }) {
  const [expandido, setExpandido] = useState(false)
  const navigate = useNavigate()
  const textoLongo = gerencia.descricao.length > 100
  const clicavel = gerencia.id === 7 || gerencia.id === 6  || gerencia.id === 5 || gerencia.id === 1 || gerencia.id === 2 || gerencia.id === 4 // ← Rede Física e Terceirizadas e Jurídica

  return (
    <div
      style={{
        ...styles.card,
        cursor: clicavel ? "pointer" : "default",
        border: clicavel ? "1px solid #2d6a2d" : "1px solid #e0ece0",
        boxShadow: clicavel
          ? "0 4px 16px rgba(45,106,45,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)"
      }}
      onClick={() => {
        if (gerencia.id === 7) navigate("/rede-fisica")
        if (gerencia.id === 6) navigate("/gg-terceirizadas")
        if (gerencia.id === 5) navigate("/gg-juridica")
        if (gerencia.id === 1) navigate("/gg-alimentacao")
        if (gerencia.id === 2) navigate("/gg-organizacao-escolar")
        if (gerencia.id === 4) navigate("/ggcarf")
      }}
    >
      <div style={styles.cardIconeWrapper}>
        <div style={styles.cardIcone}>{gerencia.icone}</div>
        {clicavel && (
          <span style={styles.cardBadge}>Ver painel →</span>
        )}
      </div>
      <div style={styles.cardCorpo}>
        <h3 style={styles.cardTitulo}>{gerencia.nome}</h3>
        <p style={{
          ...styles.cardDescricao,
          WebkitLineClamp: expandido ? "unset" : 2,
          overflow: expandido ? "visible" : "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical"
        }}>
          {gerencia.descricao}
        </p>
        {textoLongo && !clicavel && (
          <button
            style={styles.btnExpandir}
            onClick={e => { e.stopPropagation(); setExpandido(!expandido) }}
          >
            {expandido ? "Ver menos ▲" : "Ver mais ▼"}
          </button>
        )}
      </div>
    </div>
  )
}

function DashboardPage() {
  //const navigate = useNavigate()

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <Header
        titulo="SEDUC"
        sub="Secretaria de Educação e Esportes de Caruaru"
      />

      {/* TÍTULO DA SEÇÃO */}
      <div style={styles.secaoTitulo}>
        <h2 style={styles.secaoH2}>Gerências</h2>
        <p style={styles.secaoSub}>Selecione uma gerência para acessar suas funções</p>
        <div style={styles.secaoDivider} />
      </div>

      {/* GRID DE CARDS */}
      <div style={styles.grid}>
        {gerencias.map(g => (
          <CardGerencia key={g.id} gerencia={g} />
        ))}
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
    padding: "0 3rem",
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
  // Pequeno chevron decorativo no header
  headerChevron: {
    width: "6px",
    height: "36px",
    background: "#2d6a2d",
    borderRadius: "3px"
  },
  headerTitulo: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: "3px",
    fontFamily: "Arial, serif",
    margin: 0
  },
  headerSub: {
    fontSize: "11px",
    color: "#888",
    letterSpacing: "0.5px",
    margin: 0
  },
  btnSair: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #c8e0c8",
    background: "transparent",
    color: "#2d6a2d",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.15s"
  },

  // SEÇÃO TÍTULO
  secaoTitulo: {
    padding: "2.5rem 3rem 0",
    paddingTop: "calc(64px + 2.5rem)",  // ← altura do header + espaço original
  },
  secaoH2: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1a2e1a",
    margin: 0
  },
  secaoSub: {
    fontSize: "13px",
    color: "#888",
    marginTop: "4px"
  },
  secaoDivider: {
    height: "3px",
    width: "48px",
    background: "#2d6a2d",
    borderRadius: "2px",
    marginTop: "12px"
  },

  // GRID DE CARDS
  // gridTemplateColumns: controla quantos cards por linha
  // Mude o "300px" para ajustar o tamanho mínimo de cada card
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
    padding: "2rem 3rem 3rem"
  },

  // CARD DE GERÊNCIA
  card: {
    background: "#fff",
    border: "1px solid #e0ece0",
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "box-shadow 0.2s"
  },
  cardIconeWrapper: {
    display: "flex",
    alignItems: "center"
  },
  cardBadge: {
    marginLeft: "auto",
    fontSize: "11px",
    fontWeight: "600",
    color: "#2d6a2d",
    background: "#f0f7f0",
    border: "1px solid #c8e0c8",
    borderRadius: "20px",
    padding: "3px 10px"
    },
  // Círculo verde com ícone
  cardIcone: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    background: "#f0f7f0",
    border: "1px solid #c8e0c8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2d6a2d",
    flexShrink: 0
  },
  cardCorpo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  cardTitulo: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a2e1a",
    margin: 0,
    lineHeight: "1.4"
  },
  cardDescricao: {
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.6",
    margin: 0
  },
  // Botão expandir/retrair
  btnExpandir: {
    background: "none",
    border: "none",
    color: "#2d6a2d",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    marginTop: "2px"
  }
}

export default DashboardPage