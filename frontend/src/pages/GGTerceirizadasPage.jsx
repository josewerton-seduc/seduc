import { useState, useEffect, useRef } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts"

const COR = "#1d7fc4"
const COR_CLARA = "#e0f2fe"
const COR_BORDA = "#7dd3fc"

const URL_CARGOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3cjaQkwTjVu0afPbZR8_whTAr1XJ50VFHRoZNliFE79Gp6Y4QTPXO_wH-b_l7x1xgZao1AB2wiZRD/pub?gid=538631305&single=true&output=csv"
const URL_INDICACOES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3cjaQkwTjVu0afPbZR8_whTAr1XJ50VFHRoZNliFE79Gp6Y4QTPXO_wH-b_l7x1xgZao1AB2wiZRD/pub?gid=890440053&single=true&output=csv"

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
  "CONTRATADO":    "#15803d",
  "DESLIGADO":     "#b91c1c",
  "SEM INTERESSE": "#94a3b8",
  "AFASTAMENTO":   "#a16207",
  "CANCELADO":     "#7e22ce",
  "MIGRAÇÃO":      "#0369a1",
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
      cargo: r[0].trim(),
      empresa: r[0].startsWith("LT 2") ? "Solserv" : "Shallon",
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
  const situacoes = {}
  const instituicoes = {}
  const funcoes = {}

  dados.forEach(r => {
    const situacao = (r[8] || "").trim().toUpperCase() || "NÃO DEFINIDO"
    const instituicao = (r[4] || "").trim().toUpperCase() || "NÃO DEFINIDO"
    const funcao = (r[3] || "").trim() || "NÃO DEFINIDO"
    situacoes[situacao] = (situacoes[situacao] || 0) + 1
    if (instituicao !== "NÃO DEFINIDO" && instituicao !== "") {
      instituicoes[instituicao] = (instituicoes[instituicao] || 0) + 1
    }
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
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
  const [cargos, setCargos] = useState(null)
  const [indicacoes, setIndicacoes] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas")
  const [filtroPartido, setFiltroPartido] = useState("Todos")

  // ── ref para o quadro geral de cargos ─────────────────────
  const quadroRef = useRef(null)

  const scrollParaQuadro = () => {
    quadroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    Promise.all([
      fetch(URL_CARGOS).then(r => r.text()),
      fetch(URL_INDICACOES).then(r => r.text()),
    ]).then(([csvCargos, csvInd]) => {
      setCargos(parseCargos(csvCargos))
      setIndicacoes(parseIndicacoes(csvInd))
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [])

  if (carregando) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f7ff", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", color: COR }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando dados da planilha...</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Buscando informações do Google Sheets</div>
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

  // ── KPIs ───────────────────────────────────────────────────
  const kpis = [
    {
      label: "Total de Vagas",
      valor: totais.qtd.toLocaleString("pt-BR"),
      icon: "📋",
      variacao: "vagas no edital",
      clicavel: false,
    },
    {
      label: "Vagas Livres",
      valor: totais.livres,
      icon: "🟢",
      variacao: "disponíveis agora",
      clicavel: true,
    },
    {
      label: "Contratados",
      valor: totais.contrat.toLocaleString("pt-BR"),
      icon: "✅",
      variacao: "em exercício",
      clicavel: false,
    },
    {
      label: "Aguardando Processo",
      valor: totais.aguPMC + totais.aguEmp,
      icon: "⏳",
      variacao: `${totais.aguPMC} PMC · ${totais.aguEmp} empresa`,
      clicavel: false,
    },
  ]

  // ── Por empresa ────────────────────────────────────────────
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

  // ── Por partido ─────────────────────────────────────────────
  const porPartido = Object.entries(
    vereadores.reduce((acc, v) => { acc[v.partido] = (acc[v.partido] || 0) + v.indicados; return acc }, {})
  ).map(([partido, total]) => ({ partido, total })).sort((a, b) => b.total - a.total)

  const veresFiltrados = filtroPartido === "Todos" ? vereadores : vereadores.filter(v => v.partido === filtroPartido)
  const partidos = ["Todos", ...Object.keys(COR_PARTIDO)]

  // ── Cargos filtrados por empresa ───────────────────────────
  const cargosFiltrados = filtroEmpresa === "Todas"
    ? listaCargos
    : listaCargos.filter(c => c.empresa === filtroEmpresa)

  const topCargos = [...listaCargos].sort((a, b) => b.qtd - a.qtd).slice(0, 8)

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7ff", fontFamily: "'Segoe UI', sans-serif", color: "#0c4a6e" }}>
      <Header titulo="Gerência Geral das Terceirizadas" sub="Painel de gestão contratual" cor={COR} />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div
              key={k.label}
              onClick={k.clicavel ? scrollParaQuadro : undefined}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: `0 2px 12px ${COR}18`,
                borderLeft: `4px solid ${COR}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: k.clicavel ? "pointer" : "default",
                transition: k.clicavel ? "transform 0.15s, box-shadow 0.15s" : undefined,
                ...(k.clicavel ? { ":hover": { transform: "translateY(-2px)" } } : {}),
              }}
              onMouseEnter={k.clicavel ? e => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = `0 6px 20px ${COR}33`
              } : undefined}
              onMouseLeave={k.clicavel ? e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = `0 2px 12px ${COR}18`
              } : undefined}
            >
              <span style={{ fontSize: 28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: COR }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                <div style={{
                  fontSize: 10,
                  color: "#94a3b8",        // Fixado na cor cinza dos outros cards
                  marginTop: 2,
                  fontWeight: 400,         // Removido o negrito (600)
                  textDecoration: "none",  // Removido o underline
                }}>
                  {k.variacao}
                </div>
              </div>
              {k.clicavel && (
                <span style={{ marginLeft: "auto", fontSize: 14, color: COR, opacity: 0.6 }}>↓</span>
              )}
            </div>
          ))}
        </div>

        {/* EMPRESAS — cards comparativos */}
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
                    { label: "Total",      valor: e.qtd.toLocaleString("pt-BR"),      cor: corEmp         },
                    { label: "Contratados",valor: e.contrat.toLocaleString("pt-BR"),   cor: "#15803d"      },
                    { label: "Livres",     valor: e.livres,                            cor: e.livres > 0 ? "#f97316" : "#94a3b8" },
                    { label: "Aguardando", valor: e.aguPMC + e.aguEmp,                cor: "#a16207"      },
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

        {/* INDICAÇÕES — situação + por instituição */}
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
                    {indicacoes.instituicoes.map((_, i) => (
                      <Cell key={i} fill={["#1d7fc4","#2d6a4f","#7c3371","#c0521a"][i % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pref vs Cam + Por partido */}
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

        {/* Por vereador */}
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

        {/* Top cargos */}
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

        {/* Tabela por empresa — com ref para o scroll */}
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
                  background: filtroEmpresa === f
                    ? (f === "Shallon" ? "#0369a1" : f === "Solserv" ? "#7c3371" : COR)
                    : COR_CLARA,
                  color: filtroEmpresa === f ? "#fff" : COR,
                  transition: "all 0.2s",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                  {["EMPRESA", "CARGO", "VAGAS EDITAL", "VAGAS LIVRES", "PREF. IND.", "CÂM. IND.", "AGUARD. PMC", "AGUARD. EMP.", "CONTRATADOS"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargosFiltrados.map((d, i) => {
                  const corEmp = d.empresa === "Shallon" ? "#0369a1" : "#7c3371"
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}`, background: i % 2 === 0 ? "#fff" : "#f8fbff" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: corEmp + "22", color: corEmp, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{d.empresa}</span>
                      </td>
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
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {d.aguPMC > 0 ? <span style={{ background: "#fef9c3", color: "#a16207", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{d.aguPMC}</span> : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {d.aguEmp > 0 ? <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{d.aguEmp}</span> : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{d.contrat.toLocaleString("pt-BR")}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${COR_BORDA}`, background: COR_CLARA }}>
                  <td colSpan={2} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: COR }}>TOTAL ({filtroEmpresa})</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: COR, textAlign: "center" }}>{cargosFiltrados.reduce((s,d) => s+d.qtd, 0).toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#15803d" }}>{cargosFiltrados.reduce((s,d) => s+d.livres, 0)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{cargosFiltrados.reduce((s,d) => s+d.prefI, 0).toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{cargosFiltrados.reduce((s,d) => s+d.camI, 0).toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#a16207" }}>{cargosFiltrados.reduce((s,d) => s+d.aguPMC, 0)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>{cargosFiltrados.reduce((s,d) => s+d.aguEmp, 0)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#15803d" }}>{cargosFiltrados.reduce((s,d) => s+d.contrat, 0).toLocaleString("pt-BR")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}