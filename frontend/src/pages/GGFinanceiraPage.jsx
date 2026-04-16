import { useState, useEffect, useCallback } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from "recharts"

/* ── Paleta ──────────────────────────────────────────────────────────────── */
const COR        = "#b8930a"
const COR_ESCURA = "#8a6d00"
const COR_CLARA  = "#fefce8"
const COR_BORDA  = "#fde047"

const CORES_PIE = ["#b8930a","#64748b","#f97316","#a78bfa","#34d399","#60a5fa","#fbbf24","#f43f5e","#2dd4bf","#818cf8"]
const CORES_BAR = ["#b8930a","#ca9c00","#d4b500","#8a6d00","#a07008","#e0b820","#fde047","#fef08a","#786000","#d4a017"]

/* ── URLs das planilhas ──────────────────────────────────────────────────── */
const BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfvLy-j0BjOHXi5gM-2IXMjnjMG0_JY8gw750K6ppzipVwoB7Wxeg2dnDcmuoHCQ/pub?single=true&output=csv"
const URL_FONTES   = BASE + "&gid=86807994"
const URL_RECEITAS = BASE + "&gid=40577423"
const URL_DESPESAS = BASE + "&gid=1948933385"

/* ── Meses do ano ────────────────────────────────────────────────────────── */
const MESES = [
  {k:"jan",s:"Jan",l:"Janeiro",  col:1},
  {k:"fev",s:"Fev",l:"Fevereiro",col:2},
  {k:"mar",s:"Mar",l:"Março",    col:3},
  {k:"abr",s:"Abr",l:"Abril",   col:4},
  {k:"mai",s:"Mai",l:"Maio",     col:5},
  {k:"jun",s:"Jun",l:"Junho",    col:6},
  {k:"jul",s:"Jul",l:"Julho",    col:7},
  {k:"ago",s:"Ago",l:"Agosto",   col:8},
  {k:"set",s:"Set",l:"Setembro", col:9},
  {k:"out",s:"Out",l:"Outubro",  col:10},
  {k:"nov",s:"Nov",l:"Novembro", col:11},
  {k:"dez",s:"Dez",l:"Dezembro", col:12},
]
// col nas planilhas de despesas: col4=Jan ... col15=Dez
const MESES_DESP_COL = 4 // offset da coluna Jan na aba Despesas

/* ── Mapeamento de fontes ────────────────────────────────────────────────── */
const FONTE_LABELS = {
  "101":"Rec. Próprios","102":"MDE 25%","106":"Conv. Estadual",
  "109":"Sal. Educação","111":"PNAE","115":"Transf. Estado",
  "161":"FUNDEB 70%","162":"FUNDEB 30%","163":"FUNDEB VAAF 70%",
  "164":"FUNDEB VAAF 30%","165":"FUNDEB VAAT 70%","166":"FUNDEB VAAT 30%",
  "179":"FUNDEB ETI 70%",
}
function fontLabel(name) {
  const m = (name || "").match(/^(\d{3})/)
  return m ? (FONTE_LABELS[m[1]] || name) : name
}

