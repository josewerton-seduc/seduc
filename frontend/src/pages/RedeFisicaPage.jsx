import { useState, useEffect } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts"

const COR = "#1a3a8f"
const COR_CLARA = "#f0f4ff"
const COR_BORDA = "#a0b4f0"

// URLs das planilhas reais
const URL_IDEAL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSlwqeOhW2S1rNxrMydAaaHDcde-3jE_akLf7hg2Z3K0wK4UvDcfBlTwiBMnqYG6BI_2PRInY-Xv0XJ/pub?gid=1850294324&single=true&output=csv"
const URL_TAB8  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSlwqeOhW2S1rNxrMydAaaHDcde-3jE_akLf7hg2Z3K0wK4UvDcfBlTwiBMnqYG6BI_2PRInY-Xv0XJ/pub?gid=761726944&single=true&output=csv"

// Parser CSV robusto
function parseCSV(csv) {
  const records = []
  let current = [], field = "", inQ = false
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i], nx = csv[i+1]
    if (ch === '"') { if (inQ && nx === '"') { field += '"'; i++ } else inQ = !inQ }
    else if (ch === ',' && !inQ) { current.push(field.trim()); field = "" }
    else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && nx === '\n') i++
      current.push(field.trim()); field = ""
      if (current.some(c => c !== "")) records.push(current)
      current = []
    } else field += ch
  }
  if (field || current.length) { current.push(field.trim()); if (current.some(c => c !== "")) records.push(current) }
  return records
}

function toInt(v) { return parseInt((v||"").replace(/[^0-9-]/g,"")) || 0 }

const CARGOS = ["ASG","AUX ADM","AUX EDUCAÇÃO","COORD. PÁTIO","LACTARISTA","LAVADEIRA","MERENDEIRO","PORTEIRO","ANALISTA ADM"]

function processarIdeal(records) {
  const escolas = []
  for (let i = 2; i < records.length; i++) {
    const r = records[i]
    const tgs = r[0]?.trim()
    const tipo = r[1]?.trim()
    const nome = r[6]?.trim()
    if (!nome || !tgs || !tgs.match(/^\d+$/)) continue

    const atual  = CARGOS.map((_, j) => toInt(r[7+j]))
    const ideal  = CARGOS.map((_, j) => toInt(r[16+j]))
    const saldo  = CARGOS.map((_, j) => toInt(r[25+j]))
    const totalAtual  = atual.reduce((s,v) => s+v, 0)
    const totalIdeal  = ideal.reduce((s,v) => s+v, 0)
    const faltando    = saldo.reduce((s,v) => s + (v < 0 ? Math.abs(v) : 0), 0)
    const excedente   = saldo.reduce((s,v) => s + (v > 0 ? v : 0), 0)

    escolas.push({
      nome, tgs, tipo,
      alunos: toInt(r[2]),
      porte: r[3]?.trim(),
      salas: toInt(r[4]),
      atual, ideal, saldo,
      totalAtual, totalIdeal, faltando, excedente,
    })
  }

  const totalEscolas   = escolas.length
  const totalFaltando  = escolas.reduce((s,e) => s+e.faltando, 0)
  const totalExcedente = escolas.reduce((s,e) => s+e.excedente, 0)
  const totalAtual     = escolas.reduce((s,e) => s+e.totalAtual, 0)

  const defasagemCargo = CARGOS.map((cargo, j) => {
    const falt = escolas.reduce((s,e) => s + (e.saldo[j] < 0 ? Math.abs(e.saldo[j]) : 0), 0)
    const exc  = escolas.reduce((s,e) => s + (e.saldo[j] > 0 ? e.saldo[j] : 0), 0)
    return { cargo, faltando: falt, excedente: exc }
  }).sort((a,b) => b.faltando - a.faltando)

  const porTGS = {}
  escolas.forEach(e => {
    if (!porTGS[e.tgs]) porTGS[e.tgs] = { tgs: `TGS ${e.tgs}`, tgsNum: e.tgs, escolas: 0, faltando: 0, excedente: 0, atual: 0 }
    porTGS[e.tgs].escolas++
    porTGS[e.tgs].faltando += e.faltando
    porTGS[e.tgs].excedente += e.excedente
    porTGS[e.tgs].atual += e.totalAtual
  })
  const dadosTGS = Object.values(porTGS).sort((a,b) => a.tgs.localeCompare(b.tgs))

  const porTipo = {}
  escolas.forEach(e => {
    if (!porTipo[e.tipo]) porTipo[e.tipo] = { tipo: e.tipo, escolas: 0, faltando: 0, excedente: 0 }
    porTipo[e.tipo].escolas++
    porTipo[e.tipo].faltando += e.faltando
    porTipo[e.tipo].excedente += e.excedente
  })

  const topDefasadas = [...escolas].sort((a,b) => b.faltando - a.faltando).slice(0,10)

  return { escolas, totalEscolas, totalFaltando, totalExcedente, totalAtual, defasagemCargo, dadosTGS, porTipo, topDefasadas }
}

