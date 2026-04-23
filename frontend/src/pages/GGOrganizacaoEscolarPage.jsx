import { useState, useEffect } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

const COR        = "#2d6a4f"
const COR_CLARA  = "#f0f7f2"
const COR_BORDA  = "#a8d5b5"
const VERMELHO   = "#b91c1c"
const LARANJA    = "#d97706"
const AZUL       = "#0369a1"

const URL_REGULAR = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpGK8KG3Qk1vG1Dq3VW9oE3hko3cLnVycX2gcKjSZ86CmO0xe_lhPs-1ojOAtzvuXkxiuR5qxT7qqC/pub?gid=1965629032&single=true&output=csv"
const URL_CRECHE  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpGK8KG3Qk1vG1Dq3VW9oE3hko3cLnVycX2gcKjSZ86CmO0xe_lhPs-1ojOAtzvuXkxiuR5qxT7qqC/pub?gid=2002999141&single=true&output=csv"
const URL_PNTP    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOTHk0W9GxuLy5ldKLn10HiInUhOtFpGHxXELP6DCeHWIwA51OSVXMtYPK1a4Kh05IVDJCi5kIO2tt/pub?gid=574473705&single=true&output=csv"

function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i], nx = text[i + 1]
    if (c === '"') { if (inQ && nx === '"') { field += '"'; i++ } else inQ = !inQ }
    else if (c === ',' && !inQ) { row.push(field.trim()); field = "" }
    else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && nx === '\n') i++
      row.push(field.trim()); field = ""
      if (row.some(f => f !== "")) rows.push(row)
      row = []
    } else field += c
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(f => f !== "")) rows.push(row) }
  return rows
}

function num(s) {
  const n = parseFloat((s || "").toString().replace(/\./g, "").replace(",", ".").trim())
  return isNaN(n) ? 0 : n
}

function parseLacunas(text) {
  const rows = parseCSV(text).slice(1)
  return rows
    .filter(r => r[0] && r[0].toLowerCase() !== "total geral" && r[0] !== "UNIDADE ESCOLAR")
    .map(r => ({ escola: r[0].trim(), aulas: num(r[1]), professores: num(r[2]) }))
    .filter(r => r.professores > 0)
}

function parsePNTP(text) {
  const allRows = parseCSV(text)
  // pula as 2 linhas de cabeçalho (grupo + subgrupo INF1/INF2...)
  const rows = allRows.slice(2)
  return rows
    .filter(r => r[2] && r[2].toLowerCase() !== "total" && r[2] !== "CMEI")
    .map(r => ({
      tgs:       r[0]?.trim() || "",
      bairro:    r[1]?.trim() || "",
      cmei:      r[2]?.trim().replace(/\*/g, "").trim(),
      asterisco: r[2]?.includes("*") || false,
      cap:       num(r[3]),
      matric:    num(r[4]),
      vagaI1:    num(r[5]),
      vagaI2:    num(r[6]),
      vagaI3:    num(r[7]),
      vagaI4:    num(r[8]),
      vagaI5:    num(r[9]),
      esperaI1:  num(r[10]),
      esperaI2:  num(r[11]),
      esperaI3:  num(r[12]),
    }))
    .filter(r => r.cmei && r.cap > 0)
    .map(r => ({
      ...r,
      // CORREÇÃO: usa Math.floor para nunca arredondar pra cima
      // e "lotado" é determinado por matric >= cap, não por porcentagem
      ocupacao:     r.cap > 0 ? Math.floor(r.matric / r.cap * 100) : 0,
      lotado:       r.matric >= r.cap,
      totalVagas13: r.vagaI1 + r.vagaI2 + r.vagaI3,
      totalVagas45: r.vagaI4 + r.vagaI5,
      totalEspera:  r.esperaI1 + r.esperaI2 + r.esperaI3,
    }))
}

function fmtN(n) { return n.toLocaleString("pt-BR") }

function corOcupacao(pct, lotado) {
  if (lotado) return VERMELHO
  if (pct >= 95) return "#ef4444"
  if (pct >= 88) return LARANJA
  return COR
}

