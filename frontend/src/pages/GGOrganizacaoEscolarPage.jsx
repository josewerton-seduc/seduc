import { useState, useEffect, useCallback } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

const COR = "#2d6a4f"
const COR_CLARA = "#f0f7f2"
const COR_BORDA = "#a8d5b5"

const URL_ESPERA       = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTroGKeTYOAQDHfCNDEzVKzECaSpwD5Jq1TqLGq1nh4GaQFEHD0ZPfDuoGqyg3NLYbLOOdJzLkI7CLE/pub?gid=0&single=true&output=csv"
const URL_MATRICULADOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSMzkaw9qDWkvXcsUXs_5E0rXH0n0TiDVN5AeJ_LYSET6cOiv3QxQFK5chqGOeciMEPtJu8ekgJyXX/pub?gid=0&single=true&output=csv"

// Fonte: gerente de organização escolar
const NOVOS_CMEIS_2026 = ["Rendeiras","Sítio Cipó","São João da Escócia","Rafael","Alvorada do Ipojuca"]

function parseCSV(csv) {
  const records = []
  let current = [], field = "", inQ = false
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i], nx = csv[i+1]
    if (ch==='"'){if(inQ&&nx==='"'){field+='"';i++}else inQ=!inQ}
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

function normNome(s){
  return s.toUpperCase()
    .replace(/CENTRO MUNICIPAL DE EDUCA[ÇC][AÃ]O INFANTIL /g,"")
    .replace(/CMEI /g,"").trim()
}

function faixaRenda(r){
  try{
    const v=parseFloat(r.replace("R$","").replace(/\./g,"").replace(",",".").trim())
    if(v===0)return"Sem renda"
    if(v<=750)return"Até R$750"
    if(v<=1500)return"R$750–R$1.500"
    if(v<=3000)return"R$1.500–R$3.000"
    return"Acima R$3.000"
  }catch{return null}
}