function processarTab8(records) {
  const dados = records.slice(2).filter(r => r[0] && r[0].trim())
  const totalPorFuncao = {
    "ASG": 0, "AUX ADM": 0, "AUX DE EDUCAÇÃO": 0,
    "COORDENADOR DE PÁTIO": 0, "LACTARISTA": 0, "LAVADEIRA": 0,
    "MERENDEIRA(O)": 0, "PORTEIRO": 0
  }
  dados.forEach(r => {
    Object.keys(totalPorFuncao).forEach((k, i) => {
      totalPorFuncao[k] += toInt(r[1+i])
    })
  })
  return Object.entries(totalPorFuncao)
    .map(([funcao, total]) => ({ funcao: funcao.replace("MERENDEIRA(O)","MERENDEIRO").replace("AUX DE EDUCAÇÃO","AUX EDUCAÇÃO").replace("COORDENADOR DE PÁTIO","COORD. PÁTIO"), total }))
    .filter(d => d.total > 0)
    .sort((a,b) => b.total - a.total)
}

const timelineFicticia = [
  { data: "03/03", setor: "T.I",           descricao: "Instalação equipamentos — EE João XXIII",      status: "Concluído"    },
  { data: "05/03", setor: "Coord. Predial", descricao: "Reforma telhado — EE Assis Chateaubriand",    status: "Concluído"    },
  { data: "10/03", setor: "Suporte Técnico",descricao: "Troca projetor — EE Barão de Mauá",           status: "Concluído"    },
  { data: "12/03", setor: "Coord. Predial", descricao: "Vistoria estrutural — CMEI Jardim das Flores", status: "Em andamento" },
  { data: "14/03", setor: "T.I",           descricao: "Instalação rede Wi-Fi — EE Rui Barbosa",       status: "Em andamento" },
  { data: "17/03", setor: "Suporte Técnico",descricao: "Config. laboratório informática",              status: "Aguardando"   },
]

const statusStyle = {
  "Concluído":    { bg: "#dcfce7", cor: "#15803d" },
  "Em andamento": { bg: "#dbeafe", cor: "#1d4ed8" },
  "Aguardando":   { bg: "#fef9c3", cor: "#a16207" },
}

const COR_TIPO = { "EM": "#1d7fc4", "CMEI": "#2d6a4f", "ETI": "#7c3371", "CEI": "#c0521a" }
const COR_TGS  = ["#1a3a8f","#2563eb","#3b82f6","#60a5fa","#93c5fd","#0369a1","#0284c7","#0ea5e9","#38bdf8"]

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #1a3a8f22" }}>
      <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value.toLocaleString("pt-BR")}</b></div>)}
    </div>
  )
}

