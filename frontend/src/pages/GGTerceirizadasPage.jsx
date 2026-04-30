import { useState, useEffect, useRef } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts"

const COR = "#1d7fc4"
const COR_CLARA = "#e0f2fe"
const COR_BORDA = "#7dd3fc"

const URL_CARGOS       = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3cjaQkwTjVu0afPbZR8_whTAr1XJ50VFHRoZNliFE79Gp6Y4QTPXO_wH-b_l7x1xgZao1AB2wiZRD/pub?gid=538631305&single=true&output=csv"
const URL_INDICACOES   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3cjaQkwTjVu0afPbZR8_whTAr1XJ50VFHRoZNliFE79Gp6Y4QTPXO_wH-b_l7x1xgZao1AB2wiZRD/pub?gid=890440053&single=true&output=csv"
const URL_DESLIGAMENTOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaWJM70NDSB_sjtr8SkX3xXgZBR4AvVmgyjZtcibj2EcFVtGgpvEnKrC1N9xbEiZbybmRCO33-Qhm8/pub?gid=0&single=true&output=csv"
const URL_AFASTAMENTOS  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaWJM70NDSB_sjtr8SkX3xXgZBR4AvVmgyjZtcibj2EcFVtGgpvEnKrC1N9xbEiZbybmRCO33-Qhm8/pub?gid=155155661&single=true&output=csv"

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

function n(v) {
  if (!v || v === "X" || v === "-" || v.trim() === "") return 0
  return parseInt(v.replace(/\./g, "").replace(/[^0-9-]/g, "")) || 0
}

const VEREADORES_DEF = [
  { col: 16, nome: "Bruno",     partido: "PSDB"    },
  { col: 17, nome: "Galego",    partido: "PSDB"    },
  { col: 18, nome: "Edmilson",  partido: "PSDB"    },
  { col: 19, nome: "Lula",      partido: "PSDB"    },
  { col: 20, nome: "Ricardo",   partido: "PSDB"    },
  { col: 22, nome: "Carlinhos", partido: "PODEMOS" },
  { col: 23, nome: "Jorge",     partido: "PODEMOS" },
  { col: 24, nome: "Hugo",      partido: "PODEMOS" },
  { col: 25, nome: "Macaco",    partido: "PODEMOS" },
  { col: 26, nome: "Anderson",  partido: "PP"      },
  { col: 27, nome: "Letal",     partido: "PP"      },
  { col: 28, nome: "Renato",    partido: "PP"      },
  { col: 29, nome: "Aline",     partido: "PP"      },
  { col: 30, nome: "João Neto", partido: "PSD"     },
  { col: 31, nome: "Raminho",   partido: "PSD"     },
  { col: 32, nome: "Cardoso",   partido: "AVANTE"  },
  { col: 34, nome: "Silvio",    partido: "Oposição"},
  { col: 35, nome: "Gil",       partido: "Oposição"},
  { col: 36, nome: "Fagner",    partido: "Oposição"},
  { col: 37, nome: "Tafarel",   partido: "Oposição"},
  { col: 38, nome: "Edilson",   partido: "Oposição"},
  { col: 39, nome: "Lessa",     partido: "Oposição"},
]

const COR_PARTIDO = {
  "PSDB": "#1d7fc4", "PODEMOS": "#7c3371", "PP": "#c0521a",
  "PSD": "#2d6a4f", "AVANTE": "#b5174f", "Oposição": "#64748b",
}

const COR_SITUACAO = {
  "CONTRATADO": "#15803d", "DESLIGADO": "#b91c1c",
  "SEM INTERESSE": "#94a3b8", "AFASTAMENTO": "#a16207",
  "CANCELADO": "#7e22ce", "MIGRAÇÃO": "#0369a1",
}

