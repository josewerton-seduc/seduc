import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"

const gerencias = [
  {
    id: 1,
    nome: "Gerência Geral de Alimentação Escolar",
    rota: "/gg-alimentacao",
    descricao: "Planejamento e Controle de Distribuição dos alimentos",
    atribuicoes: [],
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
    rota: "/gg-organizacao-escolar",
    descricao: "Dimensionar os professores na rede de ensino.",
    atribuicoes: [
      "Dimensionar os professores na rede de ensino.",
      "Classificar e viabilizar a liberação de Licenças.",
      "Realizar a gestão de vagas de creche por meio do Creche Fácil.",
      "Busca Ativa Escolar.",
      "Acompanhamento da condicionalidade \"Educação\" do Programa Bolsa Família.",
      "Normatização.",
      "Acompanhamento da vida escolar do estudante.",
      "Arquivamento de documentos de escolas ativas e extintas.",
      "Acompanhamento de regulamentação das unidades particulares que oferecem a Educação Infantil.",
      "Censo Escolar.",
      "Organização de matrículas da rede.",
      "SIEC.",
      "Autorização de função de Gestor e Secretário Escolar.",
      "Regularização da vida escolar do estudante (Pareceres).",
      "Providenciar autorização de novas unidades escolares.",
    ],
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
    rota: "/gg-financeira",
    descricao: "Elaborar e/ou acompanhar o planejamento financeiro da SEDUC.",
    atribuicoes: [
      "Elaborar e/ou acompanhar o planejamento financeiro da SEDUC.",
      "Controlar entradas e saídas de recursos, bem como acompanhar o fluxo de caixa.",
      "Garantir o efetivo equilíbrio entre receitas e despesas.",
      "Emitir solicitações e pré-empenhos da despesa pública.",
      "Acompanhar a execução do orçamento anual.",
      "Controlar limites legais e financeiros.",
      "Acompanhar e controlar receitas próprias e de transferências.",
      "Emitir relatórios financeiros gerenciais.",
      "Acompanhar e analisar as prestações de contas do PDDE – Programa Dinheiro Direto na Escola.",
    ],
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  },
  {
    id: 4,
    nome: "Gerência Geral de Currículo, Avaliação e Resultados Educacionais e Formação",
    rota: "/ggcarf",
    descricao: "Tem como cerne o fortalecimento da educação da rede municipal, estruturando-se em quatro frentes de trabalho didático-pedagógico.",
    atribuicoes: [
      "Tem como cerne o fortalecimento da educação da rede municipal, estruturando-se em quatro frentes de trabalho didático-pedagógico, a saber:",
      "Currículo – Fruto de um trabalho realizado de forma coletiva e cooperativa, o Currículo de Caruaru expressa, além das exigências legais alinhadas à Base Nacional Comum Curricular (BNCC), uma rica parte diversificada, profundamente vinculada à vida de nossa população, imersa na realidade de uma cidade que respira cultura e se desenvolve sem abrir mão de suas tradições.",
      "Avaliação – Foco nas estratégias formativas de gestão, coordenação, docentes e equipes técnicas da Secretaria de Educação (SEDUC), com vistas ao planejamento de avaliações formativas e somativas, alinhadas às instruções normativas do Ministério da Educação (MEC).",
      "Resultados Educacionais – O núcleo de avaliação planeja e monitora todas as ações referentes às avaliações externas do município (SAEB/IDEB, SAEPE/IDEPE, ICA, CNCA e Fluência Leitora).",
      "Formação – Garantir a formação continuada em rede dos(as) professores(as), enquanto direito público à formação, na perspectiva da autoria docente.",
    ],
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    )
  },
  {
    id: 5,
    nome: "Gerência Geral Jurídica",
    rota: "/gg-juridica",
    descricao: "",
    atribuicoes: [],
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
    rota: "/gg-terceirizadas",
    descricao: "Gerenciar processos de contratação, substituição, transferência e desligamento de terceirizados.",
    atribuicoes: [
      "Gerenciar processos de contratação, substituição, transferência e desligamento de terceirizados.",
      "Organizar e orientar a lotação dos terceirizados conforme necessidade real das unidades.",
      "Fiscalizar o cumprimento da carga horária, função e local de atuação dos contratados.",
      "Centralizar e manter atualizadas as informações dos servidores com as empresas.",
      "Atuar como canal oficial de comunicação entre SEDUC e empresas terceirizadas.",
      "Registrar, formalizar e acompanhar ocorrências envolvendo terceirizados.",
      "Intermediar solicitações entre gestores, servidores e empresas.",
      "Orientar gestores e setores quanto aos procedimentos corretos relacionados aos terceirizados.",
    ],
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
    rota: "/rede-fisica",
    descricao: "Gerente Geral de Rede Física.",
    atribuicoes: [
      "Gerente Geral de Rede Física.",
      "Gerenciar coordenação de zeladoria.",
      "Gerenciar coordenação do prédio.",
      "Articulação de stakeholders.",
    ],
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
    rota: "/gg-centro-distribuicao",
    descricao: "",
    atribuicoes: [],
    icone: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  }
]

