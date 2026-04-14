import { useState, useEffect, useCallback } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

/* ── Paleta ─────────────────────────────────────────────────────────────── */
const COR        = "#b8930a"
const COR_ESCURA = "#8a6d00"
const COR_CLARA  = "#fefce8"
const COR_BORDA  = "#fde047"

const CORES_PIE = ["#b8930a","#64748b","#f97316","#a78bfa","#34d399","#60a5fa"]
const CORES_BAR = ["#b8930a","#ca9c00","#d4b500","#8a6d00","#a07008","#e0b820"]

/* ── URL da planilha ─────────────────────────────────────────────────────── */
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfvLy-j0BjOHXi5gM-2IXMjnjMG0_JY8gw750K6ppzipVwoB7Wxeg2dnDcmuoHCQ/pub?output=csv"

/* ── Parse helpers ───────────────────────────────────────────────────────── */
function parseBRL(str) {
  if (!str) return 0
  const s = str.toString().trim()
  if (!s) return 0
  const neg = s.includes("(") || s.startsWith("-")
  const n = parseFloat(
    s.replace(/R\$\s*/gi, "").replace(/\./g, "").replace(",", ".")
      .replace(/[\(\)\s]/g, "").replace("-", "")
  )
  return isNaN(n) ? 0 : neg ? -n : n
}

function parseCSVLine(line) {
  const r = []
  let cur = "", inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ }
    else if (c === "," && !inQ) { r.push(cur.trim()); cur = "" }
    else cur += c
  }
  r.push(cur.trim())
  return r
}

/* Remove acentos para comparação robusta */
function nrm(s) {
  return (s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

/* Nome de exibição para cada seção */
function labelSecao(nome) {
  const n = nrm(nome)
  if (n.includes("principal")) return "FUNDEB Principal"
  if (n.includes("vaaf"))      return "FUNDEB VAAF"
  if (n.includes("vaat"))      return "FUNDEB VAAT"
  if (n.includes("eti"))       return "FUNDEB ETI"
  if (n.includes("salario") || n.includes("sal") && n.includes("educ")) return "Sal. Educação"
  if (n.includes("pnae"))      return "PNAE"
  return nome
}

function isSecaoHeader(fn) {
  return (
    (fn.includes("fundeb") && (fn.includes("principal") || fn.includes("vaaf") || fn.includes("vaat") || fn.includes("eti"))) ||
    fn.includes("salario") ||
    fn === "pnae"
  )
}

/* ── Parser principal ────────────────────────────────────────────────────── */
/*
  Estrutura da aba Receitas:
  Linha 1-2: cabeçalhos
  Linha 3+:  col0=nome | col1=Previsão | col2=Jan | col3=Fev | col4=Mar | ... | col15=Anual

  Seções detalhadas:
    NOME_SECAO,,,,,...  <- header vazio
    Receita por destinação,,jan,fev,mar,...,anual
    Despesa por destinação,,jan,fev,mar,...,anual
    ,,saldo_jan,saldo_fev,...,saldo_anual
*/
function parseSheet(text) {
  const clean = text.replace(/^\uFEFF/, "")

  const rows = []
  for (const raw of clean.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    rows.push(parseCSVLine(line))
  }

  const resumo  = []  // linhas do quadro-resumo do topo
  const secoes  = []  // seções detalhadas com rec/desp
  let sec = null, secRec = null, secDesp = null

  for (const cols of rows) {
    const f  = (cols[0] || "").trim()
    const fn = nrm(f)

    if (!f) continue

    /* cabeçalhos textuais — pular */
    if (fn.includes("previsto") || fn.includes("executado") ||
        fn.includes("receitas seduc") || fn.includes("previsao")) continue

    const temDados = cols.slice(1, 16).some(c => parseBRL(c) !== 0)

    /* --- detecta header de seção (nome de seção + sem dados) --- */
    if (isSecaoHeader(fn) && !temDados) {
      if (sec !== null) {
        secoes.push({ nome: sec, label: labelSecao(sec), rec: secRec, desp: secDesp })
      }
      sec = f; secRec = null; secDesp = null
      continue
    }

    /* --- dentro de uma seção --- */
    if (sec !== null) {
      if (fn.includes("receita por")) {
        secRec = {
          jan: parseBRL(cols[2]), fev: parseBRL(cols[3]), mar: parseBRL(cols[4]),
          anual: parseBRL(cols[15]),
        }
      } else if (fn.includes("despesa por")) {
        secDesp = {
          jan: parseBRL(cols[2]), fev: parseBRL(cols[3]), mar: parseBRL(cols[4]),
          anual: parseBRL(cols[15]),
        }
      }
      continue
    }

    /* --- quadro-resumo do topo (fora de seção, com dados) --- */
    if (temDados) {
      resumo.push({
        nome: f,
        previsto: parseBRL(cols[1]),
        jan:      parseBRL(cols[2]),
        fev:      parseBRL(cols[3]),
        mar:      parseBRL(cols[4]),
        anual:    parseBRL(cols[15]),
      })
    }
  }

  /* última seção */
  if (sec !== null) {
    secoes.push({ nome: sec, label: labelSecao(sec), rec: secRec, desp: secDesp })
  }

  return { resumo, secoes }
}

/* ── Formatação ──────────────────────────────────────────────────────────── */
function fmtM(v) {
  if (!v && v !== 0) return "–"
  const abs = Math.abs(v), sign = v < 0 ? "-" : ""
  if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${sign}R$ ${(abs / 1e3).toFixed(0)}K`
  return `${sign}R$ ${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}

/* ── Tooltips ───────────────────────────────────────────────────────────── */
const TipMensal = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:"#fff", border:`1px solid ${COR_BORDA}`, borderRadius:10, padding:"10px 16px", fontSize:12, boxShadow:`0 4px 12px ${COR}33` }}>
      <div style={{ fontWeight:700, color:COR, marginBottom:6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color:p.color }}>● {p.name}: <b>R$ {Number(p.value).toFixed(1)}M</b></div>)}
    </div>
  )
}

const TipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:"#fff", border:`1px solid ${COR_BORDA}`, borderRadius:10, padding:"10px 16px", fontSize:12, boxShadow:`0 4px 12px ${COR}33` }}>
      <div style={{ fontWeight:700, color:COR }}>{payload[0].name}</div>
      <div>{fmtM(payload[0].value * 1e3)}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function GerenciaFinanceiraPage() {
  const [raw,        setRaw]        = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [updated,    setUpdated]    = useState(null)

  const carregar = useCallback(() => {
    setCarregando(true)
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(text => { setRaw(parseSheet(text)); setUpdated(new Date()) })
      .catch(() => setRaw(null))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  /* ── Loading / erro ────────────────────────────────────────────────────── */
  if (carregando) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fffef0", fontFamily:"'Segoe UI', sans-serif" }}>
      <div style={{ textAlign:"center", color:COR }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
        <div style={{ fontSize:16, fontWeight:600 }}>Carregando dados da planilha...</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:8 }}>Buscando informações do Google Sheets</div>
      </div>
    </div>
  )

  if (!raw) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fffef0", fontFamily:"'Segoe UI', sans-serif" }}>
      <div style={{ textAlign:"center", color:"#b91c1c" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <div style={{ fontSize:16, fontWeight:600 }}>Não foi possível carregar os dados.</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:8 }}>Verifique se a planilha está publicada corretamente.</div>
      </div>
    </div>
  )

  /* ── Dados derivados ─────────────────────────────────────────────────── */
  const { resumo, secoes } = raw

  const totalRec  = secoes.reduce((s, x) => s + (x.rec?.anual  || 0), 0)
  const totalDesp = secoes.reduce((s, x) => s + (x.desp?.anual || 0), 0)
  const saldo     = totalRec - totalDesp

  /* Previsto e % execução — do quadro-resumo (linha FUNDEB ou soma topo) */
  const fundebResumo = resumo.find(r => nrm(r.nome) === "fundeb")
  const previsto     = fundebResumo?.previsto || 0
  const percFundeb   = previsto > 0 ? (fundebResumo?.anual || 0) / previsto * 100 : 0

  /* Gráfico mensal — soma por mês */
  const MESES = ["jan","fev","mar"]
  const MESES_PT = ["Jan","Fev","Mar"]
  const dadosMensais = MESES.map((m, i) => ({
    mes:      MESES_PT[i],
    receitas: parseFloat((secoes.reduce((s, x) => s + (x.rec?.[m]  || 0), 0) / 1e6).toFixed(2)),
    despesas: parseFloat((secoes.reduce((s, x) => s + (x.desp?.[m] || 0), 0) / 1e6).toFixed(2)),
  })).filter(x => x.receitas > 0 || x.despesas > 0)

  /* Pizza — receita anual por seção */
  const pizzaRec = secoes
    .filter(x => (x.rec?.anual || 0) > 0)
    .map(x => ({ name: x.label, value: Math.round((x.rec?.anual || 0) / 1e3) }))
    .sort((a, b) => b.value - a.value)

  /* Tabela seções */
  const tabelaSecoes = secoes
    .filter(x => x.rec || x.desp)
    .map(x => ({
      label:  x.label,
      rec:    x.rec?.anual  || 0,
      desp:   x.desp?.anual || 0,
      saldo:  (x.rec?.anual || 0) - (x.desp?.anual || 0),
    }))
    .sort((a, b) => b.rec - a.rec)

  const maxRec = Math.max(...tabelaSecoes.map(x => x.rec), 1)

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#fffef0", fontFamily:"'Segoe UI', sans-serif", color:"#1a1200" }}>
      <Header titulo="Gerência Financeira" sub="Execução Orçamentária 2026 — dados em tempo real" cor={COR} />

      <main style={{ padding:"92px 32px 52px" }}>

        {/* status */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#94a3b8" }}>
            {updated ? `Última atualização: ${updated.toLocaleTimeString("pt-BR")}` : ""}
          </div>
          <button onClick={carregar} style={{
            padding:"6px 18px", borderRadius:20, border:`1px solid ${COR_BORDA}`,
            background:"#fff", color:COR, cursor:"pointer", fontSize:11, fontWeight:600,
          }}>↻ Atualizar</button>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[
            { label:"Receitas Arrecadadas",  valor: fmtM(totalRec),           icon:"📥", sub:"Total acumulado no ano",            alert:false },
            { label:"Despesas Liquidadas",   valor: fmtM(totalDesp),          icon:"💸", sub:"Total liquidado no período",        alert:false },
            { label:"Saldo do Período",      valor: fmtM(saldo),              icon:"⚖️", sub: saldo >= 0 ? "Superávit" : "Déficit", alert:saldo < 0 },
            { label:"Previsão FUNDEB 2026",  valor: fmtM(previsto),           icon:"🏛️", sub:`${percFundeb.toFixed(1)}% executado`,alert:false },
          ].map(k => (
            <div key={k.label} style={{
              background:"#fff", borderRadius:14, padding:"18px 20px",
              boxShadow:`0 2px 12px ${COR}22`,
              borderLeft:`4px solid ${k.alert ? "#ef4444" : COR}`,
              display:"flex", alignItems:"center", gap:14,
            }}>
              <span style={{ fontSize:28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color: k.alert ? "#ef4444" : COR }}>{k.valor}</div>
                <div style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>{k.label}</div>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra % FUNDEB */}
        {previsto > 0 && (
          <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:`0 2px 12px ${COR}18`, marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:COR }}>Execução FUNDEB 2026</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>Arrecadado em relação à previsão anual</div>
              </div>
              <div style={{ fontSize:28, fontWeight:900, color:COR }}>{percFundeb.toFixed(1)}%</div>
            </div>
            <div style={{ background:COR_CLARA, borderRadius:99, height:18, overflow:"hidden", border:`1px solid ${COR_BORDA}` }}>
              <div style={{
                width:`${Math.min(percFundeb,100)}%`, height:"100%",
                background:`linear-gradient(90deg, ${COR_ESCURA}, ${COR}, ${COR_BORDA})`,
                borderRadius:99, transition:"width 1s ease",
              }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"#94a3b8" }}>
              <span>R$ 0</span>
              <span style={{ color:COR, fontWeight:600 }}>Arrecadado: {fmtM(fundebResumo?.anual)}</span>
              <span>Previsto: {fmtM(previsto)}</span>
            </div>
          </div>
        )}

        {/* Mensal + Pizza */}
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginBottom:24 }}>

          <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:`0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight:700, fontSize:14, color:COR, marginBottom:2 }}>Receitas vs Despesas por Mês (R$ M)</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:16 }}>Soma de todas as fontes — apenas meses com movimentação</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosMensais} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" />
                <XAxis dataKey="mes" tick={{ fontSize:10, fill:"#64748b" }} />
                <YAxis tick={{ fontSize:10, fill:"#64748b" }} tickFormatter={v => `${v}M`} />
                <Tooltip content={<TipMensal />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="receitas" name="Receitas" fill={COR}        radius={[4,4,0,0]} />
                <Bar dataKey="despesas" name="Despesas" fill={COR_ESCURA} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:`0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight:700, fontSize:14, color:COR, marginBottom:2 }}>Composição das Receitas</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:12 }}>Distribuição anual por destinação</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pizzaRec} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                  paddingAngle={3} dataKey="value"
                  label={({ percent }) => `${Math.round(percent*100)}%`} labelLine={false}
                  animationBegin={0} animationDuration={800}
                >
                  {pizzaRec.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
                </Pie>
                <Tooltip content={<TipPie />} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize:10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela por destinação */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:`0 2px 12px ${COR}11`, marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:14, color:COR, marginBottom:2 }}>Receita × Despesa por Destinação</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:16 }}>Comparativo anual por fonte de destinação dos recursos</div>

          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${COR_CLARA}` }}>
                {["FONTE","RECEITA ANUAL","DESPESA ANUAL","SALDO","EXECUÇÃO"].map(h => (
                  <th key={h} style={{ textAlign: h === "FONTE" ? "left" : "right", padding:"6px 12px", fontSize:10, color:"#94a3b8", fontWeight:700, letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabelaSecoes.map((r, i) => {
                const pct = r.rec > 0 ? Math.min(r.desp / r.rec * 100, 100) : 0
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${COR_CLARA}` }}>
                    <td style={{ padding:"10px 12px", fontWeight:600, fontSize:13, color:"#334155" }}>
                      <span style={{ display:"inline-block", width:10, height:10, borderRadius:3, background:CORES_BAR[i % CORES_BAR.length], marginRight:8 }} />
                      {r.label}
                    </td>
                    <td style={{ padding:"10px 12px", fontSize:13, textAlign:"right", color:"#15803d", fontWeight:700 }}>{fmtM(r.rec)}</td>
                    <td style={{ padding:"10px 12px", fontSize:13, textAlign:"right", color:"#b8930a", fontWeight:700 }}>{fmtM(r.desp)}</td>
                    <td style={{ padding:"10px 12px", fontSize:13, textAlign:"right", fontWeight:700, color: r.saldo >= 0 ? "#15803d" : "#b91c1c" }}>{fmtM(r.saldo)}</td>
                    <td style={{ padding:"10px 12px", minWidth:120 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
                        <div style={{ flex:1, background:COR_CLARA, borderRadius:99, height:8, overflow:"hidden", border:`1px solid ${COR_BORDA}` }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: pct > 100 ? "#ef4444" : COR, borderRadius:99 }} />
                        </div>
                        <span style={{ fontSize:11, color:"#64748b", minWidth:36, textAlign:"right" }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign:"center", fontSize:10, color:"#94a3b8", paddingTop:8 }}>
          Fonte: Planilha SEDUC 2026 (Google Sheets) — dados carregados automaticamente
        </div>

      </main>
    </div>
  )
}
