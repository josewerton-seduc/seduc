import { useState, useEffect } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

const COR = "#1a3a8f"
const COR_CLARA = "#f0f4ff"
const COR_BORDA = "#a0b4f0"

const URL_IDEAL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqcDF_wR7lKG8A39apK5BeEmSQarUis82_Rt-CK7vp0bm6YywKq-v7CsFtS0T4jXO2VMZonEWzuj31/pub?gid=1020668231&single=true&output=csv"

// CONSOLIDADO — contagem real da aba CONSOLIDADO (verificado 10/04/2026)
// Total: 5.051 servidores · 21 funções principais · fonte única, sem dupla contagem
const CONSOLIDADO_FIXO = [
  { funcao: "AUX DE EDUCAÇÃO",        total: 1154, unidades: 114 },
  { funcao: "ASG",                    total: 692,  unidades: 181 },
  { funcao: "PROFISSIONAL DE APOIO",  total: 645,  unidades: 115 },
  { funcao: "PORTEIRO",               total: 633,  unidades: 171 },
  { funcao: "MERENDEIRA(O)",          total: 494,  unidades: 156 },
  { funcao: "COORDENADOR DE PÁTIO",   total: 286,  unidades: 68  },
  { funcao: "AUX ADM",                total: 198,  unidades: 89  },
  { funcao: "MONITOR DE TRANSPORTES", total: 181,  unidades: 20  },
  { funcao: "ANALISTA ADM",           total: 152,  unidades: 107 },
  { funcao: "MOTORISTA",              total: 104,  unidades: 8   },
  { funcao: "ARTE EDUCADOR",          total: 84,   unidades: 7   },
  { funcao: "LAVADEIRA",              total: 71,   unidades: 36  },
  { funcao: "LACTARISTA",             total: 62,   unidades: 32  },
  { funcao: "BOMBEIRO CIVIL",         total: 59,   unidades: 32  },
  { funcao: "OPER CARGA DESCARGA",    total: 58,   unidades: 3   },
  { funcao: "ZELADOR/MANUTENÇÃO",     total: 57,   unidades: 57  },
  { funcao: "ASSIST OPERACIONAL",     total: 46,   unidades: 31  },
  { funcao: "INTERPRETE DE LIBRAS",   total: 30,   unidades: 16  },
  { funcao: "EDUCADOR FISICO",        total: 23,   unidades: 3   },
  { funcao: "NUTRICIONISTA",          total: 15,   unidades: 2   },
  { funcao: "ESTIVADOR",              total: 7,    unidades: 3   },
]
const TOTAL_CONSOLIDADO = CONSOLIDADO_FIXO.reduce((s,f)=>s+f.total,0)

// CARGOS NÃO-UNITÁRIOS — dados diretos da aba (10/04/2026)
const NAO_UNITARIOS = [
  { gerencia:"MERENDA",               cargo:"ESTIVADOR",              atual:36,  ideal:42,   contratNec:-6,   contratUnit:null },
  { gerencia:"CENTRO DE DISTRIBUIÇÃO",cargo:"OPER CARGA DESCARGA",    atual:23,  ideal:25,   contratNec:-2,   contratUnit:null },
  { gerencia:"REDE FÍSICA",           cargo:"BOMBEIROS",               atual:58,  ideal:92,   contratNec:-34,  contratUnit:314  },
  { gerencia:"TRANSPORTE",            cargo:"MOTORISTAS",              atual:135, ideal:135,  contratNec:0,    contratUnit:null },
  { gerencia:"TRANSPORTE",            cargo:"MONITOR DE TRANSPORTES",  atual:227, ideal:250,  contratNec:-23,  contratUnit:null },
  { gerencia:"ARTES",                 cargo:"ARTE-EDUCADOR(A)",        atual:84,  ideal:99,   contratNec:-15,  contratUnit:157  },
  { gerencia:"GERÊNCIA DE INCLUSÃO",  cargo:"PROFISSIONAL DE APOIO",   atual:645, ideal:1500, contratNec:-855, contratUnit:null },
]
const COR_GERENCIA={"MERENDA":"#c0521a","CENTRO DE DISTRIBUIÇÃO":"#b5174f","REDE FÍSICA":"#1a3a8f","TRANSPORTE":"#0369a1","ARTES":"#7c3371","GERÊNCIA DE INCLUSÃO":"#15803d"}

const AUX_EDUCACAO_MAP = {
  "AMELIA TEREZA DA CONCEICAO":{atual:21,idealAux:22,faltando:1,excedente:0},
  "ARTESAO SEVERINO VITALINO":{atual:24,idealAux:22,faltando:0,excedente:2},
  "ARTISTA PLASTICA LUISA CAVALCANTI MACIEL":{atual:52,idealAux:48,faltando:0,excedente:4},
  "BABU":{atual:36,idealAux:32,faltando:0,excedente:4},
  "DOM ANTONIO SOARES COSTA":{atual:19,idealAux:18,faltando:0,excedente:1},
  "DONA LIQUINHA - MARIA JESUS DA CONCEICAO":{atual:16,idealAux:20,faltando:4,excedente:0},
  "ERIKA PATRICIA":{atual:17,idealAux:14,faltando:0,excedente:3},
  "FERNANDO SOARES LYRA":{atual:51,idealAux:40,faltando:0,excedente:11},
  "FLORA BEZERRA":{atual:19,idealAux:16,faltando:0,excedente:3},
  "GUIOMAR ALVES DE LIMA - GUIOMAR LIMA":{atual:40,idealAux:40,faltando:0,excedente:0},
  "HELENA MARTINS GOMES":{atual:21,idealAux:18,faltando:0,excedente:3},
  "HELENO CUMARU":{atual:15,idealAux:12,faltando:0,excedente:3},
  "IRMA ROSALIA":{atual:21,idealAux:24,faltando:4,excedente:0},
  "IVANISE FLORA ARAUJO DE MENEZES":{atual:40,idealAux:40,faltando:0,excedente:0},
  "JOSE PINHEIRO DOS SANTOS FILHO":{atual:23,idealAux:20,faltando:0,excedente:3},
  "JUSTINA FREITAS":{atual:17,idealAux:16,faltando:0,excedente:1},
  "LEOPOLDINA QUEIROZ DE LIMA":{atual:16,idealAux:12,faltando:0,excedente:4},
  "MARCIA MARIA TEIXEIRA LYRA":{atual:23,idealAux:24,faltando:1,excedente:0},
  "MARIA ALEIR RIBEIRO GALVAO":{atual:30,idealAux:24,faltando:0,excedente:6},
  "PREFEITO ANASTACIO RODRIGUES DA SILVA":{atual:30,idealAux:30,faltando:0,excedente:0},
  "PROFESSOR CARLOS ANTONIO AMARAL DE ALMEIDA":{atual:33,idealAux:38,faltando:5,excedente:0},
  "PROFESSOR HONORIO INACIO DA SILVA FILHO":{atual:15,idealAux:16,faltando:1,excedente:0},
  "PROFESSORA LINDOMAR PINHEIRO":{atual:22,idealAux:26,faltando:4,excedente:0},
  "PROFESSORA MARIA DE LOURDES NASCIMENTO PONTES - TIA LOURDINHA":{atual:41,idealAux:34,faltando:0,excedente:7},
  "PROFESSORA MARIA DO CARMO QUEIROZ CABRAL":{atual:27,idealAux:26,faltando:0,excedente:1},
  "PROFESSORA NERINE FRANCISCA DE CARVALHO":{atual:21,idealAux:18,faltando:0,excedente:3},
  "SEVERINA MARIA DO CARMO - DONA BIU":{atual:33,idealAux:28,faltando:0,excedente:5},
  "SEVERINO JOSE DE OLIVEIRA":{atual:48,idealAux:40,faltando:0,excedente:8},
  "SEVERINO OLIVEIRA DA SILVA - PROFESSOR BIU OLIVEIRA":{atual:17,idealAux:22,faltando:5,excedente:0},
  "TIA CARMINHA":{atual:13,idealAux:16,faltando:3,excedente:0},
  "TIA CLARICE":{atual:22,idealAux:20,faltando:0,excedente:2},
  "TIA MALUDE":{atual:15,idealAux:12,faltando:0,excedente:3},
  "VEREADOR JOSE AILTON DO NASCIMENTO":{atual:19,idealAux:16,faltando:0,excedente:3},
  "WIRTON LIRA":{atual:12,idealAux:12,faltando:0,excedente:0},
  "MERCIA MOURA PINHEIRO":{atual:27,idealAux:24,faltando:0,excedente:3},
}