/* ── Parse helpers ───────────────────────────────────────────────────────── */
function parseBRL(s) {
  if (!s) return 0
  const str = s.toString().trim()
  if (!str || str === "-") return 0
  const neg = str.startsWith("-") || str.includes("(")
  const n = parseFloat(str.replace(/R\$\s*/gi,"").replace(/\./g,"").replace(",",".").replace(/[\-\(\)\s]/g,""))
  return isNaN(n) ? 0 : neg ? -n : n
}
function parseCSVLine(line) {
  const r = []; let cur = "", inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ }
    else if (c === "," && !inQ) { r.push(cur.trim()); cur = "" }
    else cur += c
  }
  r.push(cur.trim()); return r
}
function nrm(s) {
  return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARSERS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Fontes: col0=fonte, col1=Jan..col12=Dez, col13=Anual ───────────────── */
function parseFontes(text) {
  const clean = text.replace(/^\uFEFF/, "")
  const rec = [], desp = [], saldo = []
  let section = null
  for (const raw of clean.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue
    const cols = parseCSVLine(line)
    const first = (cols[0]||"").trim()
    const f = first.toLowerCase()
    const all = cols.join("").toLowerCase()
    if (f === "receitas")                   { section = "rec";   continue }
    if (all.includes("despesas liquidadas")) { section = "desp";  continue }
    if (f === "saldos por fonte")            { section = "saldo"; continue }
    if (!section || !/^\d{3}\s*-/.test(first)) continue
    const row = { fonte: first, label: fontLabel(first), anual: parseBRL(cols[13]), saldo: parseBRL(cols[14]) }
    for (const m of MESES) row[m.k] = parseBRL(cols[m.col])
    if (section==="rec") rec.push(row)
    else if (section==="desp") desp.push(row)
    else saldo.push(row)
  }
  return { rec, desp, saldo }
}

/* ── Receitas: col0=nome, col1=Previsto, col2=Jan..col13=Dez, col15=Anual ─ */
function parseReceitas(text) {
  const clean = text.replace(/^\uFEFF/, "")
  const resumo = [], secoes = []
  let sec = null, secRec = null, secDesp = null

  const isSecHdr = fn =>
    (fn.includes("fundeb") && (fn.includes("principal")||fn.includes("vaaf")||fn.includes("vaat")||fn.includes("eti"))) ||
    fn.includes("salario") || fn === "pnae"

  const labelSec = nome => {
    const n = nrm(nome)
    if (n.includes("principal")) return "FUNDEB Principal"
    if (n.includes("vaaf"))      return "FUNDEB VAAF"
    if (n.includes("vaat"))      return "FUNDEB VAAT"
    if (n.includes("eti"))       return "FUNDEB ETI"
    if (n.includes("salario"))   return "Sal. Educação"
    if (n.includes("pnae"))      return "PNAE"
    return nome
  }

  for (const raw of clean.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue
    const cols = parseCSVLine(line)
    const first = (cols[0]||"").trim(); if (!first) continue
    const fn = nrm(first)
    if (fn.includes("previsto")||fn.includes("executado")||fn.includes("seduc")||fn.includes("previsao")) continue
    const temDados = cols.slice(1,16).some(c => parseBRL(c) !== 0)
    if (isSecHdr(fn) && !temDados) {
      if (sec) secoes.push({ nome:sec, label:labelSec(sec), rec:secRec, desp:secDesp })
      sec = first; secRec = secDesp = null; continue
    }
    if (sec) {
      const base = { anual: parseBRL(cols[15]) }
      for (const m of MESES) base[m.k] = parseBRL(cols[m.col + 1]) // col2=Jan..col13=Dez
      if (fn.includes("receita por"))      secRec  = base
      else if (fn.includes("despesa por")) secDesp = base
      continue
    }
    if (temDados) {
      const row = { nome:first, previsto:parseBRL(cols[1]), anual:parseBRL(cols[15]) }
      for (const m of MESES) row[m.k] = parseBRL(cols[m.col + 1])
      resumo.push(row)
    }
  }
  if (sec) secoes.push({ nome:sec, label:labelSec(sec), rec:secRec, desp:secDesp })
  return { resumo, secoes }
}

/* ── Despesas: col0=Fornecedor, col1=Objeto, col4=Jan..col15=Dez,
              col16=Executado, col17=AExecutar, col18=Fonte ─────────────── */
function parseDespesas(text) {
  const clean = text.replace(/^\uFEFF/, "")
  const items = []; let header = true
  for (const raw of clean.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue
    const cols = parseCSVLine(line)
    if (header) { header = false; continue }
    const forn = (cols[0]||"").trim(); if (!forn) continue
    const item = {
      fornecedor: forn,
      objeto: (cols[1]||"").trim(),
      executado: parseBRL(cols[16]),
      aExecutar: parseBRL(cols[17]),
      fonte: (cols[18]||"").trim(),
    }
    for (const m of MESES) item[m.k] = parseBRL(cols[MESES_DESP_COL + m.col - 1])
    items.push(item)
  }
  return items
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtM(v) {
  if (v === undefined || v === null || isNaN(v)) return "–"
  const abs = Math.abs(v), sign = v < 0 ? "-" : ""
  if (abs >= 1e6) return `${sign}R$ ${(abs/1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${sign}R$ ${(abs/1e3).toFixed(0)}K`
  return `${sign}R$ ${abs.toLocaleString("pt-BR",{minimumFractionDigits:2})}`
}
// Retorna o valor completo formatado apenas quando fmtM teria abreviado
function fmtExato(v) {
  if (v === undefined || v === null || isNaN(v) || Math.abs(v) < 1e3) return null
  const abs = Math.abs(v)
  return (v < 0 ? "-" : "") + "R$ " + abs.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})
}
function tipoGrupo(obj) {
  const o = nrm(obj||"")
  if (o.includes("folha")||o.includes("rpa")||o.includes("patronal")||o.includes("inss")||o.includes("indeniza")||o.includes("salario familia")) return "Pessoal"
  if (o.includes("terceirizada")||o.includes("terceiriza")) return "Terceirizados"
  if (o.includes("transporte")||o.includes("combustivel")||o.includes("frota")||o.includes("onibus")||o.includes("veiculo")) return "Transporte"
  if (o.includes("manutencao")||o.includes("obra")||o.includes("investimento")||o.includes("reforma")) return "Obras/Manutenção"
  if (o.includes("alimento")||o.includes("genero")||o.includes("merenda")) return "Alimentação"
  if (o.includes("material")||o.includes("consumo")||o.includes("livro")||o.includes("didatico")||o.includes("mochila")||o.includes("mobiliario")||o.includes("equipamento")) return "Material/Equip."
  if (o.includes("locacao")||o.includes("imovel")||o.includes("software")) return "Locações"
  if (o.includes("diaria")) return "Diárias"
  if (o.includes("subvencao")||o.includes("termo")) return "Subvenções"
  if (o.includes("servico")||o.includes("servic")) return "Serviços"
  return "Outros"
}

