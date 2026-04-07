import { useState, useEffect, useCallback } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

const COR = "#2d6a4f"
const COR_CLARA = "#f0f7f2"
const COR_BORDA = "#a8d5b5"

const URL_ESPERA     = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTroGKeTYOAQDHfCNDEzVKzECaSpwD5Jq1TqLGq1nh4GaQFEHD0ZPfDuoGqyg3NLYbLOOdJzLkI7CLE/pub?gid=0&single=true&output=csv"
const URL_MATRICULADOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSMzkaw9qDWkvXcsUXs_5E0rXH0n0TiDVN5AeJ_LYSET6cOiv3QxQFK5chqGOeciMEPtJu8ekgJyXX/pub?gid=0&single=true&output=csv"
const URL_CMEI_BAIRROS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSlwqeOhW2S1rNxrMydAaaHDcde-3jE_akLf7hg2Z3K0wK4UvDcfBlTwiBMnqYG6BI_2PRInY-Xv0XJ/pub?gid=1850294324&single=true&output=csv"

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

function contarPor(lista, fn) {
  const map = {}
  lista.forEach(item => {
    const k = fn(item)
    if (k) map[k] = (map[k] || 0) + 1
  })
  return map
}

function faixaRenda(r) {
  try {
    const v = parseFloat(r.replace("R$","").replace(/\./g,"").replace(",",".").trim())
    if (v === 0) return "Sem renda"
    if (v <= 750) return "Até R$750"
    if (v <= 1500) return "R$750–R$1.500"
    if (v <= 3000) return "R$1.500–R$3.000"
    return "Acima R$3.000"
  } catch { return null }
}

function normEscola(s) {
  return s.toUpperCase()
    .replace(/CENTRO MUNICIPAL DE EDUCA[ÇC][AÃ]O INFANTIL /g,"")
    .replace(/CMEI /g,"").trim()
}

function processarDados(csvEspera, csvMatric) {
  const espera = parseCSV(csvEspera).slice(1)
  const matric = parseCSV(csvMatric).slice(1)

  // ── Lista de espera ──────────────────────────────────────
  const totalEspera = espera.length
  const comBF    = espera.filter(r => r[46]?.toUpperCase() === "SIM").length
  const pcd      = espera.filter(r => r[15]?.toUpperCase() === "SIM").length
  const mono     = espera.filter(r => r[16]?.toUpperCase() === "SIM").length

  const porTurma = contarPor(espera, r => r[23]?.trim())
  const porBairroEspera = contarPor(espera, r => r[14]?.trim().toUpperCase())
  const porCreche1 = contarPor(espera, r => r[24]?.trim())
  const porRenda = contarPor(espera, r => faixaRenda(r[45] || ""))

  // ── Matriculados ─────────────────────────────────────────
  const totalMatric = matric.length
  const usaTransporte = matric.filter(r => r[5]?.toLowerCase().includes("público")).length
  const porBairroMatric = contarPor(matric, r => r[8]?.trim().toUpperCase())
  const porEscola = contarPor(matric, r => normEscola(r[2]?.trim() || ""))
  const porModalidade = contarPor(matric, r => {
    const m = r[4]?.trim() || ""
    if (m.includes("0 A 3")) return "Creche 0-3 anos"
    if (m.includes("PRÉ") || m.includes("PRE")) return "Pré-escola"
    return "Educação Infantil"
  })

  // ── Cruzamento bairros ───────────────────────────────────
  const todosBairros = new Set([
    ...Object.keys(porBairroEspera).slice(0,25),
    ...Object.keys(porBairroMatric).slice(0,25),
  ])
  const cruzBairros = [...todosBairros]
    .map(b => ({ bairro: b, espera: porBairroEspera[b]||0, matriculados: porBairroMatric[b]||0 }))
    .filter(b => b.espera > 5 || b.matriculados > 100)
    .sort((a,b) => b.espera - a.espera)
    .slice(0, 15)

  // ── Creches: demanda vs capacidade ───────────────────────
  const cruzCreches = Object.entries(porCreche1)
    .map(([creche, demanda]) => {
      const n = normEscola(creche)
      const capacidade = porEscola[n] || 0
      return { creche: creche.replace(/CMEI |CEI /g,""), demanda, capacidade }
    })
    .sort((a,b) => b.demanda - a.demanda)
    .slice(0, 12)

  // Top bairros espera
  const topBairrosEspera = Object.entries(porBairroEspera)
    .map(([bairro, total]) => ({ bairro: bairro.slice(0,20), total }))
    .sort((a,b) => b.total - a.total).slice(0, 12)

  // Turmas formatadas
  const turmasData = Object.entries(porTurma)
    .map(([turma, total]) => ({ turma, total }))
    .sort((a,b) => b.total - a.total)

  // Renda
  const rendaOrdem = ["Sem renda","Até R$750","R$750–R$1.500","R$1.500–R$3.000","Acima R$3.000"]
  const rendaData = rendaOrdem
    .filter(k => porRenda[k])
    .map(k => ({ faixa: k, total: porRenda[k] }))

  // Top escolas matriculados
  const topEscolas = Object.entries(porEscola)
    .map(([escola, total]) => ({ escola: escola.slice(0,28), total }))
    .sort((a,b) => b.total - a.total).slice(0, 10)

  return {
    totalEspera, comBF, pcd, mono, totalMatric, usaTransporte,
    turmasData, topBairrosEspera, cruzCreches, cruzBairros,
    rendaData, topEscolas, porModalidade,
    espera, // dados brutos para filtro interativo
  }
}