function mesAnoAtual(){
  return new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).replace(/^\w/,c=>c.toUpperCase())
}
function normEscola(s){
  const p=["CENTRO MUNICIPAL DE EDUCAÇÃO INFANTIL ","CENTRO MUNICIPAL DE EDUCACAO INFANTIL ","CMEI ","CEI ","EM "]
  let r=s.toUpperCase().trim()
  for(const x of p)r=r.replace(x,"")
  r=r.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  return r.replace(/\s+/g," ").trim()
}
function parseCSV(csv){
  const records=[]
  let current=[],field="",inQ=false
  for(let i=0;i<csv.length;i++){
    const ch=csv[i],nx=csv[i+1]
    if(ch==='"'){if(inQ&&nx==='"'){field+='"';i++}else inQ=!inQ}
    else if(ch===','&&!inQ){current.push(field.trim());field=""}
    else if((ch==='\n'||ch==='\r')&&!inQ){
      if(ch==='\r'&&nx==='\n')i++
      current.push(field.trim());field=""
      if(current.some(c=>c!==""))records.push(current)
      current=[]
    }else field+=ch
  }
  if(field||current.length){current.push(field.trim());if(current.some(c=>c!==""))records.push(current)}
  return records
}
function toInt(v){return parseInt((v||"").replace(/[^0-9-]/g,""))||0}

const CARGOS=["ASG","AUX ADM","AUX EDUCAÇÃO","COORD. PÁTIO","LACTARISTA","LAVADEIRA","MERENDEIRO","PORTEIRO","ANALISTA ADM","BOMBEIRO CIVIL"]
const COL_ATUAL=6,COL_IDEAL=18,COL_SALDO=30,IDX_AUX_EDU=2

function processarIdeal(records){
  const escolas=[]
  for(let i=2;i<records.length;i++){
    const r=records[i]
    const tgsRaw=r[0]?.trim()||"",tipo=r[1]?.trim()||"",nome=r[5]?.trim()||""
    if(!nome||nome==="#N/A")continue
    const tgs=tgsRaw.match(/^\d+$/)?tgsRaw:"?"
    const tipoLimpo=tipo==="#N/A"?"":tipo
    const atual=CARGOS.map((_,j)=>toInt(r[COL_ATUAL+j]))
    const ideal=CARGOS.map((_,j)=>toInt(r[COL_IDEAL+j]))
    const saldo=CARGOS.map((_,j)=>toInt(r[COL_SALDO+j]))
    const ax=AUX_EDUCACAO_MAP[normEscola(nome)]
    if(ax){atual[IDX_AUX_EDU]=ax.atual;ideal[IDX_AUX_EDU]=ax.idealAux;saldo[IDX_AUX_EDU]=ax.excedente>0?ax.excedente:-ax.faltando}
    const totalAtual=atual.reduce((s,v)=>s+v,0)
    const totalIdeal=ideal.reduce((s,v)=>s+v,0)
    const faltando=saldo.reduce((s,v)=>s+(v<0?Math.abs(v):0),0)
    const excedente=saldo.reduce((s,v)=>s+(v>0?v:0),0)
    const detFaltando=CARGOS.map((c,j)=>({cargo:c,val:saldo[j]})).filter(x=>x.val<0)
    const detExcedente=CARGOS.map((c,j)=>({cargo:c,val:saldo[j]})).filter(x=>x.val>0)
    const alunos=toInt(r[2])
    const porte=(r[3]?.trim()||"")==="#N/A"?"—":(r[3]?.trim()||"—")
    escolas.push({nome,tgs,tipo:tipoLimpo,alunos,porte,salas:toInt(r[4]),atual,ideal,saldo,totalAtual,totalIdeal,faltando,excedente,detFaltando,detExcedente})
  }
  const totalEscolas=escolas.length
  const totalFaltando=escolas.reduce((s,e)=>s+e.faltando,0)
  const totalExcedente=escolas.reduce((s,e)=>s+e.excedente,0)
  const totalAtual=escolas.reduce((s,e)=>s+e.totalAtual,0)
  const defasagemCargo=CARGOS.map((cargo,j)=>{
    const falt=escolas.reduce((s,e)=>s+(e.saldo[j]<0?Math.abs(e.saldo[j]):0),0)
    const exc=escolas.reduce((s,e)=>s+(e.saldo[j]>0?e.saldo[j]:0),0)
    const escolasFalt=escolas.filter(e=>e.saldo[j]<0).sort((a,b)=>a.saldo[j]-b.saldo[j]).slice(0,5)
    const escolasExc=escolas.filter(e=>e.saldo[j]>0).sort((a,b)=>b.saldo[j]-a.saldo[j]).slice(0,5)
    return{cargo,faltando:falt,excedente:exc,escolasFalt,escolasExc}
  }).sort((a,b)=>b.faltando-a.faltando)
  const porTGS={}
  escolas.forEach(e=>{
    if(!porTGS[e.tgs])porTGS[e.tgs]={tgs:`TGS ${e.tgs}`,tgsNum:e.tgs,escolas:0,faltando:0,excedente:0,atual:0}
    porTGS[e.tgs].escolas++;porTGS[e.tgs].faltando+=e.faltando;porTGS[e.tgs].excedente+=e.excedente;porTGS[e.tgs].atual+=e.totalAtual
  })
  const dadosTGS=Object.values(porTGS).sort((a,b)=>a.tgs.localeCompare(b.tgs))
  const porTipo={}
  escolas.forEach(e=>{
    if(!porTipo[e.tipo])porTipo[e.tipo]={tipo:e.tipo,escolas:0,faltando:0,excedente:0}
    porTipo[e.tipo].escolas++;porTipo[e.tipo].faltando+=e.faltando;porTipo[e.tipo].excedente+=e.excedente
  })
  const todasDefasadas=[...escolas].filter(e=>e.faltando>0).sort((a,b)=>b.faltando-a.faltando)
  return{escolas,totalEscolas,totalFaltando,totalExcedente,totalAtual,defasagemCargo,dadosTGS,porTipo,todasDefasadas}
}

const timelineFicticia=[
  {data:"03/03",setor:"T.I",descricao:"Instalação equipamentos — EE João XXIII",status:"Concluído"},
  {data:"05/03",setor:"Coord. Predial",descricao:"Reforma telhado — EE Assis Chateaubriand",status:"Concluído"},
  {data:"10/03",setor:"Suporte Técnico",descricao:"Troca projetor — EE Barão de Mauá",status:"Concluído"},
  {data:"12/03",setor:"Coord. Predial",descricao:"Vistoria estrutural — CMEI Jardim das Flores",status:"Em andamento"},
  {data:"14/03",setor:"T.I",descricao:"Instalação rede Wi-Fi — EE Rui Barbosa",status:"Em andamento"},
  {data:"17/03",setor:"Suporte Técnico",descricao:"Config. laboratório informática",status:"Aguardando"},
]
const statusStyle={"Concluído":{bg:"#dcfce7",cor:"#15803d"},"Em andamento":{bg:"#dbeafe",cor:"#1d4ed8"},"Aguardando":{bg:"#fef9c3",cor:"#a16207"}}
const COR_TIPO={"EM":"#1d7fc4","CMEI":"#2d6a4f","ETI":"#7c3371","CEI":"#c0521a"}
const COR_TGS=["#1a3a8f","#2563eb","#3b82f6","#60a5fa","#93c5fd","#0369a1","#0284c7","#0ea5e9","#38bdf8"]

// ── Tooltip personalizado: defasagem por cargo ───────────────────────────────
function TooltipDefasagem({active,payload,label,defasagemCargo}){
  if(!active||!payload?.length)return null
  const item=defasagemCargo.find(d=>d.cargo===label)
  if(!item)return null
  return(
    <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:12,padding:"14px 16px",fontSize:11,boxShadow:"0 6px 20px #1a3a8f33",maxWidth:320,zIndex:999}}>
      <div style={{fontWeight:700,color:COR,marginBottom:10,fontSize:13}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <div style={{fontWeight:700,color:"#ef4444",marginBottom:6}}>🔴 Faltando: {item.faltando}</div>
          {item.escolasFalt.map((e,i)=>(
            <div key={i} style={{fontSize:10,color:"#64748b",borderBottom:"1px solid #f1f5f9",paddingBottom:3,marginBottom:3}}>
              <span style={{color:"#b91c1c",fontWeight:600}}>{e.saldo[CARGOS.indexOf(label)]}</span> {e.nome.slice(0,28)}
            </div>
          ))}
          {item.escolasFalt.length===0&&<div style={{fontSize:10,color:"#94a3b8"}}>Nenhuma</div>}
        </div>
        <div>
          <div style={{fontWeight:700,color:"#22c55e",marginBottom:6}}>🟢 Excedente: {item.excedente}</div>
          {item.escolasExc.map((e,i)=>(
            <div key={i} style={{fontSize:10,color:"#64748b",borderBottom:"1px solid #f1f5f9",paddingBottom:3,marginBottom:3}}>
              <span style={{color:"#15803d",fontWeight:600}}>+{e.saldo[CARGOS.indexOf(label)]}</span> {e.nome.slice(0,28)}
            </div>
          ))}
          {item.escolasExc.length===0&&<div style={{fontSize:10,color:"#94a3b8"}}>Nenhuma</div>}
        </div>
      </div>
    </div>
  )
}