/* ── Tooltips ────────────────────────────────────────────────────────────── */
const TipM = ({active,payload,label}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:`0 4px 12px ${COR}33`}}>
    <div style={{fontWeight:700,color:COR,marginBottom:6}}>{label}</div>
    {payload.map(p=>{
      const v = Number(p.value)*1e6
      const exato = fmtExato(v)
      return <div key={p.name} style={{color:p.color}}>
        ● {p.name}: <b>R$ {Number(p.value).toFixed(1)}M</b>
        {exato && <span style={{color:"#94a3b8",fontWeight:400,fontSize:10,marginLeft:5}}>({exato})</span>}
      </div>
    })}
  </div>
}
const TipH = ({active,payload,label}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:`0 4px 12px ${COR}33`}}>
    <div style={{fontWeight:700,color:COR,marginBottom:4}}>{label}</div>
    {payload.map(p=>{
      const v = p.value*1e6
      const exato = fmtExato(v)
      return <div key={p.name} style={{color:p.color}}>
        ● {p.name}: <b>{fmtM(v)}</b>
        {exato && <span style={{color:"#94a3b8",fontWeight:400,fontSize:10,marginLeft:5}}>({exato})</span>}
      </div>
    })}
  </div>
}

/* ── Célula de tabela com tooltip de valor exato no hover ────────────────── */
function CelulaValor({v, color, fontWeight=700, fontSize=12}) {
  const [hover, setHover] = useState(false)
  const abrev = fmtM(v)
  const exato = fmtExato(v)
  return (
    <td style={{padding:"9px 12px",fontSize,textAlign:"right",fontWeight,color,position:"relative",cursor:"default",userSelect:"none"}}
      onMouseEnter={()=>exato&&setHover(true)}
      onMouseLeave={()=>setHover(false)}
    >
      {abrev}
      {hover && exato && (
        <div style={{
          position:"absolute",zIndex:60,bottom:"calc(100% + 4px)",right:0,
          background:"#1e293b",color:"#f1f5f9",borderRadius:6,
          padding:"4px 10px",fontSize:11,fontWeight:400,whiteSpace:"nowrap",
          boxShadow:"0 4px 12px #0004",pointerEvents:"none",
        }}>
          {exato}
          <div style={{position:"absolute",bottom:-4,right:14,width:8,height:8,background:"#1e293b",transform:"rotate(45deg)"}}/>
        </div>
      )}
    </td>
  )
}

/* ── Célula de tabela de despesas (padding menor) ───────────────────────── */
function CelulaValorSm({v, color="#334155"}) {
  const [hover, setHover] = useState(false)
  const abrev = v > 0 ? fmtM(v) : "–"
  const exato = v > 0 ? fmtExato(v) : null
  return (
    <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color,position:"relative",cursor:"default",userSelect:"none"}}
      onMouseEnter={()=>exato&&setHover(true)}
      onMouseLeave={()=>setHover(false)}
    >
      {abrev}
      {hover && exato && (
        <div style={{
          position:"absolute",zIndex:60,bottom:"calc(100% + 4px)",right:0,
          background:"#1e293b",color:"#f1f5f9",borderRadius:6,
          padding:"4px 10px",fontSize:11,fontWeight:400,whiteSpace:"nowrap",
          boxShadow:"0 4px 12px #0004",pointerEvents:"none",
        }}>
          {exato}
          <div style={{position:"absolute",bottom:-4,right:14,width:8,height:8,background:"#1e293b",transform:"rotate(45deg)"}}/>
        </div>
      )}
    </td>
  )
}

/* ── Descrições de destinação ────────────────────────────────────────────── */
const DEST_DESC = {
  "FUNDEB Principal": "Recursos do Fundo de Manutenção da Educação Básica — parte principal. Usados principalmente para pagamento de salários dos professores da rede municipal.",
  "FUNDEB VAAF":      "Valor Anual por Aluno Frequente — complementação federal baseada na quantidade de alunos matriculados e frequentes.",
  "FUNDEB VAAT":      "Valor Anual Total por Aluno — parcela que garante um investimento mínimo nacional por aluno, independente da capacidade do município.",
  "FUNDEB ETI":       "Recursos destinados às escolas de Educação em Tempo Integral — alunos com jornada ampliada recebem repasse maior.",
  "Sal. Educação":    "Salário-Educação é uma contribuição social das empresas destinada ao financiamento de programas, projetos e ações voltados para a educação básica pública.",
  "PNAE":             "Programa Nacional de Alimentação Escolar — verba federal exclusiva para compra de alimentos para a merenda escolar.",
}