function parseCargos(csv) {
  const records = parseCSV(csv)
  const linhaTotais = records.find(r => r[0] === "CARGOS - TOTAIS")
  if (!linhaTotais) return null
  const t = linhaTotais
  const totais = {
    qtd: n(t[2]), livres: n(t[3]),
    prefV: n(t[5]), prefI: n(t[6]),
    camV: n(t[8]), camI: n(t[9]),
    aguPMC: n(t[11]), aguEmp: n(t[12]), contrat: n(t[13]),
  }
  const vereadores = VEREADORES_DEF.map(v => ({
    nome: v.nome, partido: v.partido, indicados: n(t[v.col])
  })).filter(v => v.indicados > 0)
  const cargos = records
    .filter(r => r[0] && r[0].match(/^LT [123]/) && n(r[2]) > 0)
    .map(r => ({
      cargo: r[0].trim(), empresa: r[0].startsWith("LT 2") ? "Solserv" : "Shallon",
      nivel: r[0].startsWith("LT 1") ? "LT 1" : r[0].startsWith("LT 2") ? "LT 2" : "LT 3",
      nomeSimples: r[0].replace(/^LT [123] - /, "").trim(),
      qtd: n(r[2]), livres: n(r[3]),
      prefI: n(r[6]), camI: n(r[9]),
      aguPMC: n(r[11]), aguEmp: n(r[12]), contrat: n(r[13]),
    }))
  return { totais, vereadores, cargos }
}

function parseIndicacoes(csv) {
  const records = parseCSV(csv)
  const dados = records.slice(1).filter(r => r[0] && r[0].trim() !== "")
  const situacoes = {}, instituicoes = {}, funcoes = {}
  dados.forEach(r => {
    const situacao = (r[8] || "").trim().toUpperCase() || "NÃO DEFINIDO"
    const instituicao = (r[4] || "").trim().toUpperCase() || "NÃO DEFINIDO"
    const funcao = (r[3] || "").trim() || "NÃO DEFINIDO"
    situacoes[situacao] = (situacoes[situacao] || 0) + 1
    if (instituicao !== "NÃO DEFINIDO" && instituicao !== "")
      instituicoes[instituicao] = (instituicoes[instituicao] || 0) + 1
    if (funcao !== "NÃO DEFINIDO" && funcao !== "" && funcao.match(/^LT/)) {
      const fn = funcao.replace(/^LT [123] - /, "")
      funcoes[fn] = (funcoes[fn] || 0) + 1
    }
  })
  return {
    total: dados.length,
    situacoes: Object.entries(situacoes)
      .map(([name, value]) => ({ name, value, fill: COR_SITUACAO[name] || "#94a3b8" }))
      .sort((a, b) => b.value - a.value),
    instituicoes: Object.entries(instituicoes)
      .filter(([k]) => ["EM", "CMEI", "ETI", "SEDUC"].includes(k))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    topFuncoes: Object.entries(funcoes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8),
  }
}