function processarDados(csvEspera, csvMatric) {
  const espera = parseCSV(csvEspera).slice(1)
  const matric  = parseCSV(csvMatric).slice(1)

  const totalEspera   = espera.length
  const totalMatric   = matric.length
  const comBF         = espera.filter(r=>r[46]?.toUpperCase()==="SIM").length
  const pcdTotal      = espera.filter(r=>r[15]?.toUpperCase()==="SIM").length
  const usaTransporte = matric.filter(r=>r[5]?.toLowerCase().includes("público")).length
  const gemeos        = espera.filter(r=>r[9]?.toUpperCase()==="SIM").length
  const irmaoCreche   = espera.filter(r=>r[25]?.toUpperCase()==="SIM").length

  // Distribuição de pontuação
  const distPts = {}
  espera.forEach(r=>{const p=r[28]?.trim();if(p&&!isNaN(p))distPts[p]=(distPts[p]||0)+1})
  const pontData = Object.entries(distPts).map(([pts,total])=>({pts:`${pts} pts`,total})).sort((a,b)=>parseInt(a.pts)-parseInt(b.pts))

  // Faixa etária
  const porTurma={}
  espera.forEach(r=>{const t=r[23]?.trim();if(t)porTurma[t]=(porTurma[t]||0)+1})
  const turmasData=Object.entries(porTurma).map(([turma,total])=>({turma,total})).sort((a,b)=>b.total-a.total)

  // Renda
  const rendaOrdem=["Sem renda","Até R$750","R$750–R$1.500","R$1.500–R$3.000","Acima R$3.000"]
  const porRenda={}
  espera.forEach(r=>{const f=faixaRenda(r[45]||"");if(f)porRenda[f]=(porRenda[f]||0)+1})
  const rendaData=rendaOrdem.filter(k=>porRenda[k]).map(k=>({faixa:k,total:porRenda[k]}))

  // Bairros
  const bE={}, bM={}
  espera.forEach(r=>{const b=r[14]?.trim().toUpperCase();if(b&&b!=="...")bE[b]=(bE[b]||0)+1})
  matric.forEach(r=>{const b=r[8]?.trim().toUpperCase();if(b)bM[b]=(bM[b]||0)+1})

  const topBairrosEspera=Object.entries(bE)
    .map(([bairro,total])=>({bairro:bairro.slice(0,22),bairroFull:bairro,total}))
    .sort((a,b)=>b.total-a.total).slice(0,12)

  // Pressão por bairro — separando bairros SEM matriculados dos que TÊM
  const pressaoBairros=Object.entries(bE)
    .filter(([b])=>b!=="...")
    .map(([b,e])=>{
      const m=bM[b]||0
      const pressao=m===0?(e>0?100:0):Math.round(e/(m+e)*100)
      return{bairro:b.slice(0,20),bairroFull:b,espera:e,matriculados:m,pressao}
    })
    .filter(b=>b.espera>=10)
    .sort((a,b)=>b.pressao-a.pressao)
    .slice(0,14)

  // Bairros sem nenhum matriculado (100% pressão, dados da espera)
  // ATENÇÃO: isso significa que nenhuma criança dessa fila mora nesse bairro E está matriculada
  // Não confirma ausência de CMEI no bairro
  const bairrosSemMatriculados=pressaoBairros.filter(b=>b.matriculados===0)

  // CMEIs
  const cmeiDados={}
  espera.forEach(r=>{
    const cmei=r[24]?.trim()
    if(!cmei)return
    if(!cmeiDados[cmei])cmeiDados[cmei]={total:0,bf:0,pcd:0,inf1:0,inf2:0,inf3:0}
    cmeiDados[cmei].total++
    if(r[46]?.toUpperCase()==="SIM")cmeiDados[cmei].bf++
    if(r[15]?.toUpperCase()==="SIM")cmeiDados[cmei].pcd++
    const t=r[23]?.trim()
    if(t?.includes("1"))cmeiDados[cmei].inf1++
    else if(t?.includes("2"))cmeiDados[cmei].inf2++
    else if(t?.includes("3"))cmeiDados[cmei].inf3++
  })

  const escMatric={}
  matric.forEach(r=>{const n=normNome(r[2]?.trim()||"");escMatric[n]=(escMatric[n]||0)+1})

  const topCmeiPrioridade=Object.entries(cmeiDados)
    .map(([cmei,d])=>{
      const nomeSimples=cmei.replace(/CMEI |CEI /g,"")
      const cap=escMatric[normNome(cmei)]||0
      const pctBF=Math.round(d.bf/d.total*100)
      return{cmei:nomeSimples.slice(0,35),total:d.total,bf:d.bf,pcd:d.pcd,
             inf1:d.inf1,inf2:d.inf2,inf3:d.inf3,capacidade:cap,pctBF}
    })
    .sort((a,b)=>b.total-a.total).slice(0,12)

  const porModalidade={}
  matric.forEach(r=>{
    const m=r[4]?.trim()||""
    const k=m.includes("0 A 3")?"Creche 0-3 anos":m.includes("PRÉ")||m.includes("PRE")?"Pré-escola":"Educação Infantil"
    porModalidade[k]=(porModalidade[k]||0)+1
  })

  const topEscolas=Object.entries(escMatric)
    .map(([escola,total])=>({escola:escola.slice(0,28),total}))
    .sort((a,b)=>b.total-a.total).slice(0,10)

  return{
    totalEspera,totalMatric,comBF,pcdTotal,usaTransporte,gemeos,irmaoCreche,
    turmasData,rendaData,topBairrosEspera,pressaoBairros,bairrosSemMatriculados,
    topCmeiPrioridade,topEscolas,porModalidade,pontData,espera,bE,bM,
  }
}

const COR_RENDA=["#b91c1c","#f97316","#eab308","#22c55e","#0369a1"]
const COR_PRESSAO=(p)=>p>=80?"#b91c1c":p>=50?"#f97316":p>=25?"#eab308":"#22c55e"

const TooltipCustom=({active,payload,label})=>{
  if(!active||!payload?.length)return null
  return(
    <div style={{background:"#fff",border:`1px solid ${COR_BORDA}`,borderRadius:10,padding:"10px 16px",fontSize:12,boxShadow:"0 4px 12px #2d6a4f22"}}>
      <div style={{fontWeight:700,color:COR,marginBottom:6}}>{label}</div>
      {payload.map(p=><div key={p.name} style={{color:p.color}}>● {p.name}: <b>{typeof p.value==="number"?p.value.toLocaleString("pt-BR"):p.value}</b></div>)}
    </div>
  )
}