// ── Cores ────────────────────────────────────────────────────
const COR_TURMA   = { "Infantil 1": "#0369a1", "Infantil 2": "#1d7fc4", "Infantil 3": "#38bdf8" }
const COR_RENDA   = ["#b91c1c","#f97316","#eab308","#22c55e","#0369a1"]
const COR_MODAL   = ["#2d6a4f","#1d7fc4","#7c3371"]

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #2d6a4f22" }}>
      <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value.toLocaleString("pt-BR")}</b></div>)}
    </div>
  )
}

// ── Gráfico rosca CMEI com legenda externa ───────────────────
function RoscaChart({ sim, nao, titulo, corSim, corNao }) {
  const total = sim + nao
  if (total === 0) return null
  const r = 68, cx = 90, cy = 90, inner = 42, circ = 2 * Math.PI * r
  const simDash = (sim/total) * circ
  const naoDash = (nao/total) * circ
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontWeight: 600, fontSize: 12, color: COR, marginBottom: 8, textAlign: "center" }}>{titulo}</div>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="24"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={corSim} strokeWidth="24"
          strokeDasharray={`${simDash} ${circ}`} strokeDashoffset={circ*0.25} strokeLinecap="butt"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={corNao} strokeWidth="24"
          strokeDasharray={`${naoDash} ${circ}`} strokeDashoffset={circ*0.25-simDash} strokeLinecap="butt"/>
        <text x={cx} y={cy-6} textAnchor="middle" fontSize="20" fontWeight="800" fill={COR}>{sim}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="10" fill="#64748b">de {total}</text>
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: corSim, display: "inline-block" }}/>
          SIM ({Math.round(sim/total*100)}%)
        </span>
        <span style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: corNao, display: "inline-block" }}/>
          NÃO ({Math.round(nao/total*100)}%)
        </span>
      </div>
    </div>
  )
}

