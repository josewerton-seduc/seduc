import { useState, useEffect } from "react"
import Header from "../components/Header"

const COR       = "#c0521a"
const COR_CLARA = "#fff7f0"
const COR_BORDA = "#f4b48a"
const COR_TIPO  = { EM:"#1d7fc4", CMEI:"#2d6a4f", ETI:"#7c3371", CEI:"#c0521a" }

// Planilha publicada como CSV — aba "Ventilação por Escola"
// Para publicar: Arquivo → Compartilhar → Publicar na web → CSV
const URL_VENTILACAO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIedDLJE7F1jR9TwSWAragBm5RPZsFbVu1AXm2b2gBvAj2PujehbVr2-09xU4YXw/pub?output=csv"

const URGENCIA_STYLE = {
  "Alta":   { bg:"#fee2e2", cor:"#b91c1c", borda:"#fca5a5", icone:"🔴" },
  "Média":  { bg:"#fff7ed", cor:"#c2410c", borda:"#fdba74", icone:"🟠" },
  "Baixa":  { bg:"#fefce8", cor:"#a16207", borda:"#fde047", icone:"🟡" },
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(",").map(h => h.trim().replace(/"/g,""))
  return lines.slice(1).map(line => {
    // handle commas inside quotes
    const cols = []
    let cur = "", inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
      else cur += ch
    }
    cols.push(cur.trim())
    const obj = {}
    header.forEach((h, i) => obj[h] = (cols[i] || "").replace(/"/g,"").trim())
    return obj
  }).filter(r => r["UNIDADE ESCOLAR"])
}

export default function GGAlimentacaoPage() {
  const [dados, setDados]         = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]           = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState("Todos")
  const [portesFiltro, setPortesFiltro] = useState("Todos")
  const [buscaEscola, setBuscaEscola] = useState("")

  useEffect(() => {
    fetch(URL_VENTILACAO)
      .then(r => r.text())
      .then(txt => { setDados(parseCSV(txt)); setCarregando(false) })
      .catch(() => { setErro(true); setCarregando(false) })
  }, [])

  if (carregando) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:COR_CLARA,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:COR}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{fontSize:16,fontWeight:600}}>Carregando dados de ventilação...</div>
      </div>
    </div>
  )

  if (erro) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:COR_CLARA,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:"#b91c1c"}}>
        <div style={{fontSize:48}}>⚠️</div>
        <div style={{fontSize:15,fontWeight:600,marginTop:12}}>Não foi possível carregar a planilha.</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:8}}>Verifique se a planilha está publicada na web (Arquivo → Publicar na web).</div>
      </div>
    </div>
  )

  // Derivações dos dados
  const precisam    = dados.filter(r => r["VENTILAÇÃO"] === "Precisa")
  const naoPrecisam = dados.filter(r => r["VENTILAÇÃO"] === "Não precisa")
  const total       = dados.length

  // Urgência — preenchida pela gerente. Agrupa pelo valor da coluna
  const urgenciasDisponiveis = [...new Set(precisam.map(r => r["URGÊNCIA"]).filter(Boolean))]
  const temUrgencia = urgenciasDisponiveis.length > 0

  // Conta por urgência
  const contagemUrgencia = {}
  if (temUrgencia) {
    urgenciasDisponiveis.forEach(u => {
      contagemUrgencia[u] = precisam.filter(r => r["URGÊNCIA"] === u).length
    })
  }

  // Por tipo
  const tipos = [...new Set(dados.map(r => r["TIPO"]).filter(Boolean))]
  const porTipo = tipos.map(t => ({
    tipo: t,
    precisa:    precisam.filter(r => r["TIPO"] === t).length,
    naoPrecisa: naoPrecisam.filter(r => r["TIPO"] === t).length,
    total:      dados.filter(r => r["TIPO"] === t).length,
  })).sort((a,b) => b.precisa - a.precisa)

  // Por porte
  const ordemPorte = ["Extra Grande","Grande","Intermediário","Médio","Pequeno"]
  const portesExistentes = [...new Set(dados.map(r => r["PORTE"]).filter(Boolean))]
    .sort((a,b) => ordemPorte.indexOf(a) - ordemPorte.indexOf(b))
  const porPorte = portesExistentes.map(p => ({
    porte:     p,
    precisa:   precisam.filter(r => r["PORTE"] === p).length,
    naoPrecisa:naoPrecisam.filter(r => r["PORTE"] === p).length,
    total:     dados.filter(r => r["PORTE"] === p).length,
  }))

  // Filtros da lista
  const todosTipos  = ["Todos", ...tipos]
  const todosPortes = ["Todos", ...portesExistentes]
  const precisamFiltradas = precisam.filter(e => {
    const okTipo  = tipoFiltro  === "Todos" || e["TIPO"]  === tipoFiltro
    const okPorte = portesFiltro === "Todos" || e["PORTE"] === portesFiltro
    const okBusca = !buscaEscola || e["UNIDADE ESCOLAR"].toLowerCase().includes(buscaEscola.toLowerCase())
    return okTipo && okPorte && okBusca
  }).sort((a,b) => {
    // Ordena por urgência se existir, senão por porte
    if (temUrgencia) {
      const ord = ["Alta","Média","Baixa"]
      return ord.indexOf(a["URGÊNCIA"]) - ord.indexOf(b["URGÊNCIA"])
    }
    return ordemPorte.indexOf(a["PORTE"]) - ordemPorte.indexOf(b["PORTE"])
  })

  // Cor da barra de porte (quanto maior, mais urgente)
  const corPorte = p => {
    if (p === "Extra Grande" || p === "Grande") return "#ef4444"
    if (p === "Intermediário") return "#f97316"
    return "#fbbf24"
  }

  return (
    <div style={{minHeight:"100vh",background:COR_CLARA,fontFamily:"'Segoe UI',sans-serif",color:"#2d0e00"}}>
      <Header titulo="GG Alimentação Escolar" sub="Painel de acompanhamento nutricional" cor={COR}/>
      <main style={{padding:"92px 32px 52px"}}>

        {/* ── KPIs ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
          {[
            {label:"Precisam de Ventilação", valor:precisam.length,    pct:`${Math.round(precisam.length/total*100)}% da rede`,    icon:"🔴", bg:"#fee2e2", cor:"#b91c1c", borda:"#fca5a5"},
            {label:"Não Precisam",           valor:naoPrecisam.length, pct:`${Math.round(naoPrecisam.length/total*100)}% da rede`,  icon:"✅", bg:"#dcfce7", cor:"#15803d", borda:"#86efac"},
            {label:"Total Mapeado",          valor:total,              pct:"escolas monitoradas",                                   icon:"🏫", bg:"#fff", cor:COR, borda:COR_BORDA},
          ].map(k=>(
            <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"20px 24px",border:`1.5px solid ${k.borda}`,display:"flex",alignItems:"center",gap:18}}>
              <span style={{fontSize:36}}>{k.icon}</span>
              <div>
                <div style={{fontSize:34,fontWeight:900,color:k.cor}}>{k.valor}</div>
                <div style={{fontSize:12,fontWeight:700,color:k.cor}}>{k.label}</div>
                <div style={{fontSize:11,color:k.cor,opacity:.7,marginTop:2}}>{k.pct}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── GRÁFICOS por tipo e porte ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>

          <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
            <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:16}}>Por Tipo de Escola</div>
            {porTipo.map(d=>{
              const pct = Math.round(d.precisa/d.total*100)
              const corT = COR_TIPO[d.tipo]||COR
              return(
                <div key={d.tipo} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{background:corT+"22",color:corT,borderRadius:20,padding:"1px 10px",fontSize:11,fontWeight:700}}>{d.tipo}</span>
                      <span style={{fontSize:11,color:"#64748b"}}>{d.total} escolas</span>
                    </div>
                    <div style={{fontSize:11,fontWeight:700}}>
                      <span style={{color:"#b91c1c"}}>{d.precisa} precisam</span>
                      <span style={{color:"#94a3b8",margin:"0 4px"}}>·</span>
                      <span style={{color:"#15803d"}}>{d.naoPrecisa} ok</span>
                    </div>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:8,height:12,overflow:"hidden",display:"flex"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:"#ef4444",borderRadius:pct===100?"8px":"8px 0 0 8px",transition:"width .6s"}}/>
                    {d.naoPrecisa>0&&<div style={{flex:1,height:"100%",background:"#86efac",borderRadius:"0 8px 8px 0"}}/>}
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>{pct}% precisa de ventilação</div>
                </div>
              )
            })}
          </div>

          <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
            <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:16}}>Por Porte da Escola</div>
            {porPorte.map(d=>{
              const total = d.precisa+d.naoPrecisa
              const pct   = Math.round(d.precisa/total*100)
              return(
                <div key={d.porte} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#334155"}}>{d.porte}</span>
                    <div style={{fontSize:11,fontWeight:700}}>
                      <span style={{color:"#b91c1c"}}>{d.precisa}</span>
                      <span style={{color:"#94a3b8"}}> / {total}</span>
                    </div>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:8,height:12,overflow:"hidden",display:"flex"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:corPorte(d.porte),borderRadius:d.naoPrecisa===0?"8px":"8px 0 0 8px",transition:"width .6s"}}/>
                    {d.naoPrecisa>0&&<div style={{flex:1,height:"100%",background:"#86efac",borderRadius:"0 8px 8px 0"}}/>}
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>{pct}% precisa · <span style={{color:"#15803d"}}>{d.naoPrecisa} ok</span></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── URGÊNCIA (quando preenchida) ── */}
        {temUrgencia && (
          <div style={{background:"#fff",borderRadius:16,padding:"14px 24px",boxShadow:`0 2px 12px ${COR}11`,marginBottom:24,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
            <div style={{fontWeight:700,fontSize:13,color:COR}}>🚨 Urgência:</div>
            {Object.entries(contagemUrgencia).sort((a,b)=>["Alta","Média","Baixa"].indexOf(a[0])-["Alta","Média","Baixa"].indexOf(b[0])).map(([urg,qtd])=>{
              const s = URGENCIA_STYLE[urg] || {bg:"#f1f5f9",cor:"#475569",borda:"#e2e8f0",icone:"⚪"}
              return(
                <div key={urg} style={{display:"flex",alignItems:"center",gap:8,background:s.bg,border:`1.5px solid ${s.borda}`,borderRadius:20,padding:"6px 16px"}}>
                  <span style={{fontSize:14}}>{s.icone}</span>
                  <span style={{fontWeight:800,fontSize:16,color:s.cor}}>{qtd}</span>
                  <span style={{fontSize:11,color:s.cor}}>{urg}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── AVISO quando urgência ainda não preenchida ── */}
        {!temUrgencia && (
          <div style={{background:"#fffbeb",border:"1.5px solid #fde047",borderRadius:12,padding:"14px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:22}}>⏳</span>
            <div>
              <div style={{fontWeight:700,color:"#a16207",fontSize:13}}>Urgência ainda não preenchida</div>
              <div style={{fontSize:12,color:"#92400e",marginTop:2}}>Quando a gerência preencher a coluna "URGÊNCIA" na planilha, o gráfico aparecerá automaticamente aqui.</div>
            </div>
          </div>
        )}

        {/* ── LISTA das que precisam ── */}
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,color:"#b91c1c",marginBottom:2}}>
              🔴 Escolas que Precisam de Ventilação — {precisamFiltradas.length} de {precisam.length}
            </div>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>
              {temUrgencia ? "Ordenadas por urgência · " : ""}Filtre para priorizar ações
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <input placeholder="🔍 Buscar escola..." value={buscaEscola} onChange={e=>setBuscaEscola(e.target.value)}
                style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${COR_BORDA}`,fontSize:11,outline:"none",width:200}}/>
              {todosTipos.map(t=>(
                <button key={t} onClick={()=>setTipoFiltro(t)} style={{padding:"4px 12px",borderRadius:20,border:`2px solid ${tipoFiltro===t?(COR_TIPO[t]||COR):COR_BORDA}`,background:tipoFiltro===t?(COR_TIPO[t]||COR):"#fff",color:tipoFiltro===t?"#fff":(COR_TIPO[t]||COR),fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>{t}</button>
              ))}
              <select value={portesFiltro} onChange={e=>setPortesFiltro(e.target.value)}
                style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${COR_BORDA}`,fontSize:11,background:"#fff",color:COR,cursor:"pointer"}}>
                {todosPortes.map(p=><option key={p} value={p}>{p==="Todos"?"Todos os portes":p}</option>)}
              </select>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {precisamFiltradas.map((e,i)=>{
              const urg = e["URGÊNCIA"]
              const s   = urg ? (URGENCIA_STYLE[urg]||{bg:"#f1f5f9",cor:"#475569",borda:"#e2e8f0",icone:"⚪"}) : null
              return(
                <div key={i} style={{background: s?s.bg:"#fff5f5", border:`1.5px solid ${s?s.borda:"#fca5a5"}`, borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:6}}>
                  {urg && (
                    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                      <span style={{fontSize:12}}>{s.icone}</span>
                      <span style={{fontSize:10,fontWeight:700,color:s.cor,textTransform:"uppercase",letterSpacing:0.5}}>Urgência {urg}</span>
                    </div>
                  )}
                  <div style={{fontSize:12,fontWeight:700,color:"#7f1d1d",lineHeight:1.3}}>{e["UNIDADE ESCOLAR"]}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{background:(COR_TIPO[e["TIPO"]]||COR)+"22",color:COR_TIPO[e["TIPO"]]||COR,borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>{e["TIPO"]}</span>
                    <span style={{background:"#f1f5f9",color:"#64748b",borderRadius:20,padding:"1px 8px",fontSize:10}}>{e["PORTE"]}</span>
                    {e["TGS"]&&<span style={{background:"#eff6ff",color:"#1d4ed8",borderRadius:20,padding:"1px 8px",fontSize:10}}>TGS {e["TGS"]}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