function Termometro({pressao,label,espera,matriculados}){
  const cor=COR_PRESSAO(pressao)
  const nivel=pressao>=80?"CRÍTICO":pressao>=50?"ALTO":pressao>=25?"MÉDIO":"OK"
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"default"}}>
      <div style={{fontSize:9,color:"#64748b",textAlign:"center",maxWidth:75,lineHeight:1.3}}>{label}</div>
      <div style={{width:14,height:64,background:"#e5e7eb",borderRadius:7,overflow:"hidden",position:"relative",border:`1px solid ${cor}44`}}>
        <div style={{position:"absolute",bottom:0,width:"100%",height:`${pressao}%`,background:cor,borderRadius:7,transition:"height 0.8s ease"}}/>
      </div>
      <div style={{fontSize:11,fontWeight:800,color:cor}}>{pressao}%</div>
      <div style={{fontSize:8,color:cor,fontWeight:600}}>{nivel}</div>
      {matriculados===0&&<div style={{fontSize:8,color:"#94a3b8",textAlign:"center",maxWidth:75}}>sem matric.</div>}
    </div>
  )
}

export default function GGOrganizacaoPage(){
  const [dados,setDados]=useState(null)
  const [carregando,setCarregando]=useState(true)
  const [abaAtiva,setAbaAtiva]=useState("espera")
  const [filtroAtivo,setFiltroAtivo]=useState(null)

  useEffect(()=>{
    Promise.all([
      fetch(URL_ESPERA).then(r=>r.text()),
      fetch(URL_MATRICULADOS).then(r=>r.text()),
    ]).then(([csvE,csvM])=>{setDados(processarDados(csvE,csvM));setCarregando(false)})
      .catch(()=>setCarregando(false))
  },[])

  const handleFiltro=useCallback((tipo,valor)=>{
    setFiltroAtivo(prev=>prev?.tipo===tipo&&prev?.valor===valor?null:{tipo,valor})
  },[])

  const irParaAba=(id)=>{setAbaAtiva(id);setFiltroAtivo(null);window.scrollTo({top:0,behavior:"smooth"})}

  if(carregando)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f4faf6",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:COR}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{fontSize:16,fontWeight:600}}>Carregando dados...</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:8}}>Buscando informações do Google Sheets</div>
      </div>
    </div>
  )

  if(!dados)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f4faf6"}}>
      <div style={{textAlign:"center",color:"#b91c1c"}}><div style={{fontSize:48}}>⚠️</div><div style={{fontSize:16,fontWeight:600,marginTop:12}}>Erro ao carregar dados.</div></div>
    </div>
  )

  const{totalEspera,totalMatric,comBF,pcdTotal,usaTransporte,gemeos,irmaoCreche,
    turmasData,rendaData,topBairrosEspera,pressaoBairros,bairrosSemMatriculados,
    topCmeiPrioridade,topEscolas,porModalidade,pontData,espera}=dados

  const esperaFiltrada=filtroAtivo?espera.filter(r=>{
    if(filtroAtivo.tipo==="turma")return r[23]?.trim()===filtroAtivo.valor
    if(filtroAtivo.tipo==="bairro")return r[14]?.trim().toUpperCase()===filtroAtivo.valor
    return true
  }):espera

  const topBairrosFiltrado=Object.entries(
    esperaFiltrada.reduce((acc,r)=>{const b=r[14]?.trim().toUpperCase();if(b&&b!=="...")acc[b]=(acc[b]||0)+1;return acc},{})
  ).map(([bairro,total])=>({bairro:bairro.slice(0,22),bairroFull:bairro,total}))
    .sort((a,b)=>b.total-a.total).slice(0,12)

  const turmasFiltrado=Object.entries(
    esperaFiltrada.reduce((acc,r)=>{const t=r[23]?.trim();if(t)acc[t]=(acc[t]||0)+1;return acc},{})
  ).map(([turma,total])=>({turma,total})).sort((a,b)=>b.total-a.total)

  const comBF_f=esperaFiltrada.filter(r=>r[46]?.toUpperCase()==="SIM").length
  const pcd_f  =esperaFiltrada.filter(r=>r[15]?.toUpperCase()==="SIM").length

  const pizzaModal=Object.entries(porModalidade).map(([name,value],i)=>({name,value,fill:["#2d6a4f","#1d7fc4","#7c3371"][i]}))

  const pctVulneravel=Math.round((rendaData.filter(r=>r.faixa==="Até R$750"||r.faixa==="Sem renda").reduce((s,r)=>s+r.total,0)/totalEspera)*100)

  return(
    <div style={{minHeight:"100vh",background:"#f4faf6",fontFamily:"'Segoe UI',sans-serif",color:"#1a3a2a"}}>
      <Header titulo="GG Organização Escolar" sub="Painel de gestão e estrutura da rede" extra="Março 2026" cor={COR}/>

      <main style={{padding:"92px 32px 52px"}}>

        {/* AVISO ESCOPO */}
        <div style={{background:"#fffbeb",border:"1.5px solid #fcd34d",borderRadius:10,padding:"10px 18px",marginBottom:20,fontSize:12,color:"#92400e"}}>
          ℹ️ <b>Escopo dos dados:</b> Este painel exibe exclusivamente dados de <b>CMEI/CEI</b>. Dados de Escolas Municipais (EM) e Escolas de Tempo Integral (ETI) não constam nas planilhas disponíveis até o momento.
        </div>

        {/* ABAS */}
        <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
          {[
            {id:"espera",     label:"👶 Lista de Espera"},
            {id:"prioridade", label:"🚨 Prioridade & Risco"},
            {id:"matriculados",label:"📚 Matriculados CMEI"},
            {id:"cruzamento", label:"🔀 Análise Cruzada"},
          ].map(a=>(
            <button key={a.id} onClick={()=>irParaAba(a.id)} style={{
              padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer",
              fontSize:12,fontWeight:600,
              background:abaAtiva===a.id?COR:"#fff",
              color:abaAtiva===a.id?"#fff":COR,
              boxShadow:"0 2px 8px #2d6a4f18",transition:"all 0.2s",
            }}>{a.label}</button>
          ))}
        </div>

        {/* FILTRO ATIVO */}
        {filtroAtivo&&(
          <div style={{background:"#fff",border:`2px solid ${COR}`,borderRadius:12,padding:"10px 18px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:COR,fontWeight:600}}>
              🔍 Filtrado: <b>{filtroAtivo.valor}</b> — {esperaFiltrada.length} crianças · {comBF_f} com Bolsa Família · {pcd_f} PCD
            </span>
            <button onClick={()=>setFiltroAtivo(null)} style={{background:COR,color:"#fff",border:"none",borderRadius:8,padding:"4px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕ Limpar</button>
          </div>
        )}

        {/* ══ ABA: LISTA DE ESPERA ══ */}
        {abaAtiva==="espera"&&(
          <>
            {/* KPIs — 4 cards compactos + 1 botão-link para prioridade */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr) 1fr",gap:14,marginBottom:24,alignItems:"stretch"}}>
              {[
                {label:"Na Fila de Espera", valor:totalEspera.toLocaleString("pt-BR"), icon:"👶", variacao:"aguardando vaga em CMEI", cor:COR},
                {label:"Com Bolsa Família",  valor:comBF.toLocaleString("pt-BR"),       icon:"💚", variacao:`${Math.round(comBF/totalEspera*100)}% das crianças`, cor:"#15803d"},
                {label:"PCD na Fila",        valor:pcdTotal,                            icon:"♿", variacao:"necessidades especiais",  cor:"#7c3371"},
                {label:"Irmão já na creche", valor:irmaoCreche,                         icon:"👫", variacao:"critério de prioridade",  cor:"#0369a1"},
              ].map(k=>(
                <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:`0 2px 12px ${k.cor}22`,borderLeft:`4px solid ${k.cor}`,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:24}}>{k.icon}</span>
                  <div>
                    <div style={{fontSize:24,fontWeight:800,color:k.cor}}>{k.valor}</div>
                    <div style={{fontSize:10,color:"#64748b",fontWeight:600}}>{k.label}</div>
                    <div style={{fontSize:9,color:"#94a3b8",marginTop:1}}>{k.variacao}</div>
                  </div>
                </div>
              ))}
              {/* Botão-link para aba Prioridade */}
              <button onClick={()=>irParaAba("prioridade")} style={{
                background:"linear-gradient(135deg,#b91c1c,#ef4444)",
                borderRadius:14,padding:"16px 18px",border:"none",cursor:"pointer",
                boxShadow:"0 2px 12px #b91c1c33",display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",gap:6,
              }}>
                <span style={{fontSize:24}}>🚨</span>
                <div style={{fontSize:11,fontWeight:700,color:"#fff",textAlign:"center"}}>Ver Mapa de<br/>Risco & Prioridade</div>
                <div style={{fontSize:10,color:"#fecaca"}}>bairros críticos →</div>
              </button>
            </div>

            {/* Faixa etária + Bairros */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:20,marginBottom:24}}>
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Por Faixa Etária</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>💡 Clique para filtrar todos os gráficos</div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={turmasFiltrado} barCategoryGap="30%" onClick={d=>d?.activeLabel&&handleFiltro("turma",d.activeLabel)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                    <XAxis dataKey="turma" tick={{fontSize:11,fill:"#334155"}}/>
                    <YAxis tick={{fontSize:10,fill:"#64748b"}}/>
                    <Tooltip formatter={(v)=>[v,"crianças"]}/>
                    <Bar dataKey="total" name="Crianças" radius={[6,6,0,0]} cursor="pointer" animationDuration={600}>
                      {turmasFiltrado.map(e=><Cell key={e.turma} fill={filtroAtivo?.valor===e.turma?"#0369a1":COR}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Bairros com Mais Crianças na Espera</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>💡 Clique para filtrar por bairro</div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={topBairrosFiltrado} layout="vertical" barCategoryGap="15%"
                    onClick={d=>d?.activeLabel&&handleFiltro("bairro",d.activeLabel.toUpperCase())}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}}/>
                    <YAxis dataKey="bairro" type="category" tick={{fontSize:9,fill:"#334155"}} width={130}/>
                    <Tooltip formatter={(v)=>[v,"crianças"]}/>
                    <Bar dataKey="total" name="Na espera" radius={[0,4,4,0]} cursor="pointer" animationDuration={800}>
                      {topBairrosFiltrado.map(e=><Cell key={e.bairro} fill={filtroAtivo?.valor===e.bairroFull?"#0369a1":COR}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Renda (menor) + Pontuação + Novos CMEIs */}
            <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 0.8fr",gap:20}}>

              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Renda Familiar das Famílias na Fila</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>
                  <b style={{color:"#b91c1c"}}>{pctVulneravel}%</b> têm renda até R$750 — maior grupo em vulnerabilidade
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={rendaData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                    <XAxis dataKey="faixa" tick={{fontSize:9,fill:"#64748b"}} interval={0} angle={-10} textAnchor="end" height={36}/>
                    <YAxis tick={{fontSize:9,fill:"#64748b"}}/>
                    <Tooltip formatter={(v)=>[v,"famílias"]}/>
                    <Bar dataKey="total" name="Famílias" radius={[4,4,0,0]} animationDuration={800}>
                      {rendaData.map((_,i)=><Cell key={i} fill={COR_RENDA[i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Distribuição de Pontuação</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>
                  Pontuação determina prioridade de chamada (quanto maior, maior prioridade)
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={pontData} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                    <XAxis dataKey="pts" tick={{fontSize:10,fill:"#64748b"}}/>
                    <YAxis tick={{fontSize:9,fill:"#64748b"}}/>
                    <Tooltip formatter={(v)=>[v,"crianças"]}/>
                    <Bar dataKey="total" name="Crianças" radius={[4,4,0,0]} animationDuration={800}>
                      {pontData.map((_,i)=><Cell key={i} fill={i>=pontData.length-2?"#15803d":i<=1?"#94a3b8":COR}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>🏗️ Novos CMEIs 2026</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Fonte: gerência de organização escolar</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {NOVOS_CMEIS_2026.map((nome,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:COR_CLARA,borderRadius:8,padding:"8px 12px"}}>
                      <span style={{fontSize:14}}>📍</span>
                      <span style={{fontSize:12,fontWeight:600,color:"#1a3a2a"}}>{nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ABA: PRIORIDADE & RISCO ══ */}
        {abaAtiva==="prioridade"&&(
          <>
            <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:12,padding:"14px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22}}>🚨</span>
              <div style={{fontSize:13,color:"#7f1d1d"}}>
                <b>Atenção:</b> os dados abaixo identificam as situações mais críticas — CMEIs com maior concentração de crianças vulneráveis e bairros com maior pressão por vagas. <b>O termômetro mostra o % de crianças na espera em relação ao total do bairro</b> (espera + matriculados morando lá).
              </div>
            </div>

            {/* Termômetros */}
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`,marginBottom:24}}>
              <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Pressão de Demanda por Bairro</div>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>
                Proporção de crianças na espera vs. matriculadas por bairro de residência. Bairros com 100% e "sem matric." indicam que nenhuma criança desse bairro consta na planilha de matriculados — pode haver CMEI próximo em outro bairro.
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
                {pressaoBairros.map(b=><Termometro key={b.bairro} pressao={b.pressao} label={b.bairro} espera={b.espera} matriculados={b.matriculados}/>)}
              </div>
              <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:20,flexWrap:"wrap"}}>
                {[["🔴 CRÍTICO","≥80%","#b91c1c"],["🟠 ALTO","50–79%","#f97316"],["🟡 MÉDIO","25–49%","#eab308"],["🟢 OK","<25%","#22c55e"]].map(([n,v,c])=>(
                  <span key={n} style={{fontSize:11,color:c,fontWeight:600}}>{n} {v}</span>
                ))}
              </div>
            </div>

            {/* Tabela prioridade CMEI */}
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
              <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>CMEIs: Fila, Vulnerabilidade e Faixa Etária</div>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>
                Baseado nas 1ª opções de creche das famílias na fila — CMEIs destacados em amarelo têm ≥70% de famílias do Bolsa Família ou crianças PCD
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${COR_CLARA}`}}>
                      {["CMEI (1ª opção da família)","FILA","BOLSA FAM.","PCD","INF. 1","INF. 2","INF. 3","MATRIC. ATUAL"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"8px 10px",fontSize:9,color:"#94a3b8",fontWeight:700,letterSpacing:0.8,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topCmeiPrioridade.map((d,i)=>{
                      const urgente=d.pctBF>=70||d.pcd>0
                      return(
                        <tr key={i} style={{borderBottom:`1px solid ${COR_CLARA}`,background:urgente?"#fefce8":i%2===0?"#fff":"#f8fbff"}}>
                          <td style={{padding:"10px",fontSize:11,color:"#334155",fontWeight:500}}>
                            {urgente&&<span style={{marginRight:4}}>⚠️</span>}{d.cmei}
                          </td>
                          <td style={{padding:"10px",textAlign:"center"}}>
                            <span style={{background:COR_CLARA,color:COR,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:800}}>{d.total}</span>
                          </td>
                          <td style={{padding:"10px",textAlign:"center"}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#15803d"}}>{d.bf}</div>
                            <div style={{fontSize:9,color:"#94a3b8"}}>{d.pctBF}% da fila</div>
                          </td>
                          <td style={{padding:"10px",textAlign:"center"}}>
                            {d.pcd>0?<span style={{background:"#fdf4ff",color:"#7c3371",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{d.pcd}</span>:<span style={{color:"#94a3b8"}}>—</span>}
                          </td>
                          <td style={{padding:"10px",textAlign:"center",fontSize:12,color:"#0369a1",fontWeight:600}}>{d.inf1||"—"}</td>
                          <td style={{padding:"10px",textAlign:"center",fontSize:12,color:"#1d7fc4",fontWeight:600}}>{d.inf2||"—"}</td>
                          <td style={{padding:"10px",textAlign:"center",fontSize:12,color:"#38bdf8",fontWeight:600}}>{d.inf3||"—"}</td>
                          <td style={{padding:"10px",textAlign:"center"}}>
                            {d.capacidade>0
                              ?<span style={{background:"#dcfce7",color:"#15803d",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600}}>{d.capacidade}</span>
                              :<span style={{color:"#94a3b8",fontSize:11}}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ ABA: MATRICULADOS ══ */}
        {abaAtiva==="matriculados"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
              {[
                {label:"Crianças Matriculadas",valor:totalMatric.toLocaleString("pt-BR"),icon:"📚",variacao:"em 35 CMEIs",cor:COR},
                {label:"Usa Transp. Público",  valor:usaTransporte,icon:"🚌",variacao:`${Math.round(usaTransporte/totalMatric*100)}% do total`,cor:"#0369a1"},
                {label:"Zona Rural",           valor:590,icon:"🌱",variacao:"crianças da área rural",cor:"#7c3371"},
                {label:"Zona Urbana",          valor:"5.990",icon:"🏙️",variacao:"crianças da área urbana",cor:"#c0521a"},
              ].map(k=>(
                <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:`0 2px 12px ${k.cor}22`,borderLeft:`4px solid ${k.cor}`,display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:28}}>{k.icon}</span>
                  <div>
                    <div style={{fontSize:26,fontWeight:800,color:k.cor}}>{k.valor}</div>
                    <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{k.label}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{k.variacao}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:20}}>
              <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Top CMEIs por Matrículas</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Maiores unidades em número de alunos</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topEscolas} layout="vertical" barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}}/>
                    <YAxis dataKey="escola" type="category" tick={{fontSize:9,fill:"#334155"}} width={175}/>
                    <Tooltip formatter={(v)=>[v,"matriculados"]}/>
                    <Bar dataKey="total" name="Matriculados" radius={[0,6,6,0]} animationDuration={800}>
                      {topEscolas.map((_,i)=><Cell key={i} fill={i<3?COR:COR+"99"}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
                  <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:8}}>Por Modalidade</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pizzaModal} cx="50%" cy="45%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                        {pizzaModal.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                      </Pie>
                      <Tooltip formatter={(v)=>[v.toLocaleString("pt-BR"),"alunos"]}/>
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:10}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:`0 2px 12px ${COR}11`,textAlign:"center"}}>
                  <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:8}}>Transporte Escolar</div>
                  <div style={{fontSize:36,fontWeight:900,color:"#0369a1"}}>{Math.round(usaTransporte/totalMatric*100)}%</div>
                  <div style={{fontSize:12,color:"#64748b"}}>{usaTransporte.toLocaleString("pt-BR")} crianças usam transporte público</div>
                  <div style={{background:"#e0f2fe",borderRadius:8,height:10,overflow:"hidden",marginTop:12}}>
                    <div style={{width:`${Math.round(usaTransporte/totalMatric*100)}%`,height:"100%",background:"#0369a1",borderRadius:8}}/>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ABA: CRUZAMENTO ══ */}
        {abaAtiva==="cruzamento"&&(
          <>
            <div style={{background:"#f0f9ff",border:"1.5px solid #7dd3fc",borderRadius:12,padding:"14px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22}}>💡</span>
              <div style={{fontSize:13,color:"#0369a1"}}>
                Esta aba cruza a fila de espera com os matriculados. CMEIs com <b>0 matriculados</b> podem ser unidades ainda sem turmas formadas na planilha disponível. Os dados de bairro comparam crianças <b>morando</b> no mesmo bairro — uma criança pode morar no bairro X e frequentar CMEI no bairro Y.
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`,marginBottom:24}}>
              <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>CMEIs: Fila de Espera vs. Matriculados Atuais</div>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Barra laranja maior que a verde = demanda supera capacidade atual naquele CMEI</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topCmeiPrioridade} layout="vertical" barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA} horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:10,fill:"#64748b"}}/>
                  <YAxis dataKey="cmei" type="category" tick={{fontSize:9,fill:"#334155"}} width={200}/>
                  <Tooltip content={<TooltipCustom/>}/>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="capacidade" name="Matriculados" fill={COR}     radius={[0,4,4,0]} animationDuration={600}/>
                  <Bar dataKey="total"      name="Na fila"      fill="#f97316" radius={[0,4,4,0]} animationDuration={800}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:`0 2px 12px ${COR}11`}}>
              <div style={{fontWeight:700,fontSize:14,color:COR,marginBottom:2}}>Bairros: Fila vs. Matriculados (por bairro de residência)</div>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Bairros onde há mais crianças esperando do que matriculadas — indica maior pressão local por vagas</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pressaoBairros} barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COR_CLARA}/>
                  <XAxis dataKey="bairro" tick={{fontSize:9,fill:"#64748b"}} interval={0} angle={-20} textAnchor="end" height={55}/>
                  <YAxis tick={{fontSize:10,fill:"#64748b"}}/>
                  <Tooltip content={<TooltipCustom/>}/>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="matriculados" name="Matriculados" fill={COR}     radius={[4,4,0,0]} animationDuration={600}/>
                  <Bar dataKey="espera"       name="Na fila"      fill="#f97316" radius={[4,4,0,0]} animationDuration={800}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
