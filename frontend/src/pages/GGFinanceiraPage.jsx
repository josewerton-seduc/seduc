import { useState, useEffect, useCallback } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

/* ── Fontes: col0=fonte, col1=Jan..col12=Dez, col13=Anual, col14=Saldo ──── */
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
    const row = {
      fonte: first, label: fontLabel(first),
      jan:parseBRL(cols[1]),fev:parseBRL(cols[2]),mar:parseBRL(cols[3]),
      abr:parseBRL(cols[4]),mai:parseBRL(cols[5]),jun:parseBRL(cols[6]),
      jul:parseBRL(cols[7]),ago:parseBRL(cols[8]),set:parseBRL(cols[9]),
      out:parseBRL(cols[10]),nov:parseBRL(cols[11]),dez:parseBRL(cols[12]),
      anual:parseBRL(cols[13]), saldo:parseBRL(cols[14]),
    }
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
      if (fn.includes("receita por"))
        secRec = { jan:parseBRL(cols[2]),fev:parseBRL(cols[3]),mar:parseBRL(cols[4]),anual:parseBRL(cols[15]) }
      else if (fn.includes("despesa por"))
        secDesp = { jan:parseBRL(cols[2]),fev:parseBRL(cols[3]),mar:parseBRL(cols[4]),anual:parseBRL(cols[15]) }
      continue
    }
    if (temDados) resumo.push({ nome:first, previsto:parseBRL(cols[1]), jan:parseBRL(cols[2]), fev:parseBRL(cols[3]), mar:parseBRL(cols[4]), anual:parseBRL(cols[15]) })
  }
  if (sec) secoes.push({ nome:sec, label:labelSec(sec), rec:secRec, desp:secDesp })
  return { resumo, secoes }
}

/* ── Despesas: col0=Fornecedor, col1=Objeto, col4=Jan, col5=Fev, col6=Mar,
              col16=Executado, col17=AExecutar, col18=Fonte, col19=Tipo ─── */
function parseDespesas(text) {
  const clean = text.replace(/^\uFEFF/, "")
  const items = []; let header = true
  for (const raw of clean.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue
    const cols = parseCSVLine(line)
    if (header) { header = false; continue }
    const forn = (cols[0]||"").trim(); if (!forn) continue
    items.push({
      fornecedor: forn,
      objeto: (cols[1]||"").trim(),
      jan: parseBRL(cols[4]), fev: parseBRL(cols[5]), mar: parseBRL(cols[6]),
      executado: parseBRL(cols[16]),
      aExecutar: parseBRL(cols[17]),
      fonte: (cols[18]||"").trim(),
    })
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
function tipoGrupo(obj) {
  const o = nrm(obj||"")
  if (o.includes("folha")||o.includes("rpa")) return "Pessoal"
  if (o.includes("terceirizada")||o.includes("terceiriza")) return "Terceirizados"
  if (o.includes("transporte")) return "Transporte"
  if (o.includes("manutencao")||o.includes("obra")||o.includes("investimento")) return "Obras/Manutenção"
  if (o.includes("alimento")||o.includes("genero")||o.includes("merenda")) return "Alimentação"
  if (o.includes("material")||o.includes("consumo")||o.includes("livro")||o.includes("didatico")) return "Material"
  if (o.includes("locacao")||o.includes("imovel")||o.includes("software")) return "Locações"
  if (o.includes("servico")||o.includes("servic")) return "Serviços"
  return "Outros"
}

/* ── Tooltips ────────────────────────────────────────────────────────────── */
const TipM = ({active,payload,label}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:`0 4px 12px ${COR}33`}}>
    <div style={{fontWeight:700,color:COR,marginBottom:6}}>{label}</div>
    {payload.map(p=><div key={p.name} style={{color:p.color}}>● {p.name}: <b>R$ {Number(p.value).toFixed(1)}M</b></div>)}
  </div>
}
const TipP = ({active,payload}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:`0 4px 12px ${COR}33`}}>
    <div style={{fontWeight:700,color:COR}}>{payload[0].name}</div>
    <div>{fmtM(payload[0].value*1e3)}</div>
  </div>
}
const TipH = ({active,payload,label}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:`0 4px 12px ${COR}33`}}>
    <div style={{fontWeight:700,color:COR,marginBottom:4}}>{label}</div>
    {payload.map(p=><div key={p.name} style={{color:p.color}}>● {p.name}: <b>{fmtM(p.value*1e6)}</b></div>)}
  </div>
}