// ── Tooltip faltando/excedente na tabela de escolas ──────────────────────────
function TooltipEscola({escola,tipo}){
  const itens=tipo==="faltando"?escola.detFaltando:escola.detExcedente
  if(!itens||itens.length===0)return null
  const cor=tipo==="faltando"?"#b91c1c":"#15803d"
  return(
    <div style={{position:"absolute",zIndex:999,background:"#fff",border:`1.5px solid ${cor}`,borderRadius:10,padding:"10px 14px",fontSize:11,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",minWidth:200,whiteSpace:"nowrap",top:-4,left:"110%"}}>
      <div style={{fontWeight:700,color:cor,marginBottom:6}}>{tipo==="faltando"?"🔴 Cargos faltando":"🟢 Cargos excedendo"}</div>
      {itens.map((x,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"2px 0",borderBottom:"1px solid #f1f5f9"}}>
          <span style={{color:"#334155"}}>{x.cargo}</span>
          <span style={{fontWeight:700,color:cor}}>{tipo==="faltando"?x.val:`+${x.val}`}</span>
        </div>
      ))}
    </div>
  )
}
function CelulaComTooltip({escola,tipo,valor}){
  const [hover,setHover]=useState(false)
  const cor=tipo==="faltando"?"#b91c1c":"#15803d"
  const bg=tipo==="faltando"?"#fee2e2":"#dcfce7"
  if(valor===0)return<span style={{color:"#94a3b8",fontSize:11}}>—</span>
  return(
    <div style={{position:"relative",display:"inline-block"}} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <span style={{background:bg,color:cor,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,cursor:"help",borderBottom:`1px dashed ${cor}`}}>
        {tipo==="faltando"?`-${valor}`:`+${valor}`}
      </span>
      {hover&&<TooltipEscola escola={escola} tipo={tipo}/>}
    </div>
  )
}

// ── Tooltip de quadro de funcionários por escola (aba Distribuição) ──────────
function TooltipFuncoesEscola({escola}){
  if(!escola)return null
  const itens=Object.entries(escola.funcoes).sort((a,b)=>b[1]-a[1])
  if(itens.length===0)return<div style={{position:"absolute",zIndex:999,background:"#fff",border:`1.5px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 14px",fontSize:11,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",minWidth:220,whiteSpace:"nowrap",top:"50%",left:"105%",transform:"translateY(-50%)"}}>Sem servidores registrados</div>
  return(
    <div style={{position:"absolute",zIndex:999,background:"#fff",border:`1.5px solid ${COR_BORDA}`,borderRadius:10,padding:"12px 16px",fontSize:11,boxShadow:"0 4px 20px rgba(0,0,0,0.18)",minWidth:240,whiteSpace:"nowrap",top:"50%",left:"105%",transform:"translateY(-50%)"}}>
      <div style={{fontWeight:700,color:COR,marginBottom:8,fontSize:12}}>👥 Quadro de Funcionários</div>
      <div style={{borderBottom:`1px solid ${COR_CLARA}`,marginBottom:8,paddingBottom:4,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:"#94a3b8",fontSize:10}}>FUNÇÃO</span>
        <span style={{color:"#94a3b8",fontSize:10}}>QTD</span>
      </div>
      {itens.map(([func,qtd],i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:20,padding:"3px 0",borderBottom:"1px solid #f8faff"}}>
          <span style={{color:"#334155"}}>{func}</span>
          <span style={{fontWeight:700,color:COR}}>{qtd}</span>
        </div>
      ))}
      <div style={{borderTop:`1px solid ${COR_CLARA}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:"#475569",fontWeight:600}}>Total</span>
        <span style={{fontWeight:800,color:COR}}>{escola.total}</span>
      </div>
    </div>
  )
}

const TooltipCustom=({active,payload,label})=>{
  if(!active||!payload?.length)return null
  return(
    <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:"0 4px 12px #1a3a8f22"}}>
      <div style={{fontWeight:700,color:COR,marginBottom:6}}>{label}</div>
      {payload.map(p=><div key={p.name} style={{color:p.color}}>● {p.name}: <b>{p.value.toLocaleString("pt-BR")}</b></div>)}
    </div>
  )
}