/* ── Componente de barra de progresso com tooltip ───────────────────────── */
function BarraExec({rec,desp,label,cor=COR}) {
  const [hover, setHover] = useState(false)
  const pct     = rec > 0 ? Math.min(desp/rec*100,100) : 0
  const pctReal = rec > 0 ? (desp/rec*100) : 0
  const sobra   = rec - desp
  const desc    = DEST_DESC[label]

  return (
    <div style={{marginBottom:14,position:"relative"}}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
    >
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
        <span style={{fontWeight:600,color:"#334155",cursor:"default"}}>{label}</span>
        <span style={{color:pctReal>100?"#ef4444":COR,fontWeight:700}}>{pctReal.toFixed(1)}% executado</span>
      </div>
      <div style={{background:COR_CLARA,borderRadius:99,height:10,overflow:"hidden",border:`1px solid ${COR_BORDA}`,cursor:"default"}}>
        <div style={{width:`${pct}%`,height:"100%",background:pctReal>100?"#ef4444":cor,borderRadius:99,transition:"width 1s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginTop:3}}>
        <span>Gasto: {fmtM(desp)}</span>
        <span style={{color:sobra>=0?"#15803d":"#b91c1c",fontWeight:600}}>
          {sobra>=0?`Saldo: ${fmtM(sobra)}`:`Excedeu: ${fmtM(Math.abs(sobra))}`}
        </span>
        <span>Arrecadado: {fmtM(rec)}</span>
      </div>

      {/* Tooltip hover */}
      {hover && (
        <div style={{
          position:"absolute",zIndex:50,bottom:"calc(100% + 8px)",left:0,right:0,
          background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:12,
          padding:"14px 16px",boxShadow:`0 8px 24px ${COR}33`,pointerEvents:"none",
        }}>
          <div style={{fontWeight:700,color:COR,fontSize:13,marginBottom:6}}>{label}</div>
          {desc && <div style={{fontSize:11,color:"#475569",marginBottom:10,lineHeight:1.5}}>{desc}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px",fontSize:11}}>
            <div style={{color:"#64748b"}}>Arrecadado no período</div>
            <div style={{fontWeight:700,color:"#15803d",textAlign:"right"}}>{fmtM(rec)}</div>
            <div style={{color:"#64748b"}}>Gasto no período</div>
            <div style={{fontWeight:700,color:COR,textAlign:"right"}}>{fmtM(desp)}</div>
            <div style={{color:"#64748b"}}>Saldo disponível</div>
            <div style={{fontWeight:700,color:sobra>=0?"#15803d":"#b91c1c",textAlign:"right"}}>{fmtM(sobra)}</div>
            <div style={{color:"#64748b",paddingTop:4,borderTop:`1px solid ${COR_CLARA}`}}>% do arrecadado gasto</div>
            <div style={{fontWeight:800,color:pctReal>100?"#b91c1c":pctReal>80?"#d97706":COR,textAlign:"right",paddingTop:4,borderTop:`1px solid ${COR_CLARA}`}}>
              {pctReal.toFixed(1)}%
              <span style={{fontWeight:400,color:"#94a3b8",fontSize:10,marginLeft:4}}>
                {pctReal>100?"— gastou mais do que arrecadou":pctReal>80?"— atenção: alta execução":"— dentro do esperado"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Barra execução geral com tooltip ───────────────────────────────────── */
function BarraExecGeral({totalRec, totalDesp, dadosMensais, periodoLabel, trimestreLabel}) {
  const [hover, setHover] = useState(false)
  const pctGeral  = totalRec > 0 ? totalDesp/totalRec*100 : 0
  const saldoGeral = totalRec - totalDesp
  return (
    <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}18`,marginBottom:24,position:"relative"}}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:COR}}>Despesas × Receitas — {periodoLabel} 2026</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Do que foi arrecadado no {trimestreLabel}, quanto foi gasto</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:28,fontWeight:900,color:totalDesp>totalRec?"#ef4444":COR}}>{pctGeral.toFixed(1)}%</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>do arrecadado foi gasto</div>
        </div>
      </div>
      <div style={{background:COR_CLARA,borderRadius:99,height:18,overflow:"hidden",border:`1px solid ${COR_BORDA}`,cursor:"default"}}>
        <div style={{width:`${Math.min(pctGeral,100)}%`,height:"100%",background:`linear-gradient(90deg,${COR_ESCURA},${COR},${COR_BORDA})`,borderRadius:99,transition:"width 1s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:"#94a3b8"}}>
        <span>R$ 0</span>
        <span style={{color:COR,fontWeight:600}}>Gasto: {fmtM(totalDesp)}</span>
        <span>Arrecadado: {fmtM(totalRec)}</span>
      </div>

      {hover && (
        <div style={{
          position:"absolute",zIndex:50,top:"calc(100% + 8px)",left:0,right:0,
          background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:14,
          padding:"16px 20px",boxShadow:`0 8px 28px ${COR}33`,pointerEvents:"none",
        }}>
          <div style={{fontWeight:700,color:COR,fontSize:13,marginBottom:8}}>
            Execução orçamentária — {periodoLabel} 2026
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
            {dadosMensais.map(m=>{
              const pM = m.receitas>0?(m.despesas/m.receitas*100):0
              const nome = m.mesLong || m.mes
              return (
                <div key={m.mes} style={{background:COR_CLARA,borderRadius:10,padding:"10px 12px",border:`1px solid ${COR_BORDA}`}}>
                  <div style={{fontWeight:700,color:"#334155",fontSize:12,marginBottom:6}}>{nome}</div>
                  <div style={{fontSize:11,color:"#15803d"}}>Arrecadado: <b>R$ {m.receitas.toFixed(1)}M</b></div>
                  <div style={{fontSize:11,color:COR}}>Gasto: <b>R$ {m.despesas.toFixed(1)}M</b></div>
                  <div style={{fontSize:11,color:pM>100?"#b91c1c":"#64748b",fontWeight:600,marginTop:4}}>{pM.toFixed(1)}% executado</div>
                </div>
              )
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 16px",fontSize:11,marginBottom:10}}>
            <div style={{color:"#64748b"}}>Total arrecadado</div>
            <div style={{color:"#64748b"}}>Total gasto</div>
            <div style={{color:"#64748b"}}>Diferença</div>
            <div style={{fontWeight:700,color:"#15803d"}}>{fmtM(totalRec)}</div>
            <div style={{fontWeight:700,color:COR}}>{fmtM(totalDesp)}</div>
            <div style={{fontWeight:700,color:saldoGeral>=0?"#15803d":"#b91c1c"}}>{fmtM(saldoGeral)}</div>
          </div>
          <div style={{fontSize:11,color:"#475569",background:"#f8fafc",borderRadius:8,padding:"8px 12px",lineHeight:1.6}}>
            {pctGeral>100
              ? `⚠️ As despesas superaram as receitas do ${trimestreLabel} em ${fmtM(Math.abs(saldoGeral))}. Isso é possível porque algumas fontes (ex: MDE 25%) utilizam saldo acumulado de períodos anteriores, não apenas o que foi arrecadado no mês.`
              : `A Secretaria gastou ${pctGeral.toFixed(1)}% do que arrecadou no ${trimestreLabel}. O saldo de ${fmtM(saldoGeral)} permanece disponível nas fontes de recurso.`
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function GerenciaFinanceiraPage() {
  const [dados,      setDados]      = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [updated,    setUpdated]    = useState(null)
  const [aba,        setAba]        = useState("geral")

  const carregar = useCallback(() => {
    setCarregando(true)
    Promise.all([
      fetch(URL_FONTES).then(r=>r.text()),
      fetch(URL_RECEITAS).then(r=>r.text()),
      fetch(URL_DESPESAS).then(r=>r.text()),
    ])
    .then(([tF,tR,tD]) => {
      setDados({ fontes:parseFontes(tF), receitas:parseReceitas(tR), despesas:parseDespesas(tD) })
      setUpdated(new Date())
    })
    .catch(()=>setDados(null))
    .finally(()=>setCarregando(false))
  },[])

  useEffect(()=>{ carregar() },[carregar])

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (carregando) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#fffef0",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:COR}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{fontSize:16,fontWeight:600}}>Carregando dados da planilha...</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:8}}>Buscando informações do Google Sheets</div>
      </div>
    </div>
  )
  if (!dados) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#fffef0",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:"#b91c1c"}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <div style={{fontSize:16,fontWeight:600}}>Não foi possível carregar os dados.</div>
      </div>
    </div>
  )

  /* ── Dados derivados comuns ───────────────────────────────────────────── */
  const { fontes, receitas, despesas } = dados

  // Totais do Fontes
  const totalRec  = fontes.rec.reduce((s,r)=>s+r.anual,0)
  const totalDesp = fontes.desp.reduce((s,r)=>s+r.anual,0)
  const saldo     = totalRec - totalDesp

  // Mensais — detecta automaticamente quais meses têm dados
  const dadosMensais = MESES.map(m=>({
    mes: m.s, mesLong: m.l,
    receitas: parseFloat((fontes.rec.reduce((s,r)=>s+(r[m.k]||0),0)/1e6).toFixed(2)),
    despesas: parseFloat((fontes.desp.reduce((s,r)=>s+(r[m.k]||0),0)/1e6).toFixed(2)),
  })).filter(x=>x.receitas>0||x.despesas>0)

  // Período dinâmico ex: "Jan–Mar", "Jan–Jun", "Jan–Dez"
  const mesesComDados = dadosMensais.length
  const periodoLabel  = mesesComDados === 0 ? "–"
    : mesesComDados === 1 ? dadosMensais[0].mesLong
    : `${dadosMensais[0].mes}–${dadosMensais[mesesComDados-1].mes}`
  const trimestreLabel = mesesComDados <= 3 ? "1º trimestre"
    : mesesComDados <= 6 ? "1º semestre"
    : mesesComDados <= 9 ? "3º trimestre"
    : "ano completo"

  // Pizza receitas por fonte
  const pizzaRec = fontes.rec.filter(r=>r.anual>0).sort((a,b)=>b.anual-a.anual)
    .map(r=>({name:r.label, value:Math.round(r.anual/1e3)}))

  // Top 8 fornecedores
  const topForn = [...despesas].filter(d=>d.executado>0)
    .sort((a,b)=>b.executado-a.executado)
    .reduce((acc,d)=>{
      const ex = acc.find(x=>x.nome===d.fornecedor)
      if (ex) { ex.val += d.executado } else acc.push({nome:d.fornecedor,val:d.executado})
      return acc
    },[]).sort((a,b)=>b.val-a.val).slice(0,8)
    .map(d=>({nome:d.nome.length>22?d.nome.slice(0,22)+"…":d.nome, valor:parseFloat((d.val/1e6).toFixed(2))}))

  // Despesas por tipo
  const despPorTipo = despesas.reduce((acc,d)=>{
    const g = tipoGrupo(d.objeto)
    acc[g] = (acc[g]||0)+d.executado; return acc
  },{})
  const pizzaDesp = Object.entries(despPorTipo).map(([name,value])=>({name,value:Math.round(value/1e3)}))
    .sort((a,b)=>b.value-a.value)

  // Fontes joined (rec + desp)
  const fontesMap = new Map()
  fontes.rec.forEach(r=>fontesMap.set(r.fonte,{label:r.label,rec:r.anual,desp:0}))
  fontes.desp.forEach(d=>{
    if (fontesMap.has(d.fonte)) fontesMap.get(d.fonte).desp=d.anual
    else fontesMap.set(d.fonte,{label:d.label,rec:0,desp:d.anual})
  })
  const fontesJoined = [...fontesMap.values()].map(f=>({...f,saldo:f.rec-f.desp}))
    .filter(f=>f.rec>0||f.desp>0).sort((a,b)=>b.rec-a.rec)

  // FUNDEB previsto
  const fundebRow = receitas.resumo.find(r=>nrm(r.nome)==="fundeb")
  const previsto  = fundebRow?.previsto||0
  const percFundeb = previsto>0 ? (fundebRow?.anual||0)/previsto*100 : 0

  /* ── Estilos das abas ────────────────────────────────────────────────── */
  const ABAS = [{id:"geral",label:"Visão Geral"},{id:"fontes",label:"Fontes"},{id:"receitas",label:"Receitas"},{id:"despesas",label:"Despesas"}]

  const card = (children, extra={}) => (
    <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`,...extra}}>{children}</div>
  )
  const cardTitle = (t,s) => <>
    <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>{t}</div>
    {s && <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>{s}</div>}
  </>

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{minHeight:"100vh",background:"#fffef0",fontFamily:"'Segoe UI',sans-serif",color:"#1a1200"}}>
      <Header titulo="Gerência Financeira" sub={`Execução Orçamentária 2026 — ${periodoLabel} (dados em tempo real)`} cor={COR}/>

      <main style={{padding:"92px 32px 52px"}}>

        {/* Barra de status + abas */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",gap:6}}>
            {ABAS.map(a=>(
              <button key={a.id} onClick={()=>setAba(a.id)} style={{
                padding:"7px 20px",borderRadius:20,border:"none",cursor:"pointer",
                fontWeight:600,fontSize:12,transition:"all 0.2s",
                background:aba===a.id?COR:COR_CLARA,
                color:aba===a.id?"#fff":COR_ESCURA,
                boxShadow:aba===a.id?`0 2px 8px ${COR}44`:"none",
              }}>{a.label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,color:"#94a3b8"}}>{updated?`Atualizado: ${updated.toLocaleTimeString("pt-BR")}`:""}</span>
            <button onClick={carregar} style={{padding:"6px 16px",borderRadius:20,border:`1px solid ${COR_BORDA}`,background:"#fff",color:COR,cursor:"pointer",fontSize:11,fontWeight:600}}>↻ Atualizar</button>
          </div>
        </div>

        {/* ════════════════ ABA: VISÃO GERAL ════════════════ */}
        {aba==="geral" && <>

          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {label:"Total Arrecadado",  valor:fmtM(totalRec),  icon:"📥",sub:`${periodoLabel} 2026 · todas as fontes`,   alert:false},
              {label:"Total Liquidado",   valor:fmtM(totalDesp), icon:"💸",sub:`${periodoLabel} 2026 · despesas pagas`,   alert:false},
              {label:"Saldo do Período",  valor:fmtM(saldo),     icon:"⚖️",sub:saldo>=0?"Superávit":"Déficit",   alert:saldo<0},
              {label:"Previsão FUNDEB",   valor:fmtM(previsto),  icon:"🏛️",sub:`${percFundeb.toFixed(1)}% executado no ano`, alert:false},
            ].map(k=>(
              <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:`0 2px 12px ${COR}22`,borderLeft:`4px solid ${k.alert?"#ef4444":COR}`,display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:28}}>{k.icon}</span>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:k.alert?"#ef4444":COR}}>{k.valor}</div>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{k.label}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{k.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Barra execução */}
          <BarraExecGeral totalRec={totalRec} totalDesp={totalDesp} dadosMensais={dadosMensais} periodoLabel={periodoLabel} trimestreLabel={trimestreLabel}/>

          {/* Mensal + Pizza receitas */}
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20,marginBottom:24}}>
            {card(<>
              {cardTitle("Receitas vs Despesas por Mês (R$ M)",`Comparativo mensal — ${periodoLabel} 2026`)}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosMensais} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3"/>
                  <XAxis dataKey="mes" tick={{fontSize:10,fill:"#64748b"}}/>
                  <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                  <Tooltip content={<TipM/>}/>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="receitas" name="Receitas" fill={COR}        radius={[4,4,0,0]}/>
                  <Bar dataKey="despesas" name="Despesas" fill={COR_ESCURA} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </>)}
            {card(<>
              {cardTitle("Receitas por Fonte",`Ranking por valor arrecadado — ${periodoLabel} 2026`)}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={pizzaRec.map(r=>({fonte:r.name, valor:parseFloat((r.value/1e3).toFixed(2))}))}
                  layout="vertical" barCategoryGap="18%" margin={{top:0,right:48,bottom:0,left:0}}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                  <YAxis dataKey="fonte" type="category" tick={{fontSize:9,fill:"#64748b"}} width={100}/>
                  <Tooltip formatter={v=>[`R$ ${(v).toFixed(1)}M`,""]}/>
                  <Bar dataKey="valor" name="Arrecadado" fill={COR} radius={[0,6,6,0]}>
                    {pizzaRec.map((_,i)=><Cell key={i} fill={CORES_PIE[i%CORES_PIE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>)}
          </div>

          {/* Top fornecedores */}
          {card(<>
            {cardTitle("Top Fornecedores por Valor Executado","Maiores despesas liquidadas por fornecedor em 2026")}
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topForn} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                <YAxis dataKey="nome" type="category" tick={{fontSize:9,fill:"#64748b"}} width={130}/>
                <Tooltip content={<TipH/>}/>
                <Bar dataKey="valor" name="Executado" radius={[0,6,6,0]}>
                  {topForn.map((_,i)=><Cell key={i} fill={CORES_BAR[i%CORES_BAR.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>,{marginBottom:0})}
        </>}

        {/* ════════════════ ABA: FONTES ════════════════ */}
        {aba==="fontes" && <>

          {/* KPIs Fontes */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
            {[
              {label:"Total Receitas",  valor:fmtM(totalRec),  icon:"📥",sub:`${fontes.rec.filter(r=>r.anual>0).length} fontes com arrecadação`},
              {label:"Total Despesas",  valor:fmtM(totalDesp), icon:"💸",sub:`${fontes.desp.filter(r=>r.anual>0).length} fontes com liquidação`},
              {label:"Saldo Geral",     valor:fmtM(saldo),     icon:"⚖️",sub:saldo>=0?"Superávit":"Déficit", alert:saldo<0},
            ].map(k=>(
              <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:`0 2px 12px ${COR}22`,borderLeft:`4px solid ${k.alert?"#ef4444":COR}`,display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:28}}>{k.icon}</span>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:k.alert?"#ef4444":COR}}>{k.valor}</div>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{k.label}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{k.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Receita × Despesa por fonte — bar agrupado */}
          {card(<>
            {cardTitle("Receita × Despesa por Fonte (R$ M)",`Comparativo direto por fonte de recurso — ${periodoLabel} 2026`)}
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={fontesJoined.filter(f=>f.rec>0||f.desp>0).map(f=>({
                  fonte: f.label,
                  receita: parseFloat((f.rec/1e6).toFixed(2)),
                  despesa: parseFloat((f.desp/1e6).toFixed(2)),
                }))}
                layout="vertical" barGap={3} barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                <YAxis dataKey="fonte" type="category" tick={{fontSize:9,fill:"#64748b"}} width={115}/>
                <Tooltip content={<TipH/>}/>
                <Legend iconType="circle" iconSize={9} wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="receita" name="Receita" fill="#15803d" radius={[0,4,4,0]}/>
                <Bar dataKey="despesa" name="Despesa" fill={COR}     radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </>,{marginBottom:24})}

          {/* Tabela saldos */}
          {card(<>
            {cardTitle("Saldo por Fonte de Recurso","Resultado 2026: receita − despesa por fonte")}
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>
                  {["FONTE","RECEITA ANUAL","DESPESA ANUAL","SALDO","EXECUÇÃO"].map(h=>(
                    <th key={h} style={{textAlign:h==="FONTE"?"left":"right",padding:"6px 12px",fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:1}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fontesJoined.map((r,i)=>{
                  const pct = r.rec>0?Math.min(r.desp/r.rec*100,100):r.desp>0?100:0
                  return (
                    <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`}}>
                      <td style={{padding:"9px 12px",fontSize:12,fontWeight:600,color:"#334155"}}>
                        <span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:CORES_BAR[i%CORES_BAR.length],marginRight:7}}/>
                        {r.label}
                      </td>
                      <CelulaValor v={r.rec}   color="#15803d"/>
                      <CelulaValor v={r.desp}  color={COR}/>
                      <CelulaValor v={r.saldo} color={r.saldo>=0?"#15803d":"#b91c1c"}/>
                      <td style={{padding:"9px 12px",minWidth:120}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                          <div style={{flex:1,background:COR_CLARA,borderRadius:99,height:7,overflow:"hidden",border:`1px solid ${COR_BORDA}`}}>
                            <div style={{width:`${pct}%`,height:"100%",background:pct>99?"#ef4444":COR,borderRadius:99}}/>
                          </div>
                          <span style={{fontSize:10,color:"#64748b",minWidth:32,textAlign:"right"}}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>,{marginBottom:0})}
        </>}

        {/* ════════════════ ABA: RECEITAS ════════════════ */}
        {aba==="receitas" && <>

          {/* FUNDEB previsto */}
          {previsto>0 && card(<>
            {cardTitle("Execução FUNDEB 2026","Arrecadação em relação à previsão anual")}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:13,color:"#334155"}}>Previsto: <b style={{color:COR}}>{fmtM(previsto)}</b></div>
              <div style={{fontSize:13,color:"#334155"}}>Arrecadado: <b style={{color:"#15803d"}}>{fmtM(fundebRow?.anual)}</b></div>
              <div style={{fontSize:22,fontWeight:900,color:COR}}>{percFundeb.toFixed(1)}%</div>
            </div>
            <div style={{background:COR_CLARA,borderRadius:99,height:18,overflow:"hidden",border:`1px solid ${COR_BORDA}`}}>
              <div style={{width:`${Math.min(percFundeb,100)}%`,height:"100%",background:`linear-gradient(90deg,${COR_ESCURA},${COR},${COR_BORDA})`,borderRadius:99,transition:"width 1s"}}/>
            </div>
          </>,{marginBottom:24})}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {/* Componentes FUNDEB */}
            {card(<>
              {cardTitle("Componentes do FUNDEB","Previsto vs arrecadado por linha")}
              {receitas.resumo.map((r,i)=>(
                <div key={i} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{fontWeight:600,color:"#334155"}}>{r.nome}</span>
                    <span style={{color:"#94a3b8"}}>{fmtM(r.anual)} {r.previsto>0?`/ ${fmtM(r.previsto)}`:""}</span>
                  </div>
                  {r.previsto>0 && (
                    <div style={{background:COR_CLARA,borderRadius:99,height:8,overflow:"hidden",border:`1px solid ${COR_BORDA}`}}>
                      <div style={{width:`${Math.min(r.anual/r.previsto*100,100)}%`,height:"100%",background:CORES_BAR[i%CORES_BAR.length],borderRadius:99}}/>
                    </div>
                  )}
                </div>
              ))}
            </>)}

            {/* Rec vs Desp por destinação */}
            {card(<>
              {cardTitle("Receita × Despesa por Destinação","Comparativo por tipo de fundo")}
              {receitas.secoes.map((s,i)=>(
                <BarraExec key={i} label={s.label} rec={s.rec?.anual||0} desp={s.desp?.anual||0} cor={CORES_BAR[i%CORES_BAR.length]}/>
              ))}
            </>)}
          </div>
        </>}

        {/* ════════════════ ABA: DESPESAS ════════════════ */}
        {aba==="despesas" && <>

          {/* KPIs Despesas */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
            {(()=>{
              const exec   = despesas.reduce((s,d)=>s+d.executado,0)
              const forn   = new Set(despesas.filter(d=>d.executado>0).map(d=>d.fornecedor)).size
              const nLanc  = despesas.filter(d=>d.executado>0).length
              return [
                {label:"Valor Executado",  valor:fmtM(exec),  icon:"💸",sub:`Total liquidado ${periodoLabel} 2026`},
                {label:"Lançamentos",      valor:nLanc,       icon:"📋",sub:"Empenhos com execução no período"},
                {label:"Fornecedores",     valor:forn,        icon:"🏢",sub:"Distintos com execução"},
              ].map(k=>(
                <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:`0 2px 12px ${COR}22`,borderLeft:`4px solid ${COR}`,display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:28}}>{k.icon}</span>
                  <div>
                    <div style={{fontSize:22,fontWeight:800,color:COR}}>{k.valor}</div>
                    <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{k.label}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{k.sub}</div>
                  </div>
                </div>
              ))
            })()}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:20,marginBottom:24}}>
            {/* Top fornecedores */}
            {card(<>
              {cardTitle("Top Fornecedores — Valor Executado","Maiores contratos liquidados em 2026")}
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topForn} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                  <YAxis dataKey="nome" type="category" tick={{fontSize:9,fill:"#64748b"}} width={130}/>
                  <Tooltip content={<TipH/>}/>
                  <Bar dataKey="valor" name="Executado" radius={[0,6,6,0]}>
                    {topForn.map((_,i)=><Cell key={i} fill={CORES_BAR[i%CORES_BAR.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>)}

            {/* Bar por tipo — ranking de categorias */}
            {card(<>
              {cardTitle("Despesas por Categoria","Valor executado por natureza do gasto")}
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={pizzaDesp.map(d=>({tipo:d.name, valor:parseFloat((d.value/1e3).toFixed(2))}))}
                  layout="vertical" barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                  <YAxis dataKey="tipo" type="category" tick={{fontSize:9,fill:"#64748b"}} width={90}/>
                  <Tooltip formatter={v=>[fmtM(v*1e6),""]}/>
                  <Bar dataKey="valor" name="Executado" radius={[0,6,6,0]}
                    fill={CORES_BAR[0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>)}
          </div>

          {/* Tabela completa */}
          {card(<>
            {cardTitle("Detalhamento das Despesas",`${despesas.length} lançamentos em 2026`)}
            <div style={{overflowY:"auto",maxHeight:340}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{position:"sticky",top:0,background:"#fff"}}>
                  <tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>
                    {["FORNECEDOR","OBJETO",...dadosMensais.map(m=>m.mes.toUpperCase()),"EXECUTADO","FONTE"].map(h=>(
                      <th key={h} style={{textAlign:h==="FORNECEDOR"||h==="OBJETO"?"left":"right",padding:"6px 10px",fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...despesas].sort((a,b)=>b.executado-a.executado).slice(0,50).map((d,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`}}>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#334155",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.fornecedor}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>{d.objeto||"–"}</td>
                      {dadosMensais.map(m=>(
                        <CelulaValorSm key={m.mes} v={d[m.mes.toLowerCase()]}/>
                      ))}
                      <CelulaValorSm v={d.executado} color={COR}/>
                      <td style={{padding:"8px 10px",fontSize:10,color:"#64748b",whiteSpace:"nowrap"}}>{fontLabel(d.fonte)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>,{marginBottom:0})}
        </>}

        <div style={{textAlign:"center",fontSize:10,color:"#94a3b8",paddingTop:16}}>
          Fonte: Planilha SEDUC 2026 (Google Sheets) — dados carregados automaticamente
        </div>
      </main>
    </div>
  )
}