/* ── Componente de barra de progresso ────────────────────────────────────── */
function BarraExec({rec,desp,label,cor=COR}) {
  const pct = rec > 0 ? Math.min(desp/rec*100,100) : 0
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
        <span style={{fontWeight:600,color:"#334155"}}>{label}</span>
        <span style={{color:pct>100?"#ef4444":COR,fontWeight:700}}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{background:COR_CLARA,borderRadius:99,height:10,overflow:"hidden",border:`1px solid ${COR_BORDA}`}}>
        <div style={{width:`${pct}%`,height:"100%",background:pct>100?"#ef4444":cor,borderRadius:99,transition:"width 1s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginTop:3}}>
        <span>Desp: {fmtM(desp)}</span><span>Rec: {fmtM(rec)}</span>
      </div>
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

  // Mensais (Jan/Fev/Mar) do Fontes
  const dadosMensais = ["jan","fev","mar"].map((m,i)=>({
    mes:["Jan","Fev","Mar"][i],
    receitas: parseFloat((fontes.rec.reduce((s,r)=>s+r[m],0)/1e6).toFixed(2)),
    despesas: parseFloat((fontes.desp.reduce((s,r)=>s+r[m],0)/1e6).toFixed(2)),
  })).filter(x=>x.receitas>0||x.despesas>0)

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
      <Header titulo="Gerência Financeira" sub="Execução Orçamentária 2026 — dados em tempo real" cor={COR}/>

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
              {label:"Total Arrecadado",  valor:fmtM(totalRec),  icon:"📥",sub:"Soma de todas as fontes 2026",   alert:false},
              {label:"Total Liquidado",   valor:fmtM(totalDesp), icon:"💸",sub:"Despesas pagas no período",      alert:false},
              {label:"Saldo do Período",  valor:fmtM(saldo),     icon:"⚖️",sub:saldo>=0?"Superávit":"Déficit",  alert:saldo<0},
              {label:"Previsão FUNDEB",   valor:fmtM(previsto),  icon:"🏛️",sub:`${percFundeb.toFixed(1)}% executado`, alert:false},
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
          <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}18`,marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:COR}}>Despesas × Receitas 2026</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>Total liquidado em relação ao total arrecadado (todas as fontes)</div>
              </div>
              <div style={{fontSize:28,fontWeight:900,color:totalDesp>totalRec?"#ef4444":COR}}>{(totalDesp/totalRec*100).toFixed(1)}%</div>
            </div>
            <div style={{background:COR_CLARA,borderRadius:99,height:18,overflow:"hidden",border:`1px solid ${COR_BORDA}`}}>
              <div style={{width:`${Math.min(totalDesp/totalRec*100,100)}%`,height:"100%",background:`linear-gradient(90deg,${COR_ESCURA},${COR},${COR_BORDA})`,borderRadius:99,transition:"width 1s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:"#94a3b8"}}>
              <span>R$ 0</span>
              <span style={{color:COR,fontWeight:600}}>Desp: {fmtM(totalDesp)}</span>
              <span>Rec: {fmtM(totalRec)}</span>
            </div>
          </div>

          {/* Mensal + Pizza receitas */}
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20,marginBottom:24}}>
            {card(<>
              {cardTitle("Receitas vs Despesas por Mês (R$ M)","Comparativo mensal — Jan/Fev/Mar 2026")}
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
              {cardTitle("Receitas por Fonte","Distribuição anual arrecadada")}
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pizzaRec} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value"
                    label={({percent})=>`${Math.round(percent*100)}%`} labelLine={false}
                    animationBegin={0} animationDuration={800}>
                    {pizzaRec.map((_,i)=><Cell key={i} fill={CORES_PIE[i%CORES_PIE.length]}/>)}
                  </Pie>
                  <Tooltip content={<TipP/>}/>
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{fontSize:9}}/>
                </PieChart>
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

          {/* Barras execução por fonte */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
            {card(<>
              {cardTitle("Receita Anual por Fonte (R$ M)","Arrecadação acumulada em 2026")}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fontesJoined.filter(f=>f.rec>0).map(f=>({fonte:f.label,valor:parseFloat((f.rec/1e6).toFixed(2))}))} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                  <YAxis dataKey="fonte" type="category" tick={{fontSize:9,fill:"#64748b"}} width={110}/>
                  <Tooltip content={<TipH/>}/>
                  <Bar dataKey="valor" name="Receita" radius={[0,6,6,0]}>
                    {fontesJoined.filter(f=>f.rec>0).map((_,i)=><Cell key={i} fill={CORES_BAR[i%CORES_BAR.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>)}
            {card(<>
              {cardTitle("Despesa Anual por Fonte (R$ M)","Liquidações acumuladas em 2026")}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fontesJoined.filter(f=>f.desp>0).map(f=>({fonte:f.label,valor:parseFloat((f.desp/1e6).toFixed(2))}))} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef9c3" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}} tickFormatter={v=>`${v}M`}/>
                  <YAxis dataKey="fonte" type="category" tick={{fontSize:9,fill:"#64748b"}} width={110}/>
                  <Tooltip content={<TipH/>}/>
                  <Bar dataKey="valor" name="Despesa" radius={[0,6,6,0]}>
                    {fontesJoined.filter(f=>f.desp>0).map((_,i)=><Cell key={i} fill={CORES_PIE[i%CORES_PIE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>)}
          </div>

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
                      <td style={{padding:"9px 12px",fontSize:12,textAlign:"right",color:"#15803d",fontWeight:700}}>{fmtM(r.rec)}</td>
                      <td style={{padding:"9px 12px",fontSize:12,textAlign:"right",color:COR,fontWeight:700}}>{fmtM(r.desp)}</td>
                      <td style={{padding:"9px 12px",fontSize:12,textAlign:"right",fontWeight:700,color:r.saldo>=0?"#15803d":"#b91c1c"}}>{fmtM(r.saldo)}</td>
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
              const aExec  = despesas.reduce((s,d)=>s+d.aExecutar,0)
              const forn   = new Set(despesas.map(d=>d.fornecedor)).size
              return [
                {label:"Valor Executado",  valor:fmtM(exec),  icon:"💸",sub:"Total liquidado 2026"},
                {label:"Valor a Executar", valor:fmtM(aExec), icon:"📋",sub:"Saldo do contrato/empenho"},
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

            {/* Pizza por tipo */}
            {card(<>
              {cardTitle("Despesas por Tipo","Distribuição por natureza do gasto")}
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pizzaDesp} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({percent})=>`${Math.round(percent*100)}%`} labelLine={false}
                    animationBegin={0} animationDuration={800}>
                    {pizzaDesp.map((_,i)=><Cell key={i} fill={CORES_PIE[i%CORES_PIE.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>[fmtM(v*1e3),""]}/>
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{fontSize:10}}/>
                </PieChart>
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
                    {["FORNECEDOR","OBJETO","JAN","FEV","MAR","EXECUTADO","FONTE"].map(h=>(
                      <th key={h} style={{textAlign:h==="FORNECEDOR"||h==="OBJETO"?"left":"right",padding:"6px 10px",fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...despesas].sort((a,b)=>b.executado-a.executado).slice(0,50).map((d,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`}}>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#334155",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.fornecedor}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>{d.objeto||"–"}</td>
                      <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:"#334155"}}>{d.jan>0?fmtM(d.jan):"–"}</td>
                      <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:"#334155"}}>{d.fev>0?fmtM(d.fev):"–"}</td>
                      <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:"#334155"}}>{d.mar>0?fmtM(d.mar):"–"}</td>
                      <td style={{padding:"8px 10px",fontSize:12,textAlign:"right",fontWeight:700,color:COR}}>{fmtM(d.executado)}</td>
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