// ── Parsers de desligamento e afastamento ───────────────────────────────────
function parseDesligamentos(csv) {
  try {
    const rows = parseCSV(csv).slice(2) // pula "SHALLON" e cabeçalho
    const dados = rows.filter(r =>
      r[0]?.trim() && r[0].trim() !== " " &&
      r[3]?.trim().startsWith("LT") &&
      !["STATUS","SITUAÇÃO"].includes(r[4]?.trim())
    ).map(r => {
      const cargo = r[3]?.trim() || ""
      const cargoSimples = cargo.includes(" - ") ? cargo.split(" - ").slice(1).join(" - ") : cargo
      const lote = cargo.startsWith("LT 1") ? "LT 1" : cargo.startsWith("LT 2") ? "LT 2" : cargo.startsWith("LT 3") ? "LT 3" : "?"
      const status = r[4]?.trim() || ""
      const dtStr = r[9]?.trim() || ""
      let mes = ""
      const m = dtStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
      if (m) mes = `${m[3]}-${m[2]}`
      return {
        nome: r[0].trim(), cargo: cargoSimples, lote, status,
        mes, inst: (r[10]?.trim().toUpperCase() || ""),
        escola: r[11]?.trim() || "",
      }
    })

    const desligados   = dados.filter(d => d.status.includes("DESLIGADO"))
    const contratados  = dados.filter(d => d.status.includes("CONTRATADO"))
    const cancelados   = dados.filter(d => d.status.includes("CANCELAR"))

    // Por cargo (top 8 desligados)
    const cargoCnt = {}
    desligados.forEach(d => { cargoCnt[d.cargo] = (cargoCnt[d.cargo] || 0) + 1 })
    const porCargo = Object.entries(cargoCnt)
      .map(([cargo, qtd]) => ({ cargo, qtd }))
      .sort((a,b) => b.qtd - a.qtd).slice(0,8)

    // Por lote
    const loteCnt = {}
    ;["LT 1","LT 2","LT 3"].forEach(l => { loteCnt[l] = { lote: l, desligados: 0, contratados: 0 } })
    desligados.forEach(d  => { if (loteCnt[d.lote]) loteCnt[d.lote].desligados++ })
    contratados.forEach(d => { if (loteCnt[d.lote]) loteCnt[d.lote].contratados++ })
    const porLote = Object.values(loteCnt)

    // Por instituição
    const instCnt = {}
    desligados.forEach(d => {
      if (["CMEI","EM","ETI","SEDUC"].includes(d.inst))
        instCnt[d.inst] = (instCnt[d.inst] || 0) + 1
    })
    const porInst = Object.entries(instCnt)
      .map(([inst, qtd]) => ({ inst, qtd }))
      .sort((a,b) => b.qtd - a.qtd)

    // Por mês (linha do tempo)
    const mesCnt = {}
    desligados.forEach(d => { if (d.mes) mesCnt[d.mes] = (mesCnt[d.mes] || 0) + 1 })
    const porMes = Object.entries(mesCnt)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, desligamentos]) => ({
        mes: mes.replace(/^(\d{4})-(\d{2})$/, (_,y,m) => {
          const nomes = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
          return `${nomes[parseInt(m)]}/${y.slice(2)}`
        }),
        desligamentos,
      }))

    return {
      total: dados.length, nDesligados: desligados.length,
      nContratados: contratados.length, nCancelados: cancelados.length,
      porCargo, porLote, porInst, porMes,
    }
  } catch(e) {
    console.warn("parseDesligamentos:", e)
    return null
  }
}

function parseAfastamentos(csv) {
  try {
    const rows = parseCSV(csv)
    const dados = []
    for (const r of rows) {
      if (!r[0]?.trim() || r[0].includes("NOME") || r[0].includes("LOTE")) continue
      if (!r[0][0]?.match(/[A-Za-zÀ-ÿ]/)) continue
      if (r[4]?.trim() !== "AFASTAMENTO") continue
      const cargo = r[3]?.trim() || ""
      const cargoSimples = cargo.includes(" - ") ? cargo.split(" - ").slice(1).join(" - ") : cargo
      const obs = (r[5]?.trim() || "").toUpperCase()
      const motivo = obs.includes("MATERNIDADE") ? "Lic. Maternidade"
                   : obs.includes("INSS") ? "INSS / Saúde"
                   : "Outros"
      dados.push({ nome: r[0].trim(), cargo: cargoSimples, motivo })
    }

    const motivoCnt = {}
    dados.forEach(d => { motivoCnt[d.motivo] = (motivoCnt[d.motivo] || 0) + 1 })
    const porMotivo = Object.entries(motivoCnt)
      .map(([motivo, qtd]) => ({ motivo, qtd }))
      .sort((a,b) => b.qtd - a.qtd)

    const cargoCnt = {}
    dados.forEach(d => { cargoCnt[d.cargo] = (cargoCnt[d.cargo] || 0) + 1 })
    const porCargo = Object.entries(cargoCnt)
      .map(([cargo, qtd]) => ({ cargo, qtd }))
      .sort((a,b) => b.qtd - a.qtd).slice(0,6)

    return { total: dados.length, porMotivo, porCargo, lista: dados }
  } catch(e) {
    console.warn("parseAfastamentos:", e)
    return null
  }
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #1d7fc422" }}>
      <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value.toLocaleString("pt-BR")}</b></div>)}
    </div>
  )
}