function corEspera(n) {
  if (n >= 80)  return VERMELHO
  if (n >= 40)  return LARANJA
  if (n >= 10)  return "#ca8a04"
  return COR
}

function badgeOcup(pct, lotado) {
  if (lotado)   return { label: "LOTADO",  bg: "#fee2e2", cor: VERMELHO }
  if (pct >= 95) return { label: "CRÍTICO", bg: "#fef2f2", cor: "#ef4444" }
  if (pct >= 88) return { label: "ALTO",    bg: "#fef9c3", cor: LARANJA }
  return { label: "OK", bg: "#dcfce7", cor: COR }
}

const TipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #2d6a4f22" }}>
      <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || COR }}>● {p.name}: <b>{fmtN(p.value)}</b></div>
      ))}
    </div>
  )
}

function BarraOcup({ pct, lotado, height = 8 }) {
  const cor = corOcupacao(pct, lotado)
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 99 }} />
    </div>
  )
}

export default function GGOrganizacaoPage() {
  const [dados, setDados]           = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba]               = useState("geral")
  const [buscaPNTP, setBuscaPNTP]   = useState("")
  const [buscaProf, setBuscaProf]   = useState("")
  const [updated, setUpdated]       = useState(null)

  const carregar = () => {
    setCarregando(true)
    Promise.all([
      fetch(URL_REGULAR).then(r => r.text()),
      fetch(URL_CRECHE).then(r => r.text()),
      fetch(URL_PNTP).then(r => r.text()),
    ])
      .then(([tR, tC, tP]) => {
        setDados({
          regular: parseLacunas(tR),
          creche:  parseLacunas(tC),
          pntp:    parsePNTP(tP),
        })
        setUpdated(new Date())
      })
      .catch(() => setDados(null))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [])

  if (carregando) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COR_CLARA, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ textAlign: "center", color: COR }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando dados da rede...</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>PNTP + Dimensionamento de professores</div>
      </div>
    </div>
  )
  if (!dados) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: VERMELHO }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Não foi possível carregar os dados.</div>
        <button onClick={carregar} style={{ padding: "8px 20px", borderRadius: 20, border: `1px solid ${COR_BORDA}`, background: COR, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Tentar novamente</button>
      </div>
    </div>
  )

  const { regular, creche, pntp } = dados

  const totalCap      = pntp.reduce((s, r) => s + r.cap, 0)
  const totalMat      = pntp.reduce((s, r) => s + r.matric, 0)
  const totalVagas13  = pntp.reduce((s, r) => s + r.totalVagas13, 0)
  const totalVagas45  = pntp.reduce((s, r) => s + r.totalVagas45, 0)
  const totalEspera   = pntp.reduce((s, r) => s + r.totalEspera, 0)
  const totalEsperaI1 = pntp.reduce((s, r) => s + r.esperaI1, 0)
  const totalEsperaI2 = pntp.reduce((s, r) => s + r.esperaI2, 0)
  const totalEsperaI3 = pntp.reduce((s, r) => s + r.esperaI3, 0)
  const ocupGeralPct  = Math.floor(totalMat / totalCap * 100)
  // CORREÇÃO: usa r.lotado (matric >= cap) em vez de r.ocupacao >= 100
  const cmeiLotados   = pntp.filter(r => r.lotado).length
  const cmeiCriticos  = pntp.filter(r => !r.lotado && r.ocupacao >= 95).length
  const gapVagasEspera = totalEspera - totalVagas13

  const totalProfReg  = regular.reduce((s, r) => s + r.professores, 0)
  const totalProfCre  = creche.reduce((s, r) => s + r.professores, 0)
  const totalAulasReg = regular.reduce((s, r) => s + r.aulas, 0)
  const totalAulasCre = creche.reduce((s, r) => s + r.aulas, 0)

  const profMap = {}
  regular.forEach(r => {
    if (!profMap[r.escola]) profMap[r.escola] = { reg: 0, cre: 0, aulasReg: 0, aulasCre: 0 }
    profMap[r.escola].reg = r.professores
    profMap[r.escola].aulasReg = r.aulas
  })
  creche.forEach(r => {
    if (!profMap[r.escola]) profMap[r.escola] = { reg: 0, cre: 0, aulasReg: 0, aulasCre: 0 }
    profMap[r.escola].cre = r.professores
    profMap[r.escola].aulasCre = r.aulas
  })
  const profCombinado = Object.entries(profMap)
    .map(([escola, v]) => ({ escola, reg: v.reg, cre: v.cre, total: v.reg + v.cre, aulasReg: v.aulasReg, aulasCre: v.aulasCre }))
    .sort((a, b) => b.total - a.total)

  const pntpFiltrado = pntp
    .filter(r => !buscaPNTP || r.cmei.toLowerCase().includes(buscaPNTP.toLowerCase()))
    .sort((a, b) => b.totalEspera - a.totalEspera)

  const profFiltrado = profCombinado
    .filter(r => !buscaProf || r.escola.toLowerCase().includes(buscaProf.toLowerCase()))

  const todosEspera = [...pntp].sort((a, b) => b.totalEspera - a.totalEspera)
    .map(r => ({ nome: r.cmei.length > 32 ? r.cmei.slice(0, 32) + "…" : r.cmei, espera: r.totalEspera, vagas: r.totalVagas13 }))

  const todosOcupacao = [...pntp].sort((a, b) => b.ocupacao - a.ocupacao)
    .map(r => ({ nome: r.cmei.length > 32 ? r.cmei.slice(0, 32) + "…" : r.cmei, ocupacao: r.ocupacao, cap: r.cap, matric: r.matric, lotado: r.lotado }))

  const todosProf = profCombinado
    .map(r => ({ ...r, escola: r.escola.length > 32 ? r.escola.slice(0, 32) + "…" : r.escola }))

  const dadosEsperaTipo = [
    { inf: "Infantil 1", espera: totalEsperaI1, vagas: pntp.reduce((s, r) => s + r.vagaI1, 0) },
    { inf: "Infantil 2", espera: totalEsperaI2, vagas: pntp.reduce((s, r) => s + r.vagaI2, 0) },
    { inf: "Infantil 3", espera: totalEsperaI3, vagas: pntp.reduce((s, r) => s + r.vagaI3, 0) },
  ]

  const distOcup = { "< 80%": 0, "80–89%": 0, "90–94%": 0, "95–99%": 0, "100%": 0 }
  pntp.forEach(r => {
    if (r.lotado)          distOcup["100%"]++
    else if (r.ocupacao >= 95) distOcup["95–99%"]++
    else if (r.ocupacao >= 90) distOcup["90–94%"]++
    else if (r.ocupacao >= 80) distOcup["80–89%"]++
    else                       distOcup["< 80%"]++
  })
  const dadosDistOcup = Object.entries(distOcup).map(([faixa, qtd]) => ({ faixa, qtd }))

  const ABAS = [
    { id: "geral", label: "🏠 Visão Geral" },
    { id: "pntp",  label: "📊 Vagas & Ocupação" },
    { id: "prof",  label: "👩‍🏫 Dimensionamento" },
  ]

  const card = (children, extra = {}) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, ...extra }}>
      {children}
    </div>
  )

  const titulo = (t, s) => (
    <>
      <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>{t}</div>
      {s && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>{s}</div>}
    </>
  )

  const kpi = (icon, valor, label, sub, cor = COR, alerta = false) => (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: `0 2px 12px ${cor}22`, borderLeft: `4px solid ${alerta ? VERMELHO : cor}`, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: alerta ? VERMELHO : cor }}>{valor}</div>
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#f4faf6", fontFamily: "'Segoe UI',sans-serif", color: "#1a3a2a" }}>
      <Header titulo="GG Organização Escolar" sub="Painel de gestão e estrutura da rede — CMEIs 2026" cor={COR} />
      <main style={{ padding: "92px 32px 52px" }}>

        <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 10, padding: "10px 18px", marginBottom: 18, fontSize: 12, color: "#92400e" }}>
          ℹ️ <b>Escopo atual:</b> Este painel exibe dados exclusivos de <b>CMEI/Creche</b>. Os campos <b>Bairro</b> e <b>TGS</b> serão exibidos automaticamente assim que as planilhas forem preenchidas pela gerência.
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)} style={{
                padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                background: aba === a.id ? COR : "#fff",
                color: aba === a.id ? "#fff" : COR,
                boxShadow: aba === a.id ? `0 2px 8px ${COR}44` : "0 1px 4px #0001",
              }}>{a.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{updated ? `Atualizado: ${updated.toLocaleTimeString("pt-BR")}` : ""}</span>
            <button onClick={carregar} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${COR_BORDA}`, background: "#fff", color: COR, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>↻ Atualizar</button>
          </div>
        </div>

        {/* ══ VISÃO GERAL ══ */}
        {aba === "geral" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {kpi("🏫", fmtN(pntp.length), "CMEIs na rede", "Unidades com dados 2026", COR)}
            {kpi("👶", fmtN(totalMat), "Crianças matriculadas", `${ocupGeralPct}% da capacidade instalada`, COR)}
            {kpi("🪑", fmtN(totalCap), "Capacidade total", `${fmtN(totalCap - totalMat)} vagas de folga geral`, AZUL)}
            {kpi("⚠️", fmtN(totalEspera), "Na lista de espera", "INF 1 ao 3 — aguardando convocação", VERMELHO, true)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {kpi("🔴", cmeiLotados, "CMEIs 100% lotados", "Sem nenhuma vaga disponível", VERMELHO, cmeiLotados > 0)}
            {kpi("🟠", cmeiCriticos, "CMEIs acima de 95%", "Capacidade criticamente alta", LARANJA)}
            {kpi("📋", fmtN(totalVagas13), "Vagas disponíveis INF 1–3", `Gap: ${fmtN(gapVagasEspera)} crianças sem vaga`, gapVagasEspera > 0 ? VERMELHO : COR, gapVagasEspera > 0)}
            {kpi("👩‍🏫", fmtN(totalProfReg + totalProfCre), "Professores necessários", `${totalProfReg} Regular + ${totalProfCre} Creche`, "#7c3371")}
          </div>

          {gapVagasEspera > 0 && (
            <div style={{ background: "#fef2f2", border: `2px solid ${VERMELHO}`, borderRadius: 14, padding: "16px 22px", marginBottom: 24, display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: 32 }}>🚨</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: VERMELHO, marginBottom: 4 }}>Atenção — Demanda reprimida em Infantil 1 ao 3</div>
                <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
                  Há <b>{fmtN(totalEspera)} crianças</b> aguardando vaga nos anos iniciais (INF 1–3), mas apenas <b>{fmtN(totalVagas13)} vagas disponíveis</b> para as próximas convocações — um déficit de <b>{fmtN(gapVagasEspera)} crianças</b> sem perspectiva imediata de vaga.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {card(<>
              {titulo("Lista de Espera × Vagas por Ano Inicial", "Comparativo INF 1, 2 e 3 — total da rede")}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosEsperaTipo} barGap={6} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                  <XAxis dataKey="inf" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip content={<TipCustom />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="espera" name="Na espera"         fill={VERMELHO} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vagas"  name="Vagas disponíveis" fill={COR}      radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                * INF 4 e INF 5 não são anos iniciais — vagas disponíveis: INF4={fmtN(pntp.reduce((s,r)=>s+r.vagaI4,0))}, INF5={fmtN(pntp.reduce((s,r)=>s+r.vagaI5,0))}
              </div>
            </>)}
            {card(<>
              {titulo("Distribuição de Ocupação — CMEIs", "Quantos CMEIs estão em cada faixa de ocupação")}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosDistOcup} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} />
                  <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip formatter={v => [v, "CMEIs"]} />
                  <Bar dataKey="qtd" name="CMEIs" radius={[4, 4, 0, 0]}>
                    {dadosDistOcup.map((d, i) => (
                      <Cell key={i} fill={d.faixa === "100%" ? VERMELHO : d.faixa === "95–99%" ? "#ef4444" : d.faixa === "90–94%" ? LARANJA : d.faixa === "80–89%" ? "#ca8a04" : COR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, flexWrap: "wrap" }}>
                {[["🔴 Lotado (100%)", VERMELHO], ["🟠 Crítico/Alto (≥88%)", LARANJA], ["🟢 Abaixo 88%", COR]].map(([l, c]) => (
                  <span key={l} style={{ color: c, fontWeight: 600 }}>{l}</span>
                ))}
              </div>
            </>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
            {card(<>
              {titulo("CMEIs — Lista de Espera INF 1–3 (todos)", "Vagas disponíveis vs crianças aguardando · ordenado por espera decrescente")}
              <div style={{ overflowY: "auto", maxHeight: 320 }}>
                <div style={{ height: todosEspera.length * 32 + 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={todosEspera} layout="vertical" barGap={3} barCategoryGap="22%">
                      <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
                      <YAxis dataKey="nome" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={185} />
                      <Tooltip content={<TipCustom />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="espera" name="Na espera"         fill={VERMELHO} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="vagas"  name="Vagas disponíveis" fill={COR}      radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>)}
            {card(<>
              {titulo("Dimensionamento — Resumo Executivo", "Professores necessários para completar o quadro em 2026")}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                {[
                  { label: "Prof. I — Infantil Regular", total: totalProfReg, aulas: totalAulasReg, cor: COR,       desc: `${regular.length} CMEIs com lacuna — ${fmtN(totalAulasReg)} aulas descobertas (÷20 = professores)` },
                  { label: "Prof. I — Creche (Infantil 1)", total: totalProfCre, aulas: totalAulasCre, cor: "#7c3371", desc: `${creche.length} CMEIs com lacuna — ${fmtN(totalAulasCre)} aulas descobertas` },
                  { label: "TOTAL — Toda a rede",         total: totalProfReg + totalProfCre, aulas: totalAulasReg + totalAulasCre, cor: VERMELHO, desc: "Professores necessários para suprir todas as lacunas" },
                ].map(k => (
                  <div key={k.label} style={{ background: COR_CLARA, borderRadius: 12, padding: "14px 16px", borderLeft: `4px solid ${k.cor}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: k.cor }}>{k.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: k.cor }}>{fmtN(k.total)}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{k.desc}</div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                  <b>Como foi calculado:</b> cada escola tem um número de aulas descobertas. Como um professor I tem 20 aulas semanais, divide-se o total de aulas por 20 para obter a quantidade de professores necessários.
                </div>
              </div>
            </>)}
          </div>
        </>}

        {/* ══ VAGAS & OCUPAÇÃO ══ */}
        {aba === "pntp" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
            {kpi("🏫", fmtN(pntp.length), "CMEIs", "Unidades 2026", COR)}
            {kpi("👶", fmtN(totalMat), "Matriculados", `${ocupGeralPct}% da capacidade`, COR)}
            {kpi("🪑", fmtN(totalCap - totalMat), "Vagas livres (geral)", `De ${fmtN(totalCap)} de capacidade`, AZUL)}
            {kpi("📋", fmtN(totalVagas13), "Vagas INF 1–3 convocação", "Para as próximas chamadas", COR)}
            {kpi("⚠️", fmtN(totalEspera), "Na lista de espera", `INF1=${totalEsperaI1} INF2=${totalEsperaI2} INF3=${totalEsperaI3}`, VERMELHO, true)}
          </div>

          {card(<>
            {titulo("CMEIs por Taxa de Ocupação (todos)", "Unidades com maior pressão sobre capacidade instalada · ordenado decrescente")}
            <div style={{ overflowY: "auto", maxHeight: 320 }}>
              <div style={{ height: todosOcupacao.length * 32 + 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={todosOcupacao} layout="vertical" barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} domain={[0, 110]} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="nome" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={185} />
                    <Tooltip formatter={(v, n) => [n === "ocupacao" ? `${v}%` : fmtN(v), n === "ocupacao" ? "Ocupação" : n]} />
                    <Bar dataKey="ocupacao" name="Ocupação %" radius={[0, 4, 4, 0]}>
                      {todosOcupacao.map((d, i) => <Cell key={i} fill={corOcupacao(d.ocupacao, d.lotado)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>, { marginBottom: 24 })}

          {card(<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Detalhamento por CMEI — PNTP 2026</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {pntpFiltrado.length} unidade(s) · Ordenado por lista de espera decrescente · * = informação adicional na planilha
                </div>
              </div>
              <input placeholder="🔍 Buscar CMEI..." value={buscaPNTP} onChange={e => setBuscaPNTP(e.target.value)}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${COR_BORDA}`, fontSize: 12, outline: "none", width: 200, color: "#334155" }} />
            </div>
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 520 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
                  <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                    {[["CMEI","left",200],["TGS","center",60],["BAIRRO","left",90],["CAP.","right",55],["MATRÍCULAS","right",80],["OCUPAÇÃO","center",90],
                      ["VAGAS I1","right",60],["VAGAS I2","right",60],["VAGAS I3","right",60],["VAGAS I4","right",55],["VAGAS I5","right",55],
                      ["ESP. I1","right",60],["ESP. I2","right",60],["ESP. I3","right",60],["TOTAL ESPERA","right",80],
                    ].map(([h, align, w]) => (
                      <th key={h} style={{ textAlign: align, padding: "6px 8px", fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6, whiteSpace: "nowrap", minWidth: w }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pntpFiltrado.map((r, i) => {
                    const badge = badgeOcup(r.ocupacao, r.lotado)
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}`, background: i % 2 === 0 ? "#fff" : "#fafff8" }}>
                        <td style={{ padding: "8px 8px", fontSize: 11, fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>
                          {r.asterisco && <span style={{ marginRight: 4, color: LARANJA }}>*</span>}
                          {r.cmei}
                        </td>
                        <td style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: r.tgs ? "#334155" : "#d1d5db" }}>{r.tgs || "—"}</td>
                        <td style={{ padding: "8px 8px", fontSize: 10, color: r.bairro ? "#334155" : "#d1d5db" }}>{r.bairro || "—"}</td>
                        <td style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", color: "#334155" }}>{fmtN(r.cap)}</td>
                        <td style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", fontWeight: 600, color: "#334155" }}>{fmtN(r.matric)}</td>
                        <td style={{ padding: "8px 8px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{ background: badge.bg, color: badge.cor, borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "inline-block" }}>
                              {r.lotado ? "100%" : `${r.ocupacao}%`} {badge.label}
                            </span>
                            <BarraOcup pct={r.ocupacao} lotado={r.lotado} height={5} />
                          </div>
                        </td>
                        {[r.vagaI1, r.vagaI2, r.vagaI3, r.vagaI4, r.vagaI5].map((v, j) => (
                          <td key={j} style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", color: v > 0 ? "#15803d" : "#94a3b8", fontWeight: v > 0 ? 700 : 400 }}>{v > 0 ? v : "–"}</td>
                        ))}
                        {[r.esperaI1, r.esperaI2, r.esperaI3].map((v, j) => (
                          <td key={j} style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", color: corEspera(v), fontWeight: v > 0 ? 700 : 400 }}>{v > 0 ? v : "–"}</td>
                        ))}
                        <td style={{ padding: "8px 8px", fontSize: 12, textAlign: "right", fontWeight: 800, color: corEspera(r.totalEspera) }}>
                          {r.totalEspera > 0 ? fmtN(r.totalEspera) : "–"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot style={{ position: "sticky", bottom: 0, background: COR_CLARA }}>
                  <tr style={{ borderTop: `2px solid ${COR_BORDA}` }}>
                    <td style={{ padding: "8px 8px", fontSize: 11, fontWeight: 800, color: COR }} colSpan={3}>TOTAL GERAL</td>
                    <td style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", fontWeight: 800, color: COR }}>{fmtN(totalCap)}</td>
                    <td style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", fontWeight: 800, color: COR }}>{fmtN(totalMat)}</td>
                    <td style={{ padding: "8px 8px", textAlign: "center", fontSize: 11, fontWeight: 800, color: COR }}>{ocupGeralPct}%</td>
                    {[pntp.reduce((s,r)=>s+r.vagaI1,0), pntp.reduce((s,r)=>s+r.vagaI2,0), pntp.reduce((s,r)=>s+r.vagaI3,0), pntp.reduce((s,r)=>s+r.vagaI4,0), pntp.reduce((s,r)=>s+r.vagaI5,0)].map((v, i) => (
                      <td key={i} style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", fontWeight: 700, color: COR }}>{fmtN(v)}</td>
                    ))}
                    {[totalEsperaI1, totalEsperaI2, totalEsperaI3].map((v, i) => (
                      <td key={i} style={{ padding: "8px 8px", fontSize: 11, textAlign: "right", fontWeight: 700, color: VERMELHO }}>{fmtN(v)}</td>
                    ))}
                    <td style={{ padding: "8px 8px", fontSize: 12, textAlign: "right", fontWeight: 900, color: VERMELHO }}>{fmtN(totalEspera)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>)}
        </>}

        {/* ══ DIMENSIONAMENTO ══ */}
        {aba === "prof" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {kpi("📚", regular.length, "CMEIs com lacuna — Infantil Regular", "Educação infantil", COR)}
            {kpi("👶", creche.length,  "CMEIs com lacuna — Infantil 1 (Creche)", "Berçário/Maternal", "#7c3371")}
            {kpi("👩‍🏫", fmtN(totalProfReg), "Prof. necessários — Regular", `${fmtN(totalAulasReg)} aulas descobertas ÷ 20`, COR)}
            {kpi("👩‍🏫", fmtN(totalProfCre), "Prof. necessários — Infantil 1", `${fmtN(totalAulasCre)} aulas descobertas ÷ 20`, "#7c3371")}
          </div>

          <div style={{ background: "#fff0f9", border: `2px solid #d946ef`, borderRadius: 14, padding: "16px 24px", marginBottom: 24, display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#86198f", minWidth: 80, textAlign: "center" }}>{fmtN(totalProfReg + totalProfCre)}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#86198f" }}>professores necessários para suprir todas as lacunas da rede em 2026</div>
              <div style={{ fontSize: 12, color: "#a21caf", marginTop: 4 }}>
                {fmtN(totalProfReg)} para Infantil Regular ({regular.length} CMEIs) · {fmtN(totalProfCre)} para Infantil 1/Creche ({creche.length} CMEIs) · {fmtN(totalAulasReg + totalAulasCre)} aulas totais descobertas
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                <b>Metodologia:</b> Cada professor I tem carga de 20 aulas semanais. Aulas descobertas ÷ 20 = professores necessários.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }}>
            {card(<>
              {titulo("CMEIs — Necessidade de Professores (todos)", "Soma das lacunas Regular + Infantil 1/Creche · ordenado decrescente")}
              <div style={{ overflowY: "auto", maxHeight: 320 }}>
                <div style={{ height: todosProf.length * 32 + 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={todosProf} layout="vertical" barGap={3} barCategoryGap="22%">
                      <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
                      <YAxis dataKey="escola" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={195} />
                      <Tooltip content={<TipCustom />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="reg" name="Infantil Regular" fill={COR}     stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="cre" name="Infantil 1/Creche" fill="#7c3371" stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>)}
            {card(<>
              {titulo("Lacuna por Tipo", "Distribuição de necessidades entre Regular e Infantil 1/Creche")}
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
                {[
                  { tipo: "Infantil Regular", total: totalProfReg, aulas: totalAulasReg, cmeis: regular.length, cor: COR, desc: "Turmas de Pré I, II, III e Jardim" },
                  { tipo: "Infantil 1 / Creche", total: totalProfCre, aulas: totalAulasCre, cmeis: creche.length, cor: "#7c3371", desc: "Turmas Berçário, Maternal I, II e III" },
                ].map(k => (
                  <div key={k.tipo} style={{ background: COR_CLARA, borderRadius: 12, padding: "16px 18px", borderLeft: `4px solid ${k.cor}` }}>
                    <div style={{ fontWeight: 700, color: k.cor, fontSize: 13, marginBottom: 6 }}>{k.tipo}</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>{k.desc} · {k.cmeis} CMEIs com lacuna</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: k.cor }}>{fmtN(k.total)}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>professores</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: k.cor }}>{fmtN(k.aulas)}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>aulas descobertas</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}
          </div>

          {card(<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Detalhamento por CMEI — Professores necessários</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{profFiltrado.length} unidade(s) com lacuna · ordenado por necessidade total decrescente</div>
              </div>
              <input placeholder="🔍 Buscar CMEI..." value={buscaProf} onChange={e => setBuscaProf(e.target.value)}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${COR_BORDA}`, fontSize: 12, outline: "none", width: 200, color: "#334155" }} />
            </div>
            <div style={{ overflowY: "auto", maxHeight: 460 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
                  <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                    {[["CMEI","left"],["AULAS REG.","right"],["PROF. REGULAR","center"],["AULAS INF.1","right"],["PROF. INF.1","center"],["TOTAL PROF.","center"]].map(([h, align]) => (
                      <th key={h} style={{ textAlign: align, padding: "6px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profFiltrado.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}`, background: i % 2 === 0 ? "#fff" : "#fafff8" }}>
                      <td style={{ padding: "9px 12px", fontSize: 11, fontWeight: 600, color: "#334155" }}>{r.escola}</td>
                      <td style={{ padding: "9px 12px", fontSize: 11, textAlign: "right", color: r.reg > 0 ? "#64748b" : "#d1d5db" }}>{r.reg > 0 ? fmtN(r.aulasReg) : "—"}</td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        {r.reg > 0 ? <span style={{ background: COR_CLARA, color: COR, borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 800 }}>{r.reg}</span> : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "9px 12px", fontSize: 11, textAlign: "right", color: r.cre > 0 ? "#64748b" : "#d1d5db" }}>{r.cre > 0 ? fmtN(r.aulasCre) : "—"}</td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        {r.cre > 0 ? <span style={{ background: "#fdf4ff", color: "#7c3371", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 800 }}>{r.cre}</span> : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        <span style={{ background: r.total >= 15 ? "#fee2e2" : r.total >= 8 ? "#fef9c3" : "#dcfce7", color: r.total >= 15 ? VERMELHO : r.total >= 8 ? LARANJA : COR, borderRadius: 20, padding: "3px 14px", fontSize: 13, fontWeight: 900 }}>{r.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ position: "sticky", bottom: 0, background: COR_CLARA }}>
                  <tr style={{ borderTop: `2px solid ${COR_BORDA}` }}>
                    <td style={{ padding: "9px 12px", fontWeight: 800, fontSize: 11, color: COR }}>TOTAL GERAL</td>
                    <td style={{ padding: "9px 12px", fontSize: 11, textAlign: "right", fontWeight: 700, color: COR }}>{fmtN(totalAulasReg)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 900, fontSize: 12, color: COR }}>{fmtN(totalProfReg)}</td>
                    <td style={{ padding: "9px 12px", fontSize: 11, textAlign: "right", fontWeight: 700, color: "#7c3371" }}>{fmtN(totalAulasCre)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 900, fontSize: 12, color: "#7c3371" }}>{fmtN(totalProfCre)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center" }}>
                      <span style={{ background: "#fee2e2", color: VERMELHO, borderRadius: 20, padding: "3px 14px", fontSize: 14, fontWeight: 900 }}>{fmtN(totalProfReg + totalProfCre)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>)}
        </>}

        <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", paddingTop: 18 }}>
          Fonte: SEDUC Caruaru — PNTP Creches 2026 · Dimensionamento Prof. I Regular e Creche 2026 · dados carregados automaticamente do Google Sheets
        </div>
      </main>
    </div>
  )
}