export default function GGOrganizacaoPage() {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState("espera")

  // Filtro interativo global
  const [filtroAtivo, setFiltroAtivo] = useState(null) // { tipo, valor }

  useEffect(() => {
    Promise.all([
      fetch(URL_ESPERA).then(r => r.text()),
      fetch(URL_MATRICULADOS).then(r => r.text()),
    ]).then(([csvE, csvM]) => {
      setDados(processarDados(csvE, csvM))
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [])

  const handleFiltro = useCallback((tipo, valor) => {
    setFiltroAtivo(prev => prev?.tipo === tipo && prev?.valor === valor ? null : { tipo, valor })
  }, [])

  if (carregando) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f7f2", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", color: COR }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando dados...</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Buscando informações do Google Sheets</div>
      </div>
    </div>
  )

  if (!dados) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f7f2" }}>
      <div style={{ textAlign: "center", color: "#b91c1c" }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Erro ao carregar dados.</div>
      </div>
    </div>
  )

  const { totalEspera, comBF, pcd, mono, totalMatric, usaTransporte,
    turmasData, topBairrosEspera, cruzCreches, cruzBairros,
    rendaData, topEscolas, porModalidade, espera } = dados

  // Aplica filtro interativo nos dados
  const esperaFiltrada = filtroAtivo ? espera.filter(r => {
    if (filtroAtivo.tipo === "turma") return r[23]?.trim() === filtroAtivo.valor
    if (filtroAtivo.tipo === "bairro") return r[14]?.trim().toUpperCase() === filtroAtivo.valor
    if (filtroAtivo.tipo === "bf") return r[46]?.toUpperCase() === filtroAtivo.valor
    return true
  }) : espera

  const topBairrosFiltrado = Object.entries(
    esperaFiltrada.reduce((acc, r) => { const b = r[14]?.trim().toUpperCase(); if(b) acc[b]=(acc[b]||0)+1; return acc }, {})
  ).map(([bairro, total]) => ({ bairro: bairro.slice(0,20), total }))
    .sort((a,b) => b.total - a.total).slice(0, 12)

  const turmasFiltrado = Object.entries(
    esperaFiltrada.reduce((acc, r) => { const t = r[23]?.trim(); if(t) acc[t]=(acc[t]||0)+1; return acc }, {})
  ).map(([turma, total]) => ({ turma, total })).sort((a,b) => b.total - a.total)

  const comBF_f    = esperaFiltrada.filter(r => r[46]?.toUpperCase() === "SIM").length
  const semBF_f    = esperaFiltrada.filter(r => r[46]?.toUpperCase() === "NÃO").length
  const mono_f     = esperaFiltrada.filter(r => r[16]?.toUpperCase() === "SIM").length
  const pcd_f      = esperaFiltrada.filter(r => r[15]?.toUpperCase() === "SIM").length

  const kpisEspera = [
    { label: "Na Fila de Espera",  valor: totalEspera,  icon: "👶", variacao: "aguardando vaga em CMEI" },
    { label: "Com Bolsa Família",  valor: comBF,        icon: "💚", variacao: `${Math.round(comBF/totalEspera*100)}% do total` },
    { label: "Família Monop.",     valor: mono,         icon: "👩", variacao: `${Math.round(mono/totalEspera*100)}% do total` },
    { label: "PCD",                valor: pcd,          icon: "♿", variacao: "necessidades especiais" },
  ]

  const kpisMatric = [
    { label: "Crianças Matriculadas", valor: totalMatric.toLocaleString("pt-BR"), icon: "📚", variacao: "em 35 CMEIs" },
    { label: "Usa Transp. Público",   valor: usaTransporte, icon: "🚌", variacao: `${Math.round(usaTransporte/totalMatric*100)}% do total` },
    { label: "Zona Rural",            valor: 590, icon: "🌱", variacao: "da área rural" },
    { label: "Zona Urbana",           valor: 5990, icon: "🏙️", variacao: "da área urbana" },
  ]

  const pizzaModal = Object.entries(porModalidade)
    .map(([name, value], i) => ({ name, value, fill: COR_MODAL[i] }))

  const filtroLabel = filtroAtivo ? `Filtrado por: ${filtroAtivo.tipo === "turma" ? filtroAtivo.valor : filtroAtivo.tipo === "bairro" ? filtroAtivo.valor : `Bolsa Família = ${filtroAtivo.valor}`}` : null

  return (
    <div style={{ minHeight: "100vh", background: "#f4faf6", fontFamily: "'Segoe UI', sans-serif", color: "#1a3a2a" }}>
      <Header titulo="GG Organização Escolar" sub="Painel de gestão e estrutura da rede" extra="Março 2026" cor={COR} />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* ABAS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "espera",    label: "👶 Lista de Espera" },
            { id: "matriculados", label: "📚 Matriculados CMEI" },
            { id: "cruzamento",  label: "🔀 Análise Cruzada" },
          ].map(a => (
            <button key={a.id} onClick={() => { setAbaAtiva(a.id); setFiltroAtivo(null) }} style={{
              padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: abaAtiva === a.id ? COR : "#fff",
              color: abaAtiva === a.id ? "#fff" : COR,
              boxShadow: "0 2px 8px #2d6a4f18", transition: "all 0.2s",
            }}>{a.label}</button>
          ))}
        </div>

        {/* FILTRO ATIVO */}
        {filtroAtivo && (
          <div style={{ background: "#fff", border: `2px solid ${COR}`, borderRadius: 12, padding: "10px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: COR, fontWeight: 600 }}>🔍 {filtroLabel} — mostrando {esperaFiltrada.length} crianças</span>
            <button onClick={() => setFiltroAtivo(null)} style={{ background: COR, color: "#fff", border: "none", borderRadius: 8, padding: "4px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✕ Limpar filtro</button>
          </div>
        )}

        {/* ═══════════ ABA: LISTA DE ESPERA ═══════════ */}
        {abaAtiva === "espera" && (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {kpisEspera.map(k => (
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

            {/* Turma + Bairros */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20, marginBottom: 24 }}>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Por Faixa Etária</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Clique numa barra para filtrar todos os gráficos</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={turmasFiltrado} barCategoryGap="30%" onClick={d => d && handleFiltro("turma", d.activeLabel)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                    <XAxis dataKey="turma" tick={{ fontSize: 11, fill: "#334155" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => [v, "crianças"]} />
                    <Bar dataKey="total" name="Crianças" radius={[6,6,0,0]} cursor="pointer" animationDuration={600}>
                      {turmasFiltrado.map((e) => (
                        <Cell key={e.turma} fill={
                          filtroAtivo?.tipo === "turma" && filtroAtivo.valor === e.turma
                            ? "#0369a1" : COR_TURMA[e.turma] || COR
                        }/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Bairros com Mais Crianças na Espera</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Clique para filtrar por bairro</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topBairrosFiltrado} layout="vertical" barCategoryGap="15%"
                    onClick={d => d && handleFiltro("bairro", d.activeLabel?.toUpperCase())}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis dataKey="bairro" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={130} />
                    <Tooltip formatter={(v) => [v, "crianças"]} />
                    <Bar dataKey="total" name="Na espera" radius={[0,4,4,0]} cursor="pointer" animationDuration={800}>
                      {topBairrosFiltrado.map((e) => (
                        <Cell key={e.bairro} fill={
                          filtroAtivo?.tipo === "bairro" && filtroAtivo.valor === e.bairro
                            ? "#0369a1" : COR
                        }/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Renda + Bolsa Família + Monoparental */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 20, marginBottom: 24 }}>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Faixas de Renda Familiar</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Perfil socioeconômico das famílias na fila</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rendaData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                    <XAxis dataKey="faixa" tick={{ fontSize: 9, fill: "#64748b" }} interval={0} angle={-10} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => [v, "famílias"]} />
                    <Bar dataKey="total" name="Famílias" radius={[6,6,0,0]} animationDuration={800}>
                      {rendaData.map((_, i) => <Cell key={i} fill={COR_RENDA[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2, alignSelf: "flex-start" }}>Bolsa Família</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, alignSelf: "flex-start" }}>
                  {filtroAtivo ? `(${esperaFiltrada.length} crianças filtradas)` : "Lista completa de espera"}
                </div>
                <RoscaChart sim={comBF_f} nao={semBF_f} titulo="" corSim="#15803d" corNao="#94a3b8" />
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2, alignSelf: "flex-start" }}>Família Monoparental</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, alignSelf: "flex-start" }}>
                  {filtroAtivo ? `(${esperaFiltrada.length} crianças filtradas)` : "Lista completa de espera"}
                </div>
                <RoscaChart sim={mono_f} nao={esperaFiltrada.length - mono_f} titulo="" corSim="#b5174f" corNao="#94a3b8" />
              </div>
            </div>

            {/* Top creches mais pedidas */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>CMEIs Mais Pedidos como 1ª Opção</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>As famílias podem escolher até 3 opções de creche ao se inscrever na fila</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cruzCreches} layout="vertical" barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis dataKey="creche" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={200} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="demanda"    name="Pedidos (fila)"   fill="#f97316" radius={[0,4,4,0]} animationDuration={800} />
                  <Bar dataKey="capacidade" name="Matriculados"     fill={COR}     radius={[0,4,4,0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ═══════════ ABA: MATRICULADOS ═══════════ */}
        {abaAtiva === "matriculados" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {kpisMatric.map(k => (
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

              {/* Top escolas */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Top CMEIs por Matrículas</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Maiores unidades em número de alunos</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topEscolas} layout="vertical" barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis dataKey="escola" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={175} />
                    <Tooltip formatter={(v) => [v, "matriculados"]} />
                    <Bar dataKey="total" name="Matriculados" radius={[0,6,6,0]} animationDuration={800}>
                      {topEscolas.map((_, i) => <Cell key={i} fill={i < 3 ? COR : COR + "99"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Modalidade + Transporte */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Por Modalidade</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Tipo de educação infantil</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pizzaModal} cx="50%" cy="45%" innerRadius={40} outerRadius={65}
                        paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                        {pizzaModal.map((e,i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v.toLocaleString("pt-BR"), "alunos"]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Uso de Transporte</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Transporte escolar público</div>
                  <RoscaChart
                    sim={usaTransporte} nao={totalMatric - usaTransporte}
                    titulo="" corSim="#0369a1" corNao="#94a3b8"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════ ABA: CRUZAMENTO ═══════════ */}
        {abaAtiva === "cruzamento" && (
          <>
            <div style={{ background: "#fff7ed", border: "1.5px solid #fdba74", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22 }}>💡</span>
              <div style={{ fontSize: 13, color: "#92400e" }}>
                Esta aba cruza os dados da <b>lista de espera</b> com os <b>matriculados</b>, revelando padrões importantes: quais bairros têm mais crianças esperando vaga, quais CMEIs têm mais demanda do que capacidade, e onde há maior pressão por novas vagas.
              </div>
            </div>

            {/* Bairros: espera vs matriculados */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Bairros: Espera vs. Matriculados</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Bairros com maior pressão por vagas — quanto mais alta a barra laranja em relação à verde, maior a necessidade</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cruzBairros} barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                  <XAxis dataKey="bairro" tick={{ fontSize: 9, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="matriculados" name="Matriculados" fill={COR}     radius={[4,4,0,0]} animationDuration={600} />
                  <Bar dataKey="espera"       name="Na espera"   fill="#f97316" radius={[4,4,0,0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Creches: demanda vs capacidade */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>CMEIs: Demanda (Fila) vs. Capacidade (Matriculados)</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>CMEIs onde a demanda na fila supera o número de matriculados precisam de atenção prioritária</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cruzCreches} layout="vertical" barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis dataKey="creche" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={195} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="capacidade" name="Matriculados (atual)" fill={COR}     radius={[0,4,4,0]} animationDuration={600} />
                  <Bar dataKey="demanda"    name="Na fila (1ª opção)"  fill="#f97316" radius={[0,4,4,0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