export default function GGTerceirizadasPage() {
  const [cargos, setCargos]           = useState(null)
  const [indicacoes, setIndicacoes]   = useState(null)
  const [deslig, setDeslig]           = useState(null)
  const [afast, setAfast]             = useState(null)
  const [carregando, setCarregando]   = useState(true)
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas")
  const [filtroPartido, setFiltroPartido] = useState("Todos")
  const [aba, setAba]                 = useState("contratos")
  const quadroRef = useRef(null)
  const scrollParaQuadro = () => quadroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })

  useEffect(() => {
    Promise.all([
      fetch(URL_CARGOS).then(r => r.text()),
      fetch(URL_INDICACOES).then(r => r.text()),
      fetch(URL_DESLIGAMENTOS).then(r => r.text()).catch(() => ""),
      fetch(URL_AFASTAMENTOS).then(r => r.text()).catch(() => ""),
    ]).then(([csvCargos, csvInd, csvDes, csvAf]) => {
      setCargos(parseCargos(csvCargos))
      setIndicacoes(parseIndicacoes(csvInd))
      if (csvDes) setDeslig(parseDesligamentos(csvDes))
      if (csvAf)  setAfast(parseAfastamentos(csvAf))
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [])

  if (carregando) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f7ff", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", color: COR }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando dados da planilha...</div>
      </div>
    </div>
  )
  if (!cargos) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f7ff" }}>
      <div style={{ textAlign: "center", color: "#b91c1c" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Não foi possível carregar os dados.</div>
      </div>
    </div>
  )

  const { totais, vereadores, cargos: listaCargos } = cargos
  const kpis = [
    { label: "Total de Vagas",       valor: totais.qtd.toLocaleString("pt-BR"), icon: "📋", variacao: "vagas no edital",     clicavel: false },
    { label: "Vagas Livres",         valor: totais.livres,                       icon: "🟢", variacao: "disponíveis agora",   clicavel: true  },
    { label: "Contratados",          valor: totais.contrat.toLocaleString("pt-BR"), icon: "✅", variacao: "em exercício",    clicavel: false },
    { label: "Aguardando Processo",  valor: totais.aguPMC + totais.aguEmp,       icon: "⏳", variacao: `${totais.aguPMC} PMC · ${totais.aguEmp} empresa`, clicavel: false },
  ]
  const porEmpresa = ["Shallon", "Solserv"].map(emp => {
    const itens = listaCargos.filter(c => c.empresa === emp)
    return {
      empresa: emp,
      qtd:     itens.reduce((s, c) => s + c.qtd, 0),
      contrat: itens.reduce((s, c) => s + c.contrat, 0),
      livres:  itens.reduce((s, c) => s + c.livres, 0),
      aguPMC:  itens.reduce((s, c) => s + c.aguPMC, 0),
      aguEmp:  itens.reduce((s, c) => s + c.aguEmp, 0),
    }
  })
  const porPartido = Object.entries(
    vereadores.reduce((acc, v) => { acc[v.partido] = (acc[v.partido] || 0) + v.indicados; return acc }, {})
  ).map(([partido, total]) => ({ partido, total })).sort((a, b) => b.total - a.total)
  const veresFiltrados = filtroPartido === "Todos" ? vereadores : vereadores.filter(v => v.partido === filtroPartido)
  const partidos = ["Todos", ...Object.keys(COR_PARTIDO)]
  const cargosFiltrados = filtroEmpresa === "Todas" ? listaCargos : listaCargos.filter(c => c.empresa === filtroEmpresa)
  const topCargos = [...listaCargos].sort((a, b) => b.qtd - a.qtd).slice(0, 8)

  // Cores dos motivos de afastamento
  const COR_MOTIVO = { "Lic. Maternidade": "#7c3371", "INSS / Saúde": "#c0521a", "Outros": "#64748b" }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7ff", fontFamily: "'Segoe UI', sans-serif", color: "#0c4a6e" }}>
      <Header titulo="Gerência Geral das Terceirizadas" sub="Painel de gestão contratual" cor={COR} />
      <main style={{ padding: "92px 32px 52px" }}>

        {/* ── ABAS ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "contratos",    label: "📋 Contratos & Indicações" },
            { id: "rotatividade", label: "🔄 Desligamentos & Afastamentos" },
          ].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "8px 22px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              background: aba === a.id ? COR : "#fff",
              color: aba === a.id ? "#fff" : COR,
              boxShadow: aba === a.id ? `0 2px 10px ${COR}44` : "0 1px 4px #0001",
            }}>{a.label}</button>
          ))}
        </div>

        {/* ════════════════ ABA: CONTRATOS & INDICAÇÕES ════════════════ */}
        {aba === "contratos" && <>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            {kpis.map(k => (
              <div key={k.label} onClick={k.clicavel ? scrollParaQuadro : undefined}
                style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: `0 2px 12px ${COR}18`, borderLeft: `4px solid ${COR}`, display: "flex", alignItems: "center", gap: 14, cursor: k.clicavel ? "pointer" : "default" }}
                onMouseEnter={k.clicavel ? e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 20px ${COR}33` } : undefined}
                onMouseLeave={k.clicavel ? e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 2px 12px ${COR}18` } : undefined}
              >
                <span style={{ fontSize: 28 }}>{k.icon}</span>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: COR }}>{k.valor}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{k.variacao}</div>
                </div>
                {k.clicavel && <span style={{ marginLeft: "auto", fontSize: 14, color: COR, opacity: 0.6 }}>↓</span>}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {porEmpresa.map(e => {
              const pctContrat = Math.round((e.contrat / e.qtd) * 100)
              const corEmp = e.empresa === "Shallon" ? "#0369a1" : "#7c3371"
              return (
                <div key={e.empresa} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, borderTop: `4px solid ${corEmp}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: corEmp }}>{e.empresa}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.empresa === "Shallon" ? "LT 1 e LT 3" : "LT 2"}</div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: corEmp }}>{pctContrat}%</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Total",       valor: e.qtd.toLocaleString("pt-BR"),   cor: corEmp       },
                      { label: "Contratados", valor: e.contrat.toLocaleString("pt-BR"), cor: "#15803d"  },
                      { label: "Livres",      valor: e.livres,                          cor: e.livres > 0 ? "#f97316" : "#94a3b8" },
                      { label: "Aguardando",  valor: e.aguPMC + e.aguEmp,              cor: "#a16207"  },
                    ].map(item => (
                      <div key={item.label} style={{ background: "#f8faff", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.cor }}>{item.valor}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Ocupação das vagas</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: corEmp }}>{pctContrat}%</span>
                    </div>
                    <div style={{ background: COR_CLARA, borderRadius: 8, height: 10, overflow: "hidden" }}>
                      <div style={{ width: `${pctContrat}%`, height: "100%", background: corEmp, borderRadius: 8, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {indicacoes && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Situação dos {indicacoes.total.toLocaleString("pt-BR")} Indicados</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Status atual de cada indicação registrada</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={indicacoes.situacoes} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#334155" }} width={110} />
                    <Tooltip formatter={(v) => [v.toLocaleString("pt-BR"), "indicados"]} />
                    <Bar dataKey="value" name="Indicados" radius={[0,6,6,0]} animationDuration={800}>
                      {indicacoes.situacoes.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Indicados por Instituição</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Distribuição entre CMEI, EM, ETI e SEDUC</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={indicacoes.instituicoes} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => [v.toLocaleString("pt-BR"), "indicados"]} />
                    <Bar dataKey="value" name="Indicados" radius={[6,6,0,0]} animationDuration={800}>
                      {indicacoes.instituicoes.map((_, i) => <Cell key={i} fill={["#1d7fc4","#2d6a4f","#7c3371","#c0521a"][i % 4]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Prefeitura vs. Câmara</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Vagas destinadas e indicados por origem</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: "Prefeitura", vagas: totais.prefV, indicados: totais.prefI },
                  { name: "Câmara",     vagas: totais.camV,  indicados: totais.camI  },
                ]} barCategoryGap="35%" barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#334155", fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="vagas"     name="Vagas destinadas" fill="#bae6fd" radius={[6,6,0,0]} animationDuration={600} />
                  <Bar dataKey="indicados" name="Indicados"        fill={COR}     radius={[6,6,0,0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Indicações por Partido</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Total de indicados por legenda política</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porPartido} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis dataKey="partido" type="category" tick={{ fontSize: 11, fill: "#334155" }} width={72} />
                  <Tooltip formatter={(v) => [v.toLocaleString("pt-BR"), "indicados"]} />
                  <Bar dataKey="total" name="Indicados" radius={[0,6,6,0]} animationDuration={800}>
                    {porPartido.map((e, i) => <Cell key={i} fill={COR_PARTIDO[e.partido] || COR} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Indicações por Vereador</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {partidos.map(p => (
                  <button key={p} onClick={() => setFiltroPartido(p)} style={{
                    padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 11, fontWeight: 600,
                    background: filtroPartido === p ? (COR_PARTIDO[p] || COR) : COR_CLARA,
                    color: filtroPartido === p ? "#fff" : COR, transition: "all 0.2s",
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Filtre por partido clicando acima</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={veresFiltrados} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip formatter={(v, name, props) => [v.toLocaleString("pt-BR"), props.payload.partido]} />
                <Bar dataKey="indicados" name="Indicados" radius={[4,4,0,0]} animationDuration={800}>
                  {veresFiltrados.map((e, i) => <Cell key={i} fill={COR_PARTIDO[e.partido] || COR} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Top Cargos por Quantidade de Vagas</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Vagas totais, contratados e livres nos principais cargos</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topCargos} barGap={4} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                <XAxis dataKey="nomeSimples" tick={{ fontSize: 9, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip content={<TooltipCustom />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="qtd"     name="Total no edital" fill="#bae6fd" radius={[4,4,0,0]} animationDuration={600} />
                <Bar dataKey="contrat" name="Contratados"      fill="#15803d" radius={[4,4,0,0]} animationDuration={800} />
                <Bar dataKey="livres"  name="Vagas livres"     fill="#f97316" radius={[4,4,0,0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div ref={quadroRef} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, scrollMarginTop: 100 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Quadro Geral de Cargos por Empresa</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Shallon = LT 1 e LT 3 · Solserv = LT 2</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Todas", "Shallon", "Solserv"].map(f => (
                  <button key={f} onClick={() => setFiltroEmpresa(f)} style={{
                    padding: "5px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 11, fontWeight: 600,
                    background: filtroEmpresa === f ? (f === "Shallon" ? "#0369a1" : f === "Solserv" ? "#7c3371" : COR) : COR_CLARA,
                    color: filtroEmpresa === f ? "#fff" : COR, transition: "all 0.2s",
                  }}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                    {["EMPRESA","CARGO","VAGAS EDITAL","VAGAS LIVRES","PREF. IND.","CÂM. IND.","AGUARD. PMC","AGUARD. EMP.","CONTRATADOS"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cargosFiltrados.map((d, i) => {
                    const corEmp = d.empresa === "Shallon" ? "#0369a1" : "#7c3371"
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}`, background: i % 2 === 0 ? "#fff" : "#f8fbff" }}>
                        <td style={{ padding: "10px 12px" }}><span style={{ background: corEmp+"22", color: corEmp, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{d.empresa}</span></td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155", fontWeight: 500 }}>
                          <span style={{ background: COR_CLARA, color: COR, borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700, marginRight: 6 }}>{d.nivel}</span>
                          {d.nomeSimples}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: COR, textAlign: "center" }}>{d.qtd.toLocaleString("pt-BR")}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ background: d.livres > 0 ? "#dcfce7" : "#f1f5f9", color: d.livres > 0 ? "#15803d" : "#94a3b8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{d.livres}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569", textAlign: "center" }}>{d.prefI || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569", textAlign: "center" }}>{d.camI || "—"}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>{d.aguPMC > 0 ? <span style={{ background: "#fef9c3", color: "#a16207", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{d.aguPMC}</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>{d.aguEmp > 0 ? <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{d.aguEmp}</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}><span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{d.contrat.toLocaleString("pt-BR")}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${COR_BORDA}`, background: COR_CLARA }}>
                    <td colSpan={2} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: COR }}>TOTAL ({filtroEmpresa})</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: COR, textAlign: "center" }}>{cargosFiltrados.reduce((s,d)=>s+d.qtd,0).toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#15803d" }}>{cargosFiltrados.reduce((s,d)=>s+d.livres,0)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{cargosFiltrados.reduce((s,d)=>s+d.prefI,0).toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{cargosFiltrados.reduce((s,d)=>s+d.camI,0).toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#a16207" }}>{cargosFiltrados.reduce((s,d)=>s+d.aguPMC,0)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>{cargosFiltrados.reduce((s,d)=>s+d.aguEmp,0)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#15803d" }}>{cargosFiltrados.reduce((s,d)=>s+d.contrat,0).toLocaleString("pt-BR")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>}

        {/* ════════════════ ABA: DESLIGAMENTOS & AFASTAMENTOS ════════════════ */}
        {aba === "rotatividade" && <>

          {!deslig && !afast && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 12, padding: "16px 20px", fontSize: 12, color: "#92400e" }}>
              ⏳ Dados não carregados. Verifique se as planilhas estão publicadas na web.
            </div>
          )}

          {deslig && <>
            {/* KPIs desligamentos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Pedidos de Desligamento",   valor: deslig.total,        icon: "📋", cor: COR,       sub: "registros totais"             },
                { label: "Desligados",                 valor: deslig.nDesligados,  icon: "🔴", cor: "#b91c1c", sub: "saídas confirmadas"            },
                { label: "Contratados em Substituição",valor: deslig.nContratados, icon: "🟢", cor: "#15803d", sub: "novos contratados no período"  },
                { label: "Cancelamentos de Deslig.",   valor: deslig.nCancelados,  icon: "↩️", cor: "#7e22ce", sub: "pedidos revertidos"            },
              ].map(k => (
                <div key={k.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: `0 2px 12px ${k.cor}22`, borderLeft: `4px solid ${k.cor}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{k.icon}</span>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: k.cor }}>{k.valor}</div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{k.label}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{k.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Saldo desligamentos vs contratações */}
            {(()=>{
              const saldo = deslig.nContratados - deslig.nDesligados
              const cor = saldo >= 0 ? "#15803d" : "#b91c1c"
              const bg  = saldo >= 0 ? "#dcfce7" : "#fee2e2"
              return(
                <div style={{ background: bg, border: `2px solid ${cor}`, borderRadius: 14, padding: "16px 24px", marginBottom: 24, display: "flex", gap: 20, alignItems: "center" }}>
                  <span style={{ fontSize: 36 }}>{saldo >= 0 ? "📈" : "📉"}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: cor }}>
                      Saldo líquido de pessoal: {saldo >= 0 ? "+" : ""}{saldo} trabalhadores
                    </div>
                    <div style={{ fontSize: 12, color: cor, opacity: 0.85, marginTop: 4 }}>
                      {deslig.nDesligados} desligamentos × {deslig.nContratados} novas contratações registradas no período.
                      {saldo < 0 ? " A rede está encolhendo — os desligamentos superam as contratações." : " As contratações estão cobrindo os desligamentos."}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Linha do tempo + Por lote */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Desligamentos por Mês</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Volume de saídas ao longo do tempo</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={deslig.porMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => [v, "desligamentos"]} />
                    <Line type="monotone" dataKey="desligamentos" stroke="#b91c1c" strokeWidth={2.5} dot={{ r: 4, fill: "#b91c1c" }} activeDot={{ r: 6 }} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Desligamentos × Contratações por Lote</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Comparativo de rotatividade por empresa/lote</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deslig.porLote} barGap={6} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="lote" tick={{ fontSize: 12, fill: "#334155", fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="desligados"  name="Desligados"  fill="#b91c1c" radius={[4,4,0,0]} animationDuration={800} />
                    <Bar dataKey="contratados" name="Contratados" fill="#15803d" radius={[4,4,0,0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Por cargo + Por instituição */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Cargos com Mais Desligamentos</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Top 8 funções — indica onde há maior rotatividade</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deslig.porCargo} layout="vertical" barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
                    <YAxis dataKey="cargo" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={150} />
                    <Tooltip formatter={(v) => [v, "desligamentos"]} />
                    <Bar dataKey="qtd" name="Desligamentos" fill="#b91c1c" radius={[0,6,6,0]} animationDuration={800}>
                      {deslig.porCargo.map((_, i) => <Cell key={i} fill={i < 3 ? "#b91c1c" : i < 6 ? "#ef4444" : "#fca5a5"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Desligamentos por Tipo de Instituição</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Onde estão concentradas as saídas</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                  {deslig.porInst.map(d => {
                    const pct = Math.round(d.qtd / deslig.nDesligados * 100)
                    const corInst = { CMEI:"#2d6a4f", EM:"#1d7fc4", ETI:"#7c3371", SEDUC:"#c0521a" }[d.inst] || COR
                    return (
                      <div key={d.inst}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ background: corInst+"22", color: corInst, borderRadius: 20, padding: "1px 10px", fontSize: 11, fontWeight: 700 }}>{d.inst}</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{d.qtd} desligamentos</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: corInst }}>{pct}%</span>
                        </div>
                        <div style={{ background: "#f1f5f9", borderRadius: 8, height: 10, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: corInst, borderRadius: 8 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>}

          {/* ── AFASTAMENTOS ── */}
          {afast && <>
            <div style={{ borderTop: `2px solid ${COR_CLARA}`, paddingTop: 28, marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: COR, marginBottom: 4 }}>🏥 Afastamentos Ativos</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
                Trabalhadores atualmente afastados das atividades
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: `0 2px 12px ${COR}22`, borderLeft: `4px solid ${COR}`, display: "flex", alignItems: "center", gap: 12, gridColumn: "span 1" }}>
                  <span style={{ fontSize: 26 }}>🏥</span>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: COR }}>{afast.total}</div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Total de Afastados</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>atualmente fora das atividades</div>
                  </div>
                </div>
                {afast.porMotivo.map(m => {
                  const cor = COR_MOTIVO[m.motivo] || "#64748b"
                  const icon = m.motivo === "Lic. Maternidade" ? "🤱" : m.motivo === "INSS / Saúde" ? "🏥" : "📋"
                  return (
                    <div key={m.motivo} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: `0 2px 12px ${cor}22`, borderLeft: `4px solid ${cor}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 26 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: cor }}>{m.qtd}</div>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{m.motivo}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{Math.round(m.qtd/afast.total*100)}% dos afastados</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Pizza motivos */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Afastamentos por Motivo</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Distribuição por tipo de afastamento</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={afast.porMotivo} dataKey="qtd" nameKey="motivo" cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={4} animationBegin={0} animationDuration={800}>
                        {afast.porMotivo.map((e, i) => <Cell key={i} fill={COR_MOTIVO[e.motivo] || "#64748b"} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v, name]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Por cargo */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Cargos com Mais Afastados</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Onde os afastamentos estão concentrados</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={afast.porCargo} layout="vertical" barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
                      <YAxis dataKey="cargo" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={150} />
                      <Tooltip formatter={(v) => [v, "afastados"]} />
                      <Bar dataKey="qtd" name="Afastados" fill="#7c3371" radius={[0,6,6,0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>}
        </>}

      </main>
    </div>
  )
}