export default function RedeFisicaPage() {
  const [dados, setDados] = useState(null)
  const [funcoes, setFuncoes] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // ── AJUSTE 2: múltipla seleção de tipos ──────────────────────────────────────
  // Agora filtroTipos é um Set (pode ter vários selecionados)
  const [filtroTipos, setFiltroTipos] = useState(new Set(["Todos"]))
  // ─────────────────────────────────────────────────────────────────────────────

  const [filtroTGS, setFiltroTGS] = useState("Todos")
  const [busca, setBusca] = useState("")
  const [abaAtiva, setAbaAtiva] = useState("quadro")

  // ── AJUSTE 3: TGS selecionada nos gráficos ───────────────────────────────────
  const [tgsSelecionada, setTgsSelecionada] = useState(null)
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch(URL_IDEAL).then(r => r.text()),
      fetch(URL_TAB8).then(r => r.text()),
    ]).then(([csvIdeal, csvTab8]) => {
      setDados(processarIdeal(parseCSV(csvIdeal)))
      setFuncoes(processarTab8(parseCSV(csvTab8)))
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [])

  if (carregando) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", color: COR }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando dados das unidades escolares...</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Buscando informações do Google Sheets</div>
      </div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
      <div style={{ textAlign: "center", color: "#b91c1c" }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Erro ao carregar dados.</div>
      </div>
    </div>
  )

  const { totalEscolas, totalFaltando, totalExcedente, totalAtual, defasagemCargo, dadosTGS, porTipo, topDefasadas, escolas } = dados

  // ── AJUSTE 1: "Unidades Escolares" em vez de "Escola/Escolas" ────────────────
  const kpis = [
    { label: "Unidades Escolares Monitoradas", valor: totalEscolas, icon: "🏫", variacao: "EM, CMEI, ETI e CEI" },
    { label: "Funcionários Ativos",            valor: totalAtual.toLocaleString("pt-BR"), icon: "👥", variacao: "quadro de apoio atual" },
    { label: "Vagas Faltando",                 valor: totalFaltando, icon: "⚠️", variacao: "abaixo do ideal" },
    { label: "Vagas Excedentes",               valor: totalExcedente, icon: "✅", variacao: "acima do ideal" },
  ]
  // ─────────────────────────────────────────────────────────────────────────────

  // ── AJUSTE 2: lógica de toggle de tipos ──────────────────────────────────────
  const toggleTipo = (tipo) => {
    if (tipo === "Todos") {
      setFiltroTipos(new Set(["Todos"]))
      return
    }
    setFiltroTipos(prev => {
      const next = new Set(prev)
      // Remove "Todos" ao selecionar um tipo específico
      next.delete("Todos")
      if (next.has(tipo)) {
        next.delete(tipo)
        // Se ficou vazio, volta para "Todos"
        if (next.size === 0) next.add("Todos")
      } else {
        next.add(tipo)
      }
      return next
    })
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // Escolas filtradas (com múltipla seleção de tipo)
  const escolasFiltradas = escolas.filter(e => {
    const okTipo  = filtroTipos.has("Todos") || filtroTipos.has(e.tipo)
    const okTGS   = filtroTGS === "Todos" || e.tgs === filtroTGS
    const okBusca = busca === "" || e.nome.toLowerCase().includes(busca.toLowerCase())
    return okTipo && okTGS && okBusca
  })

  const tipos    = ["Todos", ...Object.keys(porTipo).filter(t => t !== "TIPO")]
  const tgsList  = ["Todos", ...["1","2","3","4","5","6","7","8","9"]]

  const pizzaTipo = Object.entries(porTipo)
    .filter(([t]) => t !== "TIPO")
    .map(([tipo, d]) => ({ name: tipo, value: d.escolas, fill: COR_TIPO[tipo] || "#94a3b8" }))

  // ── AJUSTE 3: unidades escolares da TGS selecionada ──────────────────────────
  const escolasDaTGS = tgsSelecionada
    ? escolas.filter(e => e.tgs === tgsSelecionada).sort((a,b) => b.faltando - a.faltando)
    : []
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Segoe UI', sans-serif", color: "#0c1a4e" }}>
      <Header titulo="Gerência Geral de Rede Física" sub="Painel de acompanhamento operacional" extra="Março 2026" cor={COR} />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: `0 2px 12px ${COR}18`, borderLeft: `4px solid ${COR}`, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: COR }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{k.variacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ABAS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { id: "quadro", label: "📊 Quadro de Apoio" },
            { id: "tgs",    label: "🗺️ Por Zona (TGS)" },
            { id: "outros", label: "🔧 Outros Setores" },
          ].map(a => (
            <button key={a.id} onClick={() => setAbaAtiva(a.id)} style={{
              padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: abaAtiva === a.id ? COR : "#fff",
              color: abaAtiva === a.id ? "#fff" : COR,
              boxShadow: "0 2px 8px #1a3a8f18",
              transition: "all 0.2s",
            }}>{a.label}</button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            ABA: QUADRO DE APOIO
        ══════════════════════════════════════════════════════════ */}
        {abaAtiva === "quadro" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Defasagem por Função</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Vagas faltando vs. excedentes em toda a rede</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={defasagemCargo} layout="vertical" barGap={4} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis dataKey="cargo" type="category" tick={{ fontSize: 10, fill: "#334155" }} width={90} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="faltando"  name="Faltando"  fill="#ef4444" radius={[0,4,4,0]} animationDuration={800} />
                    <Bar dataKey="excedente" name="Excedente" fill="#22c55e" radius={[0,4,4,0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                  {/* AJUSTE 1: "Unidades Escolares por Tipo" */}
                  <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Unidades Escolares por Tipo</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Distribuição da rede municipal</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pizzaTipo} cx="50%" cy="45%" innerRadius={42} outerRadius={68}
                        paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}
                      >
                        {pizzaTipo.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v, name]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {funcoes && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Funcionários Ativos por Função</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Quadro real de servidores de apoio em toda a rede</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={funcoes} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                    <XAxis dataKey="funcao" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => [v.toLocaleString("pt-BR"), "funcionários"]} />
                    <Bar dataKey="total" name="Funcionários" radius={[6,6,0,0]} animationDuration={800}>
                      {funcoes.map((_, i) => <Cell key={i} fill={COR_TGS[i % COR_TGS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top 10 mais defasadas — AJUSTE 1: "Unidades Escolares" */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>🚨 Top 10 Unidades Escolares Mais Defasadas</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Unidades com maior número de vagas abaixo do ideal</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topDefasadas.map(e => ({ nome: e.nome.length > 25 ? e.nome.slice(0,25)+"…" : e.nome, faltando: e.faltando, tipo: e.tipo }))} layout="vertical" barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={180} />
                  <Tooltip formatter={(v) => [`-${v} vagas`, "defasagem"]} />
                  <Bar dataKey="faltando" name="Vagas faltando" fill="#ef4444" radius={[0,6,6,0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ══════════════════════════════════════════════════════════
                TABELA — AJUSTE 2: múltipla seleção de tipos
            ══════════════════════════════════════════════════════════ */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  {/* AJUSTE 1 */}
                  <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Quadro Detalhado por Unidade Escolar</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Situação atual vs. ideal de cada unidade</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    placeholder="🔍 Buscar unidade escolar..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${COR_BORDA}`, fontSize: 12, outline: "none", width: 200 }}
                  />
                  {/* AJUSTE 2: botões com múltipla seleção */}
                  {tipos.map(t => {
                    const ativo = filtroTipos.has(t)
                    return (
                      <button key={t} onClick={() => toggleTipo(t)} style={{
                        padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                        fontSize: 11, fontWeight: 600, transition: "all 0.2s",
                        // "Todos" tem borda, os outros têm estilo sólido quando ativos
                        border: t === "Todos"
                          ? `2px solid ${ativo ? COR : COR_BORDA}`
                          : `2px solid ${ativo ? (COR_TIPO[t] || COR) : COR_BORDA}`,
                        background: ativo
                          ? (t === "Todos" ? COR : (COR_TIPO[t] || COR))
                          : "#fff",
                        color: ativo ? "#fff" : (t === "Todos" ? COR : (COR_TIPO[t] || COR)),
                      }}>
                        {t !== "Todos" && ativo && <span style={{ marginRight: 4 }}>✓</span>}
                        {t}
                      </button>
                    )
                  })}
                  <select value={filtroTGS} onChange={e => setFiltroTGS(e.target.value)} style={{
                    padding: "5px 12px", borderRadius: 20, border: `1px solid ${COR_BORDA}`,
                    fontSize: 11, background: "#fff", color: COR, cursor: "pointer",
                  }}>
                    {tgsList.map(t => <option key={t} value={t}>{t === "Todos" ? "Todas as TGS" : `TGS ${t}`}</option>)}
                  </select>
                </div>
              </div>

              {/* Chips dos tipos selecionados (quando não for "Todos") */}
              {!filtroTipos.has("Todos") && (
                <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Filtrando por:</span>
                  {[...filtroTipos].map(t => (
                    <span key={t} style={{
                      background: (COR_TIPO[t] || COR) + "22",
                      color: COR_TIPO[t] || COR,
                      border: `1px solid ${COR_TIPO[t] || COR}`,
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 4, cursor: "pointer"
                    }} onClick={() => toggleTipo(t)}>
                      {t} <span style={{ fontSize: 10 }}>✕</span>
                    </span>
                  ))}
                  <button onClick={() => setFiltroTipos(new Set(["Todos"]))} style={{
                    fontSize: 11, color: "#94a3b8", background: "none", border: "none",
                    cursor: "pointer", textDecoration: "underline"
                  }}>Limpar filtros</button>
                </div>
              )}

              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
                Exibindo <b>{escolasFiltradas.length}</b> de {totalEscolas} unidades escolares
                {!filtroTipos.has("Todos") && (
                  <span style={{ color: COR, marginLeft: 6 }}>
                    — {[...filtroTipos].join(", ")} selecionado{filtroTipos.size > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                      {["TGS","TIPO","UNIDADE ESCOLAR","ALUNOS","PORTE","ATUAL","IDEAL","FALTANDO","EXCEDENTE"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {escolasFiltradas.slice(0,50).map((e, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}`, background: i % 2 === 0 ? "#fff" : "#f8fbff" }}>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>
                          <span style={{ background: COR, color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>TGS {e.tgs}</span>
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <span style={{ background: (COR_TIPO[e.tipo]||"#94a3b8")+"22", color: COR_TIPO[e.tipo]||"#94a3b8", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{e.tipo}</span>
                        </td>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: "#334155", fontWeight: 500, maxWidth: 220 }}>{e.nome}</td>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: "#475569", textAlign: "center" }}>{e.alunos}</td>
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#64748b" }}>{e.porte}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontWeight: 700, color: COR, textAlign: "center" }}>{e.totalAtual}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "center" }}>{e.totalIdeal}</td>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>
                          {e.faltando > 0
                            ? <span style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>-{e.faltando}</span>
                            : <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>
                          {e.excedente > 0
                            ? <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>+{e.excedente}</span>
                            : <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {escolasFiltradas.length > 50 && (
                  <div style={{ textAlign: "center", padding: 16, fontSize: 12, color: "#94a3b8" }}>
                    Mostrando 50 de {escolasFiltradas.length} unidades. Use os filtros para refinar.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            ABA: POR ZONA (TGS) — AJUSTE 3: clicar no card/barra mostra unidades
        ══════════════════════════════════════════════════════════ */}
        {abaAtiva === "tgs" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

              {/* Gráfico clicável — faltando/excedente por TGS */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Vagas Faltando por TGS</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Zonas com maior defasagem no quadro de apoio</div>
                <div style={{ fontSize: 11, color: COR, marginBottom: 12, fontStyle: "italic" }}>
                  💡 Clique em uma barra para ver as unidades escolares da TGS
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={dadosTGS}
                    barCategoryGap="25%"
                    onClick={(d) => {
                      if (d?.activePayload?.[0]) {
                        const tgsNum = d.activeLabel?.replace("TGS ","")
                        setTgsSelecionada(prev => prev === tgsNum ? null : tgsNum)
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                    <XAxis dataKey="tgs" tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="faltando"  name="Faltando"  radius={[4,4,0,0]} animationDuration={800}>
                      {dadosTGS.map((d, i) => (
                        <Cell key={i} fill={tgsSelecionada === d.tgsNum ? "#b91c1c" : "#ef4444"}
                          opacity={tgsSelecionada && tgsSelecionada !== d.tgsNum ? 0.4 : 1} />
                      ))}
                    </Bar>
                    <Bar dataKey="excedente" name="Excedente" radius={[4,4,0,0]} animationDuration={1000}>
                      {dadosTGS.map((d, i) => (
                        <Cell key={i} fill={tgsSelecionada === d.tgsNum ? "#15803d" : "#22c55e"}
                          opacity={tgsSelecionada && tgsSelecionada !== d.tgsNum ? 0.4 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico clicável — funcionários por TGS */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Funcionários Ativos por TGS</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Total de quadro de apoio por zona</div>
                <div style={{ fontSize: 11, color: COR, marginBottom: 12, fontStyle: "italic" }}>
                  💡 Clique em uma barra para ver as unidades escolares da TGS
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={dadosTGS}
                    barCategoryGap="30%"
                    onClick={(d) => {
                      if (d?.activePayload?.[0]) {
                        const tgsNum = d.activeLabel?.replace("TGS ","")
                        setTgsSelecionada(prev => prev === tgsNum ? null : tgsNum)
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                    <XAxis dataKey="tgs" tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => [v.toLocaleString("pt-BR"), "funcionários"]} />
                    <Bar dataKey="atual" name="Funcionários ativos" radius={[4,4,0,0]} animationDuration={800}>
                      {dadosTGS.map((d, i) => (
                        <Cell key={i}
                          fill={tgsSelecionada === d.tgsNum ? COR : COR_TGS[i % COR_TGS.length]}
                          opacity={tgsSelecionada && tgsSelecionada !== d.tgsNum ? 0.3 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cards por TGS — clicáveis */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {dadosTGS.map((tgs, i) => {
                const selecionado = tgsSelecionada === tgs.tgsNum
                return (
                  <div
                    key={tgs.tgs}
                    onClick={() => setTgsSelecionada(prev => prev === tgs.tgsNum ? null : tgs.tgsNum)}
                    style={{
                      background: selecionado ? COR : "#fff",
                      borderRadius: 14, padding: 20,
                      boxShadow: selecionado ? `0 4px 20px ${COR}55` : `0 2px 12px ${COR}11`,
                      borderTop: `4px solid ${COR_TGS[i]}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      transform: selecionado ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: selecionado ? "#fff" : COR_TGS[i] }}>{tgs.tgs}</div>
                      <span style={{ fontSize: 11, color: selecionado ? "#cbd5e1" : "#64748b" }}>{tgs.escolas} unidades</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: selecionado ? "#fff" : COR_TGS[i] }}>{tgs.atual}</div>
                        <div style={{ fontSize: 9, color: selecionado ? "#cbd5e1" : "#94a3b8" }}>Ativos</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: selecionado ? "#fca5a5" : "#ef4444" }}>-{tgs.faltando}</div>
                        <div style={{ fontSize: 9, color: selecionado ? "#cbd5e1" : "#94a3b8" }}>Faltando</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: selecionado ? "#bbf7d0" : "#22c55e" }}>+{tgs.excedente}</div>
                        <div style={{ fontSize: 9, color: selecionado ? "#cbd5e1" : "#94a3b8" }}>Excedente</div>
                      </div>
                    </div>
                    {selecionado && (
                      <div style={{ marginTop: 10, fontSize: 11, color: "#93c5fd", textAlign: "center" }}>
                        ▼ Ver unidades abaixo
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── AJUSTE 3: painel de unidades escolares da TGS selecionada ── */}
            {tgsSelecionada && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 4px 24px ${COR}22`, border: `2px solid ${COR}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: COR }}>
                      📍 Unidades Escolares — TGS {tgsSelecionada}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {escolasDaTGS.length} unidade{escolasDaTGS.length !== 1 ? "s" : ""} · ordenadas por maior defasagem
                    </div>
                  </div>
                  <button
                    onClick={() => setTgsSelecionada(null)}
                    style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${COR_BORDA}`, background: "#fff", color: COR, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    ✕ Fechar
                  </button>
                </div>

                {/* Mini KPIs da TGS */}
                {(() => {
                  const tgsInfo = dadosTGS.find(d => d.tgsNum === tgsSelecionada)
                  return tgsInfo ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                      {[
                        { label: "Unidades", valor: tgsInfo.escolas, icon: "🏫", cor: COR },
                        { label: "Funcionários Ativos", valor: tgsInfo.atual, icon: "👥", cor: COR },
                        { label: "Vagas Faltando", valor: tgsInfo.faltando, icon: "⚠️", cor: "#ef4444" },
                        { label: "Vagas Excedentes", valor: tgsInfo.excedente, icon: "✅", cor: "#22c55e" },
                      ].map(k => (
                        <div key={k.label} style={{ background: COR_CLARA, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{k.icon}</span>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: k.cor }}>{k.valor}</div>
                            <div style={{ fontSize: 10, color: "#64748b" }}>{k.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                        {["TIPO","UNIDADE ESCOLAR","ALUNOS","PORTE","ATUAL","IDEAL","FALTANDO","EXCEDENTE"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {escolasDaTGS.map((e, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}`, background: i % 2 === 0 ? "#fff" : "#f8fbff" }}>
                          <td style={{ padding: "9px 10px" }}>
                            <span style={{ background: (COR_TIPO[e.tipo]||"#94a3b8")+"22", color: COR_TIPO[e.tipo]||"#94a3b8", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{e.tipo}</span>
                          </td>
                          <td style={{ padding: "9px 10px", fontSize: 12, color: "#334155", fontWeight: 500 }}>{e.nome}</td>
                          <td style={{ padding: "9px 10px", fontSize: 12, color: "#475569", textAlign: "center" }}>{e.alunos}</td>
                          <td style={{ padding: "9px 10px", fontSize: 11, color: "#64748b" }}>{e.porte}</td>
                          <td style={{ padding: "9px 10px", fontSize: 13, fontWeight: 700, color: COR, textAlign: "center" }}>{e.totalAtual}</td>
                          <td style={{ padding: "9px 10px", fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "center" }}>{e.totalIdeal}</td>
                          <td style={{ padding: "9px 10px", textAlign: "center" }}>
                            {e.faltando > 0
                              ? <span style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>-{e.faltando}</span>
                              : <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>}
                          </td>
                          <td style={{ padding: "9px 10px", textAlign: "center" }}>
                            {e.excedente > 0
                              ? <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>+{e.excedente}</span>
                              : <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            ABA: OUTROS SETORES
        ══════════════════════════════════════════════════════════ */}
        {abaAtiva === "outros" && (
          <>
            <div style={{ background: "#fff7ed", border: "1.5px solid #fdba74", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 22 }}>ℹ️</span>
              <div style={{ fontSize: 13, color: "#92400e" }}>
                Os dados abaixo são <b>exemplos fictícios</b> para T.I, Coord. Predial e Suporte Técnico, enquanto aguardamos as planilhas reais desses setores.
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Atividades Recentes — Outros Setores</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>T.I, Coordenação Predial e Suporte Técnico</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                    {["DATA","SETOR","DESCRIÇÃO","STATUS"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timelineFicticia.map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                      <td style={{ padding: "12px", fontSize: 12, color: "#475569" }}>{item.data}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: COR_CLARA, color: COR, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{item.setor}</span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 13, color: "#334155" }}>{item.descricao}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: statusStyle[item.status]?.bg, color: statusStyle[item.status]?.cor, borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600 }}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* RODAPÉ EXPLICATIVO */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginTop: 24, borderLeft: `4px solid #94a3b8` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#475569", marginBottom: 12 }}>📖 Como ler este painel</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            <div>
              <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>🔴 Faltando (vermelho)</div>
              Unidades que estão com <b>menos funcionários do que o ideal</b> para aquela função. Indica necessidade de contratação.
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>🟢 Excedente (verde)</div>
              Unidades com <b>mais funcionários do que o ideal</b>. Pode indicar que o quadro ideal ainda não foi atualizado na planilha, ou que houve remanejamento interno.
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>⚠️ Sobre os dados</div>
              Os valores exibidos são lidos diretamente da planilha do Google Sheets. Unidades com Nº Ideal = 0 podem indicar que o quadro ideal ainda não foi preenchido.
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>🗺️ O que é TGS?</div>
              TGS (Território de Gestão Setorial) é a divisão geográfica da cidade em zonas escolares. Caruaru está dividida em 9 TGS, cada uma agrupando unidades escolares de uma região.
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}