// CONSOLIDADO_POR_ESCOLA — quadro de funcionários por unidade (fonte: aba CONSOLIDADO)
// Gerado automaticamente em 10/04/2026 — 251 unidades
const CONSOLIDADO_POR_ESCOLA = [
  {tipo:"EM",nome:"ABÍLIO LUÍS DE TORRES",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"ADELINO ALVES DA SILVA",total:7,funcoes:{"ASG":2,"PORTEIRO":2,"MERENDEIRA(O)":2,"AUX DE EDUCAÇÃO":1}},
  {tipo:"EM",nome:"ALFREDO PINTO VIEIRA DE MELO",total:9,funcoes:{"PORTEIRO":5,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1}},
  {tipo:"CMEI",nome:"AMÉLIA TEREZA DA CONCEIÇÃO",total:39,funcoes:{"AUX DE EDUCAÇÃO":22,"ASG":6,"PORTEIRO":3,"MERENDEIRA(O)":2,"LAVADEIRA":2,"LACTARISTA":2,"ANALISTA ADM":1,"ZELADOR/MANUTENÇÃO":1}},
  {tipo:"EM",nome:"ANTONIA MARIA DA CONCEIÇÃO COSTA",total:8,funcoes:{"PORTEIRO":3,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ZELADOR/MANUTENÇÃO":1}},
  {tipo:"EM",nome:"ANTÔNIO ALVES BEZERRA",total:11,funcoes:{"PORTEIRO":5,"ASG":2,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1}},
  {tipo:"EM",nome:"ANTÔNIO LINS DE VASCONCELOS",total:13,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"ETI",nome:"ANTÔNIO MENDONÇA FILHO",total:27,funcoes:{"COORDENADOR DE PÁTIO":9,"ASG":7,"MERENDEIRA(O)":4,"PORTEIRO":3,"PROFISSIONAL DE APOIO":2,"AUX ADM":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"ARTUR OLIVEIRA",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"ARTESÃO SEVERINO VITALINO",total:49,funcoes:{"AUX DE EDUCAÇÃO":24,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":3,"AUX ADM":1,"ANALISTA ADM":1,"LAVADEIRA":3,"LACTARISTA":3,"PROFISSIONAL DE APOIO":1,"ZELADOR/MANUTENÇÃO":1}},
  {tipo:"CMEI",nome:"ARTISTA PLÁSTICA LUÍSA CAVALCANTI MACIEL",total:66,funcoes:{"AUX DE EDUCAÇÃO":52,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"EM",nome:"ASSIS CHATEAUBRIAND",total:16,funcoes:{"PORTEIRO":5,"ASG":4,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1,"BOMBEIRO CIVIL":1}},
  {tipo:"EM",nome:"AUGUSTO FERREIRA LIMA",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"BABÚ",total:48,funcoes:{"AUX DE EDUCAÇÃO":36,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"EM",nome:"BARÃO DE MAUÁ",total:12,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"BENJAMIM ARAÚJO",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"BENTO FERREIRA DE MELO",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"CÂMARA CASCUDO",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"CARNEIRO LEÃO",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"CECÍLIA MEIRELES",total:12,funcoes:{"AUX DE EDUCAÇÃO":6,"ASG":2,"MERENDEIRA(O)":2,"PORTEIRO":2}},
  {tipo:"EM",nome:"CIRILO TARGINO",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"ETI",nome:"CLÓVIS PESSOA CAVALCANTI",total:31,funcoes:{"COORDENADOR DE PÁTIO":8,"ASG":8,"MERENDEIRA(O)":5,"PORTEIRO":4,"PROFISSIONAL DE APOIO":3,"AUX ADM":2,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"CORONEL VIRGÍLIO MOTA",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"DOM ANTÔNIO SOARES COSTA",total:33,funcoes:{"AUX DE EDUCAÇÃO":19,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"CMEI",nome:"DONA LIQUINHA - MARIA JESUS DA CONCEIÇÃO",total:30,funcoes:{"AUX DE EDUCAÇÃO":16,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"EM",nome:"DUDA UMBUZEIRO",total:14,funcoes:{"PORTEIRO":5,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1,"COORDENADOR DE PÁTIO":1}},
  {tipo:"ETI",nome:"EDGAR VIEIRA DE MELO",total:29,funcoes:{"COORDENADOR DE PÁTIO":8,"ASG":7,"MERENDEIRA(O)":5,"PORTEIRO":4,"PROFISSIONAL DE APOIO":2,"AUX ADM":1,"ANALISTA ADM":1,"BOMBEIRO CIVIL":1}},
  {tipo:"EM",nome:"EDMUNDO ROLIM",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"EPITÁCIO PESSOA",total:12,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"ÉRIKA PATRÍCIA",total:30,funcoes:{"AUX DE EDUCAÇÃO":17,"ASG":4,"MERENDEIRA(O)":3,"LACTARISTA":2,"PROFISSIONAL DE APOIO":1,"ANALISTA ADM":1,"LAVADEIRA":1,"ZELADOR/MANUTENÇÃO":1}},
  {tipo:"CMEI",nome:"FERNANDO SOARES LYRA",total:62,funcoes:{"AUX DE EDUCAÇÃO":51,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1}},
  {tipo:"EM",nome:"FLORIANO PEIXOTO",total:9,funcoes:{"PORTEIRO":3,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"FLORA BEZERRA",total:30,funcoes:{"AUX DE EDUCAÇÃO":19,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LACTARISTA":1}},
  {tipo:"EM",nome:"FRANCISCO ARAÚJO LIMA",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"FRANCISCO BARBOSA DA SILVA",total:8,funcoes:{"PORTEIRO":3,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"FRANCISCO CARLOS FERREIRA DA SILVA",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"FRANCISCO FERRAZ DUARTE",total:8,funcoes:{"PORTEIRO":3,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"FRANCELINO GUILHERME DE AZEVEDO",total:12,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":2,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"GRACILIANO RAMOS",total:13,funcoes:{"PORTEIRO":5,"ASG":3,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1,"ZELADOR/MANUTENÇÃO":1}},
  {tipo:"CMEI",nome:"GUIOMAR ALVES DE LIMA - GUIOMAR LIMA",total:54,funcoes:{"AUX DE EDUCAÇÃO":40,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":3,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"HELENA MARTINS GOMES",total:34,funcoes:{"AUX DE EDUCAÇÃO":21,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"HELENO CUMARU",total:27,funcoes:{"AUX DE EDUCAÇÃO":15,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LACTARISTA":1,"LAVADEIRA":1}},
  {tipo:"EM",nome:"HERMES FONTES",total:8,funcoes:{"PORTEIRO":3,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"HORÁCIO DE ALMEIDA",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"JOÃO BARROS",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"JOÃO XXIII",total:13,funcoes:{"PORTEIRO":5,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"JOEL PONTES",total:12,funcoes:{"PORTEIRO":5,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"IRMÃ ROSÁLIA",total:35,funcoes:{"AUX DE EDUCAÇÃO":21,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"CMEI",nome:"IVANISE FLORA ARAUJO DE MENEZES",total:55,funcoes:{"AUX DE EDUCAÇÃO":40,"ASG":6,"MERENDEIRA(O)":4,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"JOSÉ PINHEIRO DOS SANTOS FILHO",total:38,funcoes:{"AUX DE EDUCAÇÃO":23,"ASG":5,"MERENDEIRA(O)":4,"PORTEIRO":3,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"JUSTINA FREITAS",total:30,funcoes:{"AUX DE EDUCAÇÃO":17,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"EM",nome:"JOSÉ FAUSTINO VILA NOVA",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"JOSÉ IRINEU FERREIRA",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"LAURITZEN ARAÚJO",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"LEOPOLDINA QUEIROZ DE LIMA",total:28,funcoes:{"AUX DE EDUCAÇÃO":16,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LACTARISTA":1}},
  {tipo:"EM",nome:"LUÍS MARINHO",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"ETI",nome:"LUÍSA DE MARILAC",total:28,funcoes:{"COORDENADOR DE PÁTIO":7,"ASG":7,"MERENDEIRA(O)":5,"PORTEIRO":4,"PROFISSIONAL DE APOIO":2,"AUX ADM":1,"ANALISTA ADM":1,"BOMBEIRO CIVIL":1}},
  {tipo:"EM",nome:"MANOEL FÉLIX DE ALMEIDA",total:12,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":2,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"MARIA JOSÉ DE FRANÇA",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"MÁRCIA MARIA TEIXEIRA LYRA",total:37,funcoes:{"AUX DE EDUCAÇÃO":23,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"CMEI",nome:"MARIA ALEIR RIBEIRO GALVÃO",total:42,funcoes:{"AUX DE EDUCAÇÃO":30,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"EM",nome:"MESTRE VITALINO",total:18,funcoes:{"PORTEIRO":6,"ASG":4,"PROFISSIONAL DE APOIO":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"COORDENADOR DE PÁTIO":1,"ANALISTA ADM":1,"BOMBEIRO CIVIL":1}},
  {tipo:"CEI",nome:"MÉRCIA MOURA PINHEIRO",total:37,funcoes:{"AUX DE EDUCAÇÃO":24,"ASG":4,"PROFISSIONAL DE APOIO":2,"PORTEIRO":2,"MERENDEIRA(O)":3,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"BOMBEIRO CIVIL":2}},
  {tipo:"EM",nome:"NOSSA SENHORA DE FÁTIMA",total:14,funcoes:{"PORTEIRO":5,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1,"BOMBEIRO CIVIL":1}},
  {tipo:"EM",nome:"NUNES MENDONÇA",total:9,funcoes:{"PORTEIRO":4,"ASG":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"OLINTO VICTOR",total:10,funcoes:{"PORTEIRO":4,"ASG":3,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"PADRE PEDRO RECKZIEGEL",total:11,funcoes:{"PORTEIRO":4,"ASG":3,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"EM",nome:"PAULINA MONTEIRO",total:12,funcoes:{"PORTEIRO":5,"ASG":3,"PROFISSIONAL DE APOIO":1,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"PREFEITO ANASTÁCIO RODRIGUES DA SILVA",total:43,funcoes:{"AUX DE EDUCAÇÃO":30,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"PROFESSOR CARLOS ANTÔNIO AMARAL DE ALMEIDA",total:50,funcoes:{"AUX DE EDUCAÇÃO":33,"ASG":6,"MERENDEIRA(O)":4,"PORTEIRO":3,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"CMEI",nome:"PROFESSOR HONÓRIO INÁCIO DA SILVA FILHO",total:28,funcoes:{"AUX DE EDUCAÇÃO":15,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"PROFESSORA LINDOMAR PINHEIRO",total:34,funcoes:{"AUX DE EDUCAÇÃO":22,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1}},
  {tipo:"CMEI",nome:"PROFESSORA MARIA DE LOURDES NASCIMENTO PONTES - TIA LOURDINHA",total:55,funcoes:{"AUX DE EDUCAÇÃO":41,"ASG":6,"MERENDEIRA(O)":4,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"PROFESSORA MARIA DO CARMO QUEIROZ CABRAL",total:42,funcoes:{"AUX DE EDUCAÇÃO":27,"ASG":6,"MERENDEIRA(O)":4,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"PROFESSORA NERINE FRANCISCA DE CARVALHO",total:34,funcoes:{"AUX DE EDUCAÇÃO":21,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"ETI",nome:"PROFESSOR ALTAIR NUNES PORTO FILHO",total:33,funcoes:{"COORDENADOR DE PÁTIO":9,"ASG":8,"MERENDEIRA(O)":6,"PORTEIRO":4,"PROFISSIONAL DE APOIO":3,"AUX ADM":1,"ANALISTA ADM":1,"BOMBEIRO CIVIL":1}},
  {tipo:"EM",nome:"RUI BARBOSA",total:13,funcoes:{"PORTEIRO":5,"ASG":3,"PROFISSIONAL DE APOIO":2,"AUX DE EDUCAÇÃO":1,"MERENDEIRA(O)":1,"ANALISTA ADM":1}},
  {tipo:"CMEI",nome:"SEVERINA MARIA DO CARMO - DONA BIU",total:47,funcoes:{"AUX DE EDUCAÇÃO":33,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"CMEI",nome:"SEVERINO JOSÉ DE OLIVEIRA",total:63,funcoes:{"AUX DE EDUCAÇÃO":48,"ASG":6,"MERENDEIRA(O)":4,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"SEVERINO OLIVEIRA DA SILVA - PROFESSOR BIU OLIVEIRA",total:30,funcoes:{"AUX DE EDUCAÇÃO":17,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"TIA CARMINHA",total:24,funcoes:{"AUX DE EDUCAÇÃO":13,"ASG":4,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"TIA CLARICE",total:37,funcoes:{"AUX DE EDUCAÇÃO":22,"ASG":6,"MERENDEIRA(O)":4,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"TIA MALUDE",total:28,funcoes:{"AUX DE EDUCAÇÃO":15,"ASG":5,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LACTARISTA":1,"PROFISSIONAL DE APOIO":1}},
  {tipo:"CMEI",nome:"VEREADOR JOSÉ AILTON DO NASCIMENTO",total:33,funcoes:{"AUX DE EDUCAÇÃO":19,"ASG":6,"MERENDEIRA(O)":3,"PORTEIRO":2,"ANALISTA ADM":1,"LAVADEIRA":1,"LACTARISTA":1}},
  {tipo:"CMEI",nome:"WIRTON LIRA",total:21,funcoes:{"AUX DE EDUCAÇÃO":12,"ASG":4,"MERENDEIRA(O)":2,"PORTEIRO":2,"ANALISTA ADM":1}},
  {tipo:"ETI",nome:"ÁLVARO LINS",total:41,funcoes:{"ASG":10,"COORDENADOR DE PÁTIO":8,"PROFISSIONAL DE APOIO":5,"MERENDEIRA(O)":5,"AUX ADM":5,"PORTEIRO":2,"ANALISTA ADM":2,"BOMBEIRO CIVIL":2,"AUX DE EDUCAÇÃO":1,"ZELADOR/MANUTENÇÃO":1}},
]

export default function RedeFisicaPage(){
  const [dados,setDados]=useState(null)
  const [carregando,setCarregando]=useState(true)
  const [filtroTipos,setFiltroTipos]=useState(new Set(["Todos"]))
  const [filtroTGS,setFiltroTGS]=useState("Todos")
  const [busca,setBusca]=useState("")
  const [buscaDist,setBuscaDist]=useState("")
  const [abaAtiva,setAbaAtiva]=useState("quadro")
  const [tgsSelecionada,setTgsSelecionada]=useState(null)
  const [escolaHover,setEscolaHover]=useState(null)

  useEffect(()=>{
    fetch(URL_IDEAL).then(r=>r.text())
      .then(csv=>{try{setDados(processarIdeal(parseCSV(csv)));setCarregando(false)}catch(e){console.error(e);setCarregando(false)}})
      .catch(e=>{console.error(e);setCarregando(false)})
  },[])

  if(carregando)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f4ff",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:COR}}><div style={{fontSize:48,marginBottom:16}}>⏳</div><div style={{fontSize:16,fontWeight:600}}>Carregando dados das unidades escolares...</div></div>
    </div>
  )
  if(!dados)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f4ff"}}>
      <div style={{textAlign:"center",color:"#b91c1c"}}><div style={{fontSize:48}}>⚠️</div><div style={{fontSize:16,fontWeight:600,marginTop:12}}>Erro ao carregar dados.</div></div>
    </div>
  )

  const{totalEscolas,totalFaltando,totalExcedente,defasagemCargo,dadosTGS,porTipo,todasDefasadas,escolas}=dados
  const toggleTipo=(tipo)=>{
    if(tipo==="Todos"){setFiltroTipos(new Set(["Todos"]));return}
    setFiltroTipos(prev=>{const next=new Set(prev);next.delete("Todos");if(next.has(tipo)){next.delete(tipo);if(next.size===0)next.add("Todos")}else next.add(tipo);return next})
  }
  const escolasFiltradas=escolas.filter(e=>{
    const okTipo=filtroTipos.has("Todos")||filtroTipos.has(e.tipo)
    const okTGS=filtroTGS==="Todos"||e.tgs===filtroTGS
    const okBusca=busca===""||e.nome.toLowerCase().includes(busca.toLowerCase())
    return okTipo&&okTGS&&okBusca
  })
  const tipos=["Todos",...Object.keys(porTipo).filter(t=>t!=="TIPO")]
  const tgsList=["Todos",...["1","2","3","4","5","6","7","8","9"]]
  const pizzaTipo=Object.entries(porTipo).filter(([t])=>t!=="TIPO").map(([tipo,d])=>({name:tipo,value:d.escolas,fill:COR_TIPO[tipo]||"#94a3b8"}))
  const escolasDaTGS=tgsSelecionada?escolas.filter(e=>e.tgs===tgsSelecionada).sort((a,b)=>b.faltando-a.faltando):[]
  const dadosCargosSetor=NAO_UNITARIOS.map(c=>({label:c.cargo,gerencia:c.gerencia,atual:c.atual,ideal:c.ideal,faltando:c.contratNec<0?Math.abs(c.contratNec):0,excedente:c.contratNec>0?c.contratNec:0}))
  const alturaDefasadas=Math.max(300,todasDefasadas.length*38)
  const alturaVisivel=8*38

  // Escolas filtradas na aba Distribuição
  const escolasDistFiltradas = CONSOLIDADO_POR_ESCOLA.filter(e=>
    buscaDist===""||e.nome.toLowerCase().includes(buscaDist.toLowerCase())||e.tipo.toLowerCase().includes(buscaDist.toLowerCase())
  ).sort((a,b)=>a.nome.localeCompare(b.nome))

  const kpis=[
    {label:"Unidades Escolares Monitoradas",valor:totalEscolas,icon:"🏫",variacao:"EM, CMEI, ETI e CEI"},
    {label:"Funcionários Ativos",valor:TOTAL_CONSOLIDADO.toLocaleString("pt-BR"),icon:"👥",variacao:"21 funções · aba CONSOLIDADO"},
    {label:"Vagas Faltando",valor:totalFaltando,icon:"⚠️",variacao:"abaixo do ideal"},
    {label:"Vagas Excedentes",valor:totalExcedente,icon:"✅",variacao:"acima do ideal"},
  ]

  return(
    <div style={{minHeight:"100vh",background:"#f0f4ff",fontFamily:"'Segoe UI',sans-serif",color:"#0c1a4e"}}>
      <Header titulo="Gerência Geral de Rede Física" sub="Painel de acompanhamento operacional" extra={mesAnoAtual()} cor={COR}/>
      <main style={{padding:"92px 32px 52px"}}>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
          {kpis.map(k=>(
            <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:`0 2px 12px ${COR}18`,borderLeft:`4px solid ${COR}`,display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:28}}>{k.icon}</span>
              <div>
                <div style={{fontSize:26,fontWeight:800,color:COR}}>{k.valor}</div>
                <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{k.label}</div>
                <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{k.variacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ABAS */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {[{id:"quadro",label:"📊 Quadro de Apoio"},{id:"tgs",label:"🗺️ Por Zona (TGS)"},{id:"distribuicao",label:"👥 Distribuição"},{id:"outros",label:"🔧 Outros Setores"}].map(a=>(
            <button key={a.id} onClick={()=>setAbaAtiva(a.id)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:abaAtiva===a.id?COR:"#fff",color:abaAtiva===a.id?"#fff":COR,boxShadow:"0 2px 8px #1a3a8f18",transition:"all 0.2s"}}>{a.label}</button>
          ))}
        </div>

        {/* ════════════════ ABA: QUADRO DE APOIO ════════════════ */}
        {abaAtiva==="quadro"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
              {/* Defasagem por cargo — filtra apenas cargos com dados */}
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Defasagem por Função</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>Vagas faltando vs. excedentes em toda a rede</div>
                <div style={{fontSize:11,color:COR,marginBottom:12,fontStyle:"italic"}}>💡 Passe o mouse sobre as barras para ver em quais unidades</div>
                {(()=>{
                  const comDados=defasagemCargo.filter(d=>d.faltando>0||d.excedente>0)
                  const semDados=defasagemCargo.filter(d=>d.faltando===0&&d.excedente===0)
                  return(<>
                    <ResponsiveContainer width="100%" height={comDados.length*42+40}>
                      <BarChart data={comDados} layout="vertical" barGap={4} barCategoryGap="22%">
                        <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                        <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}}/>
                        <YAxis dataKey="cargo" type="category" tick={{fontSize:10,fill:"#334155"}} width={100}/>
                        <Tooltip content={(props)=><TooltipDefasagem {...props} defasagemCargo={defasagemCargo}/>}/>
                        <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                        <Bar dataKey="faltando" name="Faltando" fill="#ef4444" radius={[0,4,4,0]} animationDuration={800}/>
                        <Bar dataKey="excedente" name="Excedente" fill="#22c55e" radius={[0,4,4,0]} animationDuration={1000}/>
                      </BarChart>
                    </ResponsiveContainer>
                    {semDados.length>0&&(
                      <div style={{marginTop:12,background:"#f8fafc",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#64748b"}}>
                        ✅ Sem defasagem: <b style={{color:"#475569"}}>{semDados.map(d=>d.cargo).join(", ")}</b> — quadro ideal não preenchido ou em equilíbrio.
                      </div>
                    )}
                  </>)
                })()}
              </div>

              {/* Cargos por Setor — Atual vs Ideal */}
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Cargos por Setor/Gerência</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>Situação atual vs. ideal — aba "CARGOS NÃO-UNITÁRIOS"</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosCargosSetor} layout="vertical" barGap={6} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}}/>
                    <YAxis dataKey="label" type="category" tick={{fontSize:9,fill:"#334155"}} width={155}/>
                    <Tooltip content={({active,payload,label})=>{
                      if(!active||!payload?.length)return null
                      const item=dadosCargosSetor.find(d=>d.label===label)
                      return(
                        <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 14px",fontSize:11,boxShadow:"0 4px 12px #1a3a8f22"}}>
                          <div style={{fontWeight:700,color:COR,marginBottom:6}}>{label}</div>
                          <div style={{color:"#64748b",marginBottom:4}}>Gerência: <b>{item?.gerencia}</b></div>
                          <div style={{color:"#475569"}}>Atual: <b>{item?.atual}</b></div>
                          <div style={{color:"#475569"}}>Ideal: <b>{item?.ideal}</b></div>
                          {item?.faltando>0&&<div style={{color:"#b91c1c"}}>Faltando: <b>-{item.faltando}</b></div>}
                          {item?.excedente>0&&<div style={{color:"#15803d"}}>Excedente: <b>+{item.excedente}</b></div>}
                        </div>
                      )
                    }}/>
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                    <Bar dataKey="atual" name="Atual" fill={COR} radius={[0,3,3,0]} animationDuration={800}/>
                    <Bar dataKey="ideal" name="Ideal" fill={COR_BORDA} radius={[0,3,3,0]} animationDuration={1000}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Unidades defasadas + Pizza */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>🚨 Unidades com Defasagem ({todasDefasadas.length})</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Ordenadas por maior déficit — role para ver todas</div>
                <div style={{overflowY:"auto",maxHeight:alturaVisivel,borderRadius:8,border:`1px solid ${COR_CLARA}`}}>
                  <ResponsiveContainer width="100%" height={alturaDefasadas}>
                    <BarChart data={todasDefasadas.map(e=>({nome:e.nome.length>28?e.nome.slice(0,28)+"…":e.nome,faltando:e.faltando}))} layout="vertical" barCategoryGap="15%" margin={{top:8,right:16,left:8,bottom:8}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}}/>
                      <YAxis dataKey="nome" type="category" tick={{fontSize:9,fill:"#334155"}} width={190}/>
                      <Tooltip formatter={(v)=>[`-${v} vagas`,"defasagem"]}/>
                      <Bar dataKey="faltando" name="Vagas faltando" fill="#ef4444" radius={[0,5,5,0]} animationDuration={800}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`,display:"flex",flexDirection:"column"}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Unidades Escolares por Tipo</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>Distribuição da rede municipal</div>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pizzaTipo} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                        {pizzaTipo.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                      </Pie>
                      <Tooltip formatter={(v,name)=>[v,name]}/>
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabela detalhada */}
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:COR}}>Quadro Detalhado por Unidade Escolar</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>Passe o mouse em 🔴 ou 🟢 para ver os cargos</div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <input placeholder="🔍 Buscar unidade escolar..." value={busca} onChange={e=>setBusca(e.target.value)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${COR_BORDA}`,fontSize:12,outline:"none",width:200}}/>
                  {tipos.map(t=>{
                    const ativo=filtroTipos.has(t)
                    return(
                      <button key={t} onClick={()=>toggleTipo(t)} style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:600,transition:"all 0.2s",border:t==="Todos"?`2px solid ${ativo?COR:COR_BORDA}`:`2px solid ${ativo?(COR_TIPO[t]||COR):COR_BORDA}`,background:ativo?(t==="Todos"?COR:(COR_TIPO[t]||COR)):"#fff",color:ativo?"#fff":(t==="Todos"?COR:(COR_TIPO[t]||COR))}}>
                        {t!=="Todos"&&ativo&&<span style={{marginRight:4}}>✓</span>}{t}
                      </button>
                    )
                  })}
                  <select value={filtroTGS} onChange={e=>setFiltroTGS(e.target.value)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${COR_BORDA}`,fontSize:11,background:"#fff",color:COR,cursor:"pointer"}}>
                    {tgsList.map(t=><option key={t} value={t}>{t==="Todos"?"Todas as TGS":`TGS ${t}`}</option>)}
                  </select>
                </div>
              </div>
              {!filtroTipos.has("Todos")&&(
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#94a3b8"}}>Filtrando por:</span>
                  {[...filtroTipos].map(t=>(
                    <span key={t} style={{background:(COR_TIPO[t]||COR)+"22",color:COR_TIPO[t]||COR,border:`1px solid ${COR_TIPO[t]||COR}`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>toggleTipo(t)}>{t} <span style={{fontSize:10}}>✕</span></span>
                  ))}
                  <button onClick={()=>setFiltroTipos(new Set(["Todos"]))} style={{fontSize:11,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Limpar</button>
                </div>
              )}
              <div style={{fontSize:11,color:"#64748b",marginBottom:12}}>Exibindo <b>{escolasFiltradas.length}</b> de {escolas.length} unidades</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>
                      {["TGS","TIPO","UNIDADE ESCOLAR","ALUNOS","PORTE","ATUAL","IDEAL","FALTANDO","EXCEDENTE"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"8px 10px",fontSize:9,color:"#94a3b8",fontWeight:700,letterSpacing:0.8,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {escolasFiltradas.map((e,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`,background:i%2===0?"#fff":"#f8fbff"}}>
                        <td style={{padding:"9px 10px",textAlign:"center"}}><span style={{background:COR,color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>TGS {e.tgs}</span></td>
                        <td style={{padding:"9px 10px"}}><span style={{background:(COR_TIPO[e.tipo]||"#94a3b8")+"22",color:COR_TIPO[e.tipo]||"#94a3b8",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{e.tipo}</span></td>
                        <td style={{padding:"9px 10px",fontSize:12,color:"#334155",fontWeight:500,maxWidth:220}}>{e.nome}</td>
                        <td style={{padding:"9px 10px",fontSize:12,color:"#475569",textAlign:"center"}}>{e.alunos}</td>
                        <td style={{padding:"9px 10px",fontSize:11,color:"#64748b"}}>{e.porte}</td>
                        <td style={{padding:"9px 10px",fontSize:13,fontWeight:700,color:COR,textAlign:"center"}}>{e.totalAtual}</td>
                        <td style={{padding:"9px 10px",fontSize:13,fontWeight:700,color:"#475569",textAlign:"center"}}>{e.totalIdeal}</td>
                        <td style={{padding:"9px 10px",textAlign:"center"}}><CelulaComTooltip escola={e} tipo="faltando" valor={e.faltando}/></td>
                        <td style={{padding:"9px 10px",textAlign:"center"}}><CelulaComTooltip escola={e} tipo="excedente" valor={e.excedente}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════ ABA: POR TGS ════════════════ */}
        {abaAtiva==="tgs"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Vagas Faltando por TGS</div>
                <div style={{fontSize:11,color:COR,marginBottom:12,fontStyle:"italic"}}>💡 Clique em uma barra para ver as unidades da TGS</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dadosTGS} barCategoryGap="25%" onClick={d=>{if(d?.activePayload?.[0]){const t=d.activeLabel?.replace("TGS ","");setTgsSelecionada(prev=>prev===t?null:t)}}} style={{cursor:"pointer"}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                    <XAxis dataKey="tgs" tick={{fontSize:11,fill:"#334155",fontWeight:600}}/>
                    <YAxis tick={{fontSize:10,fill:"#64748b"}}/>
                    <Tooltip content={<TooltipCustom/>}/>
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                    <Bar dataKey="faltando" name="Faltando" radius={[4,4,0,0]} animationDuration={800}>
                      {dadosTGS.map((d,i)=><Cell key={i} fill={tgsSelecionada===d.tgsNum?"#b91c1c":"#ef4444"} opacity={tgsSelecionada&&tgsSelecionada!==d.tgsNum?0.4:1}/>)}
                    </Bar>
                    <Bar dataKey="excedente" name="Excedente" radius={[4,4,0,0]} animationDuration={1000}>
                      {dadosTGS.map((d,i)=><Cell key={i} fill={tgsSelecionada===d.tgsNum?"#15803d":"#22c55e"} opacity={tgsSelecionada&&tgsSelecionada!==d.tgsNum?0.4:1}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Funcionários Ativos por TGS</div>
                <div style={{fontSize:11,color:COR,marginBottom:12,fontStyle:"italic"}}>💡 Clique em uma barra para ver as unidades da TGS</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dadosTGS} barCategoryGap="30%" onClick={d=>{if(d?.activePayload?.[0]){const t=d.activeLabel?.replace("TGS ","");setTgsSelecionada(prev=>prev===t?null:t)}}} style={{cursor:"pointer"}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                    <XAxis dataKey="tgs" tick={{fontSize:11,fill:"#334155",fontWeight:600}}/>
                    <YAxis tick={{fontSize:10,fill:"#64748b"}}/>
                    <Tooltip formatter={(v)=>[v.toLocaleString("pt-BR"),"funcionários"]}/>
                    <Bar dataKey="atual" name="Funcionários ativos" radius={[4,4,0,0]} animationDuration={800}>
                      {dadosTGS.map((d,i)=><Cell key={i} fill={tgsSelecionada===d.tgsNum?COR:COR_TGS[i%COR_TGS.length]} opacity={tgsSelecionada&&tgsSelecionada!==d.tgsNum?0.3:1}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
              {dadosTGS.map((tgs,i)=>{
                const sel=tgsSelecionada===tgs.tgsNum
                return(
                  <div key={tgs.tgs} onClick={()=>setTgsSelecionada(prev=>prev===tgs.tgsNum?null:tgs.tgsNum)}
                    style={{background:sel?COR:"#fff",borderRadius:14,padding:20,boxShadow:sel?`0 4px 20px ${COR}55`:`0 2px 12px ${COR}11`,borderTop:`4px solid ${COR_TGS[i]}`,cursor:"pointer",transition:"all 0.2s",transform:sel?"scale(1.02)":"scale(1)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontWeight:800,fontSize:16,color:sel?"#fff":COR_TGS[i]}}>{tgs.tgs}</div>
                      <span style={{fontSize:11,color:sel?"#cbd5e1":"#64748b"}}>{tgs.escolas} unidades</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:sel?"#fff":COR_TGS[i]}}>{tgs.atual}</div><div style={{fontSize:9,color:sel?"#cbd5e1":"#94a3b8"}}>Ativos</div></div>
                      <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:sel?"#fca5a5":"#ef4444"}}>-{tgs.faltando}</div><div style={{fontSize:9,color:sel?"#cbd5e1":"#94a3b8"}}>Faltando</div></div>
                      <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:sel?"#bbf7d0":"#22c55e"}}>+{tgs.excedente}</div><div style={{fontSize:9,color:sel?"#cbd5e1":"#94a3b8"}}>Excedente</div></div>
                    </div>
                    {sel&&<div style={{marginTop:10,fontSize:11,color:"#93c5fd",textAlign:"center"}}>▼ Ver unidades abaixo</div>}
                  </div>
                )
              })}
            </div>
            {tgsSelecionada&&(
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 4px 24px ${COR}22`,border:`2px solid ${COR}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:15,color:COR}}>📍 Unidades Escolares — TGS {tgsSelecionada}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{escolasDaTGS.length} unidades · ordenadas por maior defasagem</div>
                  </div>
                  <button onClick={()=>setTgsSelecionada(null)} style={{padding:"6px 16px",borderRadius:20,border:`1px solid ${COR_BORDA}`,background:"#fff",color:COR,fontSize:12,fontWeight:600,cursor:"pointer"}}>✕ Fechar</button>
                </div>
                {(()=>{
                  const info=dadosTGS.find(d=>d.tgsNum===tgsSelecionada)
                  return info?(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                      {[{label:"Unidades",valor:info.escolas,icon:"🏫",cor:COR},{label:"Funcionários Ativos",valor:info.atual,icon:"👥",cor:COR},{label:"Vagas Faltando",valor:info.faltando,icon:"⚠️",cor:"#ef4444"},{label:"Vagas Excedentes",valor:info.excedente,icon:"✅",cor:"#22c55e"}].map(k=>(
                        <div key={k.label} style={{background:COR_CLARA,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:22}}>{k.icon}</span>
                          <div><div style={{fontSize:20,fontWeight:800,color:k.cor}}>{k.valor}</div><div style={{fontSize:10,color:"#64748b"}}>{k.label}</div></div>
                        </div>
                      ))}
                    </div>
                  ):null
                })()}
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                    <thead><tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>{["TIPO","UNIDADE ESCOLAR","ALUNOS","PORTE","ATUAL","IDEAL","FALTANDO","EXCEDENTE"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 10px",fontSize:9,color:"#94a3b8",fontWeight:700,letterSpacing:0.8,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {escolasDaTGS.map((e,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`,background:i%2===0?"#fff":"#f8fbff"}}>
                          <td style={{padding:"9px 10px"}}><span style={{background:(COR_TIPO[e.tipo]||"#94a3b8")+"22",color:COR_TIPO[e.tipo]||"#94a3b8",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{e.tipo}</span></td>
                          <td style={{padding:"9px 10px",fontSize:12,color:"#334155",fontWeight:500}}>{e.nome}</td>
                          <td style={{padding:"9px 10px",fontSize:12,color:"#475569",textAlign:"center"}}>{e.alunos}</td>
                          <td style={{padding:"9px 10px",fontSize:11,color:"#64748b"}}>{e.porte}</td>
                          <td style={{padding:"9px 10px",fontSize:13,fontWeight:700,color:COR,textAlign:"center"}}>{e.totalAtual}</td>
                          <td style={{padding:"9px 10px",fontSize:13,fontWeight:700,color:"#475569",textAlign:"center"}}>{e.totalIdeal}</td>
                          <td style={{padding:"9px 10px",textAlign:"center"}}><CelulaComTooltip escola={e} tipo="faltando" valor={e.faltando}/></td>
                          <td style={{padding:"9px 10px",textAlign:"center"}}><CelulaComTooltip escola={e} tipo="excedente" valor={e.excedente}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════ ABA: DISTRIBUIÇÃO ════════════════ */}
        {abaAtiva==="distribuicao"&&(
          <>
            <div style={{background:"#f0f9ff",border:"1.5px solid #7dd3fc",borderRadius:12,padding:"12px 20px",marginBottom:24,fontSize:12,color:"#0369a1"}}>
              📋 Dados da aba <b>CONSOLIDADO</b> · <b>{TOTAL_CONSOLIDADO.toLocaleString("pt-BR")} servidores</b> em 21 funções · verificado em 10/04/2026
            </div>

            {/* Servidores por função + Cenários — lado a lado */}
            <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:20,marginBottom:24}}>

              {/* Gráfico de servidores por função — mais estreito */}
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Servidores por Função</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Total de profissionais ativos (fonte: CONSOLIDADO)</div>
                <div style={{overflowY:"auto",maxHeight:460,borderRadius:8,border:`1px solid ${COR_CLARA}`}}>
                  <ResponsiveContainer width="100%" height={CONSOLIDADO_FIXO.length*34+40}>
                    <BarChart data={[...CONSOLIDADO_FIXO].sort((a,b)=>b.total-a.total)} layout="vertical" barCategoryGap="18%" margin={{top:8,right:50,left:8,bottom:8}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:9,fill:"#64748b"}}/>
                      <YAxis dataKey="funcao" type="category" tick={{fontSize:9,fill:"#334155"}} width={165}/>
                      <Tooltip formatter={(v,name,props)=>[`${v.toLocaleString("pt-BR")} servidores em ${props.payload.unidades} unidades`,""]}/>
                      <Bar dataKey="total" name="Servidores" radius={[0,5,5,0]} animationDuration={800}>
                        {[...CONSOLIDADO_FIXO].sort((a,b)=>b.total-a.total).map((_,i)=><Cell key={i} fill={COR_TGS[i%COR_TGS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cenários de Contratação — gráfico de colunas empilhadas */}
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>🎯 Cenários de Contratação</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Atual · Mínimo necessário · Ideal por unidade</div>
                {(()=>{
                  const cargos=NAO_UNITARIOS.filter(c=>c.contratUnit!==null)
                  const dadosGrafico=cargos.map(c=>({
                    cargo:c.cargo,
                    "Quadro Atual":c.atual,
                    "A Contratar (Mín.)":Math.abs(c.contratNec),
                    "A Contratar (Ideal)":c.contratUnit,
                  }))
                  const CORES_STACK=["#64748b","#f97316","#22c55e"]
                  const KEYS=["Quadro Atual","A Contratar (Mín.)","A Contratar (Ideal)"]
                  return(
                    <>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={dadosGrafico} barCategoryGap="35%" margin={{top:8,right:16,left:8,bottom:8}}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                          <XAxis dataKey="cargo" tick={{fontSize:11,fill:"#334155",fontWeight:600}}/>
                          <YAxis tick={{fontSize:10,fill:"#64748b"}}/>
                          <Tooltip
                            content={({active,payload,label})=>{
                              if(!active||!payload?.length)return null
                              const c=cargos.find(x=>x.cargo===label)
                              const minimo=c?c.atual+Math.abs(c.contratNec):0
                              const ideal=c?c.atual+c.contratUnit:0
                              return(
                                <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"12px 16px",fontSize:11,boxShadow:"0 4px 12px #1a3a8f22"}}>
                                  <div style={{fontWeight:700,color:COR,marginBottom:8}}>{label}</div>
                                  {payload.map((p,i)=>(
                                    <div key={i} style={{display:"flex",justifyContent:"space-between",gap:16,padding:"2px 0",color:p.fill}}>
                                      <span>● {p.name}</span><b>{p.value}</b>
                                    </div>
                                  ))}
                                  <div style={{borderTop:`1px solid ${COR_CLARA}`,marginTop:6,paddingTop:6,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                                    {[["#64748b","Atual",c?.atual],["#f97316","Mín.",minimo],["#22c55e","Ideal",ideal]].map(([cor,lbl,val])=>(
                                      <div key={lbl}><div style={{fontSize:16,fontWeight:800,color:cor}}>{val}</div><div style={{fontSize:9,color:"#94a3b8"}}>{lbl}</div></div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }}
                          />
                          <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                          {KEYS.map((k,i)=>(
                            <Bar key={k} dataKey={k} stackId="a" fill={CORES_STACK[i]}
                              radius={i===KEYS.length-1?[4,4,0,0]:[0,0,0,0]}
                              animationDuration={800+i*200}/>
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{display:"flex",gap:12,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
                        {cargos.map(c=>{
                          const ideal=c.atual+c.contratUnit
                          const corG=COR_GERENCIA[c.gerencia]||COR
                          return(
                            <div key={c.cargo} style={{background:COR_CLARA,borderRadius:10,padding:"8px 14px",textAlign:"center",minWidth:100}}>
                              <div style={{fontSize:10,color:"#64748b",fontWeight:600,marginBottom:4}}>{c.cargo}</div>
                              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                                <div style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:"#64748b"}}>{c.atual}</div><div style={{fontSize:8,color:"#94a3b8"}}>atual</div></div>
                                <div style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:"#f97316"}}>{c.atual+Math.abs(c.contratNec)}</div><div style={{fontSize:8,color:"#94a3b8"}}>mín.</div></div>
                                <div style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:"#22c55e"}}>{ideal}</div><div style={{fontSize:8,color:"#94a3b8"}}>ideal</div></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Quadro por unidade escolar — tabela compacta com tooltip de funções */}
            <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",boxShadow:`0 2px 12px ${COR}11`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:COR}}>Quadro por Unidade Escolar</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>Passe o mouse no nome da escola para ver o detalhamento</div>
                </div>
                <input placeholder="🔍 Buscar escola ou tipo..." value={buscaDist} onChange={e=>setBuscaDist(e.target.value)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${COR_BORDA}`,fontSize:11,outline:"none",width:200}}/>
              </div>
              <div style={{fontSize:10,color:"#64748b",marginBottom:8}}>
                Exibindo <b>{escolasDistFiltradas.length}</b> de {CONSOLIDADO_POR_ESCOLA.length} unidades
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>
                      <th style={{textAlign:"left",padding:"6px 10px",fontSize:9,color:"#94a3b8",fontWeight:700,letterSpacing:0.8,width:60}}>TIPO</th>
                      <th style={{textAlign:"left",padding:"6px 10px",fontSize:9,color:"#94a3b8",fontWeight:700,letterSpacing:0.8}}>UNIDADE ESCOLAR</th>
                      <th style={{textAlign:"center",padding:"6px 10px",fontSize:9,color:"#94a3b8",fontWeight:700,letterSpacing:0.8,width:80}}>SERVIDORES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escolasDistFiltradas.map((e,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`,background:i%2===0?"#fff":"#f8fbff"}}>
                        <td style={{padding:"6px 10px"}}>
                          <span style={{background:(COR_TIPO[e.tipo]||"#94a3b8")+"22",color:COR_TIPO[e.tipo]||"#94a3b8",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700}}>{e.tipo}</span>
                        </td>
                        <td style={{padding:"6px 10px",position:"relative"}}>
                          <span
                            onMouseEnter={()=>setEscolaHover(e)}
                            onMouseLeave={()=>setEscolaHover(null)}
                            style={{fontSize:12,color:"#334155",fontWeight:500,cursor:"help",borderBottom:`1px dashed ${COR_BORDA}`}}
                          >
                            {e.nome}
                          </span>
                          {escolaHover===e&&<TooltipFuncoesEscola escola={e}/>}
                        </td>
                        <td style={{padding:"6px 10px",textAlign:"center"}}>
                          <span style={{background:COR_CLARA,color:COR,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{e.total}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════ ABA: OUTROS SETORES ════════════════ */}
        {abaAtiva==="outros"&&(
          <>
            <div style={{background:"#fff7ed",border:"1.5px solid #fdba74",borderRadius:12,padding:"14px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:22}}>ℹ️</span>
              <div style={{fontSize:13,color:"#92400e"}}>Os dados abaixo são <b>exemplos fictícios</b> para T.I, Coord. Predial e Suporte Técnico, enquanto aguardamos as planilhas reais desses setores.</div>
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
              <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:4}}>Atividades Recentes — Outros Setores</div>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>T.I, Coordenação Predial e Suporte Técnico</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>{["DATA","SETOR","DESCRIÇÃO","STATUS"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:1}}>{h}</th>)}</tr></thead>
                <tbody>
                  {timelineFicticia.map((item,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`}}>
                      <td style={{padding:"12px",fontSize:12,color:"#475569"}}>{item.data}</td>
                      <td style={{padding:"12px"}}><span style={{background:COR_CLARA,color:COR,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:600}}>{item.setor}</span></td>
                      <td style={{padding:"12px",fontSize:13,color:"#334155"}}>{item.descricao}</td>
                      <td style={{padding:"12px"}}><span style={{background:statusStyle[item.status]?.bg,color:statusStyle[item.status]?.cor,borderRadius:20,padding:"3px 14px",fontSize:11,fontWeight:600}}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* RODAPÉ */}
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`,marginTop:24,borderLeft:"4px solid #94a3b8"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#475569",marginBottom:12}}>📖 Como ler este painel</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,fontSize:12,color:"#64748b",lineHeight:1.7}}>
            <div><div style={{fontWeight:600,color:"#334155",marginBottom:4}}>🔴 Faltando (vermelho)</div>Unidades com <b>menos funcionários do que o ideal</b>. Passe o mouse no número para ver quais cargos estão faltando.</div>
            <div><div style={{fontWeight:600,color:"#334155",marginBottom:4}}>🟢 Excedente (verde)</div>Unidades com <b>mais funcionários do que o ideal</b>. Pode indicar que o ideal não foi atualizado ou houve remanejamento.</div>
            <div><div style={{fontWeight:600,color:"#334155",marginBottom:4}}>👥 Funcionários Ativos ({TOTAL_CONSOLIDADO.toLocaleString("pt-BR")})</div>Contagem direta da aba <b>CONSOLIDADO</b> — cada linha = um servidor. 21 funções. Fonte única, sem dupla contagem entre abas.</div>
            <div><div style={{fontWeight:600,color:"#334155",marginBottom:4}}>🗺️ O que é TGS?</div>TGS (Território de Gestão Setorial) é a divisão geográfica da cidade em 9 zonas escolares. Clique nos gráficos ou cards para ver as unidades de cada zona.</div>
          </div>
        </div>

      </main>
    </div>
  )
}