// ── Popover flutuante com as atribuições ──────────────────────────────────────
function PopoverAtribuicoes({ gerencia, onClose }) {
  const vazio = gerencia.atribuicoes.length === 0

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", zIndex: 101,
        background: "#fff", border: "1.5px solid #2d6a2d",
        borderRadius: "14px", padding: "24px 28px",
        width: "min(460px, 90vw)", boxShadow: "0 8px 40px rgba(45,106,45,0.18)",
        maxHeight: "80vh", overflowY: "auto",
      }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#2d6a2d", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>
              Atribuições do setor
            </div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a2e1a", lineHeight: "1.4" }}>
              {gerencia.nome}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "#f0f7f0", border: "1px solid #c8e0c8",
            borderRadius: "8px", width: "32px", height: "32px",
            cursor: "pointer", fontSize: "16px", color: "#2d6a2d",
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Lista de atribuições — vazia se não preenchido */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {gerencia.atribuicoes.map((atr, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: "#f0f7f0", border: "1.5px solid #2d6a2d",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: "800", color: "#2d6a2d",
                flexShrink: 0, marginTop: "1px",
              }}>{i + 1}</div>
              <p style={{ fontSize: "13px", color: "#333", lineHeight: "1.6", margin: 0 }}>{atr}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Card de gerência ──────────────────────────────────────────────────────────
function CardGerencia({ gerencia }) {
  const [mostraAtrib, setMostraAtrib] = useState(false)
  const navigate = useNavigate()
  const vazio = gerencia.atribuicoes.length === 0

  return (
    <>
      <div
        onClick={() => navigate(gerencia.rota)}
        style={{
          background: "#fff", border: "1px solid #2d6a2d",
          borderRadius: "12px", padding: "1.5rem",
          display: "flex", flexDirection: "column", gap: "14px",
          boxShadow: "0 4px 16px rgba(45,106,45,0.10)",
          cursor: "pointer", transition: "box-shadow 0.2s, transform 0.15s",
          position: "relative",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(45,106,45,0.22)"
          e.currentTarget.style.transform = "translateY(-2px)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(45,106,45,0.10)"
          e.currentTarget.style.transform = "translateY(0)"
        }}
      >
        {/* Ícone + badge */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "12px", flexShrink: 0,
            background: "#f0f7f0", border: "1px solid #c8e0c8",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#2d6a2d",
          }}>
            {gerencia.icone}
          </div>
          <span style={{
            marginLeft: "auto", fontSize: "11px", fontWeight: "600",
            color: "#2d6a2d", background: "#f0f7f0", border: "1px solid #c8e0c8",
            borderRadius: "20px", padding: "3px 10px",
          }}>Ver painel →</span>
        </div>

        {/* Título */}
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a2e1a", margin: 0, lineHeight: "1.4" }}>
          {gerencia.nome}
        </h3>

        {/* Descrição curta */}
        {gerencia.descricao && (
          <p style={{
            fontSize: "13px", color: "#666", lineHeight: "1.6", margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {gerencia.descricao}
          </p>
        )}

        {/* Botão ver atribuições — sempre visível */}
        <button
          onClick={e => { e.stopPropagation(); setMostraAtrib(true) }}
          style={{
            background: "none", border: "none", padding: 0,
            color: "#2d6a2d", fontSize: "12px", fontWeight: "600",
            cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: "4px",
            alignSelf: "flex-start",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Ver atribuições do setor
        </button>
      </div>

      {mostraAtrib && (
        <PopoverAtribuicoes gerencia={gerencia} onClose={() => setMostraAtrib(false)} />
      )}
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [mostraOrganograma, setMostraOrganograma] = useState(false)

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9f7", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif" }}>

      <Header titulo="SEDUC" sub="Secretaria de Educação e Esportes de Caruaru" />

      <div style={{ padding: "2.5rem 3rem 0", paddingTop: "calc(64px + 2.5rem)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1a2e1a", margin: 0 }}>Gerências</h2>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            Selecione uma gerência para acessar suas funções
          </p>
          <div style={{ height: "3px", width: "48px", background: "#2d6a2d", borderRadius: "2px", marginTop: "12px" }} />
        </div>
        <button
          onClick={() => setMostraOrganograma(true)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 18px", borderRadius: "20px",
            border: "1.5px solid #2d6a2d", background: "#fff",
            color: "#2d6a2d", fontSize: "13px", fontWeight: "600",
            cursor: "pointer", transition: "background 0.15s", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f0f7f0"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" rx="1"/>
            <rect x="1" y="16" width="6" height="4" rx="1"/>
            <rect x="9" y="16" width="6" height="4" rx="1"/>
            <rect x="17" y="16" width="6" height="4" rx="1"/>
            <line x1="12" y1="6" x2="12" y2="12"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="12" x2="4" y2="16"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <line x1="20" y1="12" x2="20" y2="16"/>
          </svg>
          Organograma da Secretaria
        </button>
      </div>

      {/* Botão organograma */}
      {/* Popover organograma */}
      {mostraOrganograma && (
        <>
          <div onClick={() => setMostraOrganograma(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", zIndex: 101,
            background: "#fff", border: "1.5px solid #2d6a2d",
            borderRadius: "14px", padding: "28px 32px",
            width: "min(640px, 90vw)", boxShadow: "0 8px 40px rgba(45,106,45,0.18)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#2d6a2d", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>SEDUC Caruaru</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a2e1a" }}>Organograma da Secretaria</div>
              </div>
              <button onClick={() => setMostraOrganograma(false)} style={{
                background: "#f0f7f0", border: "1px solid #c8e0c8", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer", fontSize: "16px",
                color: "#2d6a2d", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
            {/* Placeholder — organograma a ser inserido */}
            <div style={{
              background: "#f7f9f7", border: "2px dashed #c8e0c8", borderRadius: "10px",
              padding: "48px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🗂️</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Organograma em breve</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>Os dados serão inseridos assim que disponibilizados.</div>
            </div>
          </div>
        </>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
        padding: "2rem 3rem 3rem"
      }}>
        {gerencias.map(g => <CardGerencia key={g.id} gerencia={g} />)}
      </div>

    </div>
  )
}
