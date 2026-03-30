import { useState } from "react"
import Header from "../components/Header"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts"

const COR = "#b5174f"
const COR_CLARA = "#fff0f5"
const COR_BORDA = "#f0a0bc"

const kpis = [
  { label: "Itens em Estoque",      valor: "4.2k", icon: "📦", variacao: "atualizado hoje"     },
  { label: "Entregas este mês",     valor: 187,    icon: "🚚", variacao: "+14% vs mês anterior" },
  { label: "Escolas Atendidas",     valor: 98,     icon: "🏫", variacao: "de 142 unidades"      },
  { label: "Pedidos Pendentes",     valor: 23,     icon: "⏳", variacao: "aguardando separação"  },
]

const distribuicaoPorTipo = [
  { name: "CMEI",  value: 48, fill: "#b5174f" },
  { name: "EM",    value: 71, fill: "#e05080" },
  { name: "ETI",   value: 23, fill: "#f0a0bc" },
  { name: "SEDUC", value: 12, fill: "#ffd0e0" },
]

const categoriasMaterial = [
  { categoria: "Fardamento",  recebido: 320, entregue: 298 },
  { categoria: "Mobiliário",  recebido: 145, entregue: 112 },
  { categoria: "Água/Higiene",recebido: 890, entregue: 876 },
  { categoria: "Papelaria",   recebido: 560, entregue: 534 },
  { categoria: "Informática", recebido: 78,  entregue: 61  },
  { categoria: "Limpeza",     recebido: 430, entregue: 418 },
]

const evolucaoEntregas = [
  { mes: "Jan", cmei: 38, em: 52, eti: 18, seduc: 8 },
  { mes: "Fev", cmei: 41, em: 58, eti: 20, seduc: 9 },
  { mes: "Mar", cmei: 44, em: 63, eti: 22, seduc: 11 },
  { mes: "Abr", cmei: 39, em: 55, eti: 19, seduc: 8 },
  { mes: "Mai", cmei: 46, em: 67, eti: 24, seduc: 12 },
  { mes: "Jun", cmei: 48, em: 71, eti: 23, seduc: 12 },
]

const statusEstoque = [
  { categoria: "Fardamento",   total: 320, disponivel: 22,  reservado: 45,  status: "Alerta"   },
  { categoria: "Mobiliário",   total: 145, disponivel: 33,  reservado: 18,  status: "Regular"  },
  { categoria: "Água/Higiene", total: 890, disponivel: 14,  reservado: 120, status: "Crítico"  },
  { categoria: "Papelaria",    total: 560, disponivel: 26,  reservado: 80,  status: "Regular"  },
  { categoria: "Informática",  total: 78,  disponivel: 17,  reservado: 12,  status: "OK"       },
  { categoria: "Limpeza",      total: 430, disponivel: 12,  reservado: 95,  status: "Alerta"   },
  { categoria: "Uniformes",    total: 210, disponivel: 48,  reservado: 30,  status: "OK"       },
  { categoria: "Esporte",      total: 95,  disponivel: 31,  reservado: 15,  status: "OK"       },
]

const ultimasEntregas = [
  { data: "24/03", destino: "CMEI Jardim das Flores", categoria: "Fardamento",   qtd: 45,  status: "Entregue"   },
  { data: "23/03", destino: "EM Barão de Mauá",       categoria: "Papelaria",    qtd: 120, status: "Entregue"   },
  { data: "23/03", destino: "ETI Rui Barbosa",        categoria: "Mobiliário",   qtd: 8,   status: "Em rota"    },
  { data: "22/03", destino: "SEDUC — Sede",           categoria: "Informática",  qtd: 12,  status: "Entregue"   },
  { data: "22/03", destino: "EM João XXIII",          categoria: "Água/Higiene", qtd: 200, status: "Entregue"   },
  { data: "21/03", destino: "CMEI Sol Nascente",      categoria: "Limpeza",      qtd: 60,  status: "Em rota"    },
  { data: "21/03", destino: "ETI Dom Helder",         categoria: "Fardamento",   qtd: 38,  status: "Pendente"   },
  { data: "20/03", destino: "EM Santos Dumont",       categoria: "Papelaria",    qtd: 95,  status: "Entregue"   },
]

const statusEntregaStyle = {
  "Entregue": { bg: "#dcfce7", cor: "#15803d" },
  "Em rota":  { bg: "#dbeafe", cor: "#1d4ed8" },
  "Pendente": { bg: "#fef9c3", cor: "#a16207" },
  "Cancelado":{ bg: "#fee2e2", cor: "#b91c1c" },
}

const statusEstoqueStyle = {
  "OK":      { bg: "#dcfce7", cor: "#15803d" },
  "Regular": { bg: "#dbeafe", cor: "#1d4ed8" },
  "Alerta":  { bg: "#fef9c3", cor: "#a16207" },
  "Crítico": { bg: "#fee2e2", cor: "#b91c1c" },
}

const categoriaStyle = {
  "Fardamento":   { bg: "#fff0f5", cor: "#b5174f" },
  "Mobiliário":   { bg: "#f0f9ff", cor: "#0369a1" },
  "Água/Higiene": { bg: "#f0fdf4", cor: "#15803d" },
  "Papelaria":    { bg: "#fef9c3", cor: "#a16207" },
  "Informática":  { bg: "#fdf4ff", cor: "#7e22ce" },
  "Limpeza":      { bg: "#fff7ed", cor: "#c2410c" },
  "Uniformes":    { bg: "#fff0f5", cor: "#b5174f" },
  "Esporte":      { bg: "#f0fdf4", cor: "#15803d" },
}

const filtrosCategoria = ["Todas", "Fardamento", "Mobiliário", "Água/Higiene", "Papelaria", "Informática", "Limpeza"]

const TooltipCustom = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${COR_BORDA}`, borderRadius: 10, padding: "10px 16px", fontSize: 12, boxShadow: "0 4px 12px #b5174f22" }}>
        <div style={{ fontWeight: 700, color: COR, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>● {p.name}: <b>{p.value}</b></div>
        ))}
      </div>
    )
  }
  return null
}

export default function GGCentroDistribuicaoPage() {
  const [filtroCategoria, setFiltroCategoria] = useState("Todas")

  const entregasFiltradas = filtroCategoria === "Todas"
    ? ultimasEntregas
    : ultimasEntregas.filter(e => e.categoria === filtroCategoria)

  const criticos = statusEstoque.filter(e => e.status === "Crítico" || e.status === "Alerta")

  return (
    <div style={{ minHeight: "100vh", background: "#fff5f8", fontFamily: "'Segoe UI', sans-serif", color: "#2d001a" }}>

      <Header
        titulo="GG Centro de Distribuição"
        sub="Painel de controle de estoque e entregas"
        extra="Março 2026"
        cor={COR}
      />

      <main style={{ padding: "92px 32px 52px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              boxShadow: `0 2px 12px ${COR}18`, borderLeft: `4px solid ${COR}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: COR }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{k.variacao}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ALERTA ESTOQUE */}
        {criticos.length > 0 && (
          <div style={{
            background: "#fff0f5", border: "1.5px solid #f0a0bc", borderRadius: 12,
            padding: "14px 20px", marginBottom: 24,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: COR, fontSize: 13, marginBottom: 4 }}>
                {criticos.length} categoria(s) com estoque baixo!
              </div>
              <div style={{ fontSize: 12, color: "#b5174f" }}>
                {criticos.map(e => `${e.categoria} (${e.status})`).join(" • ")}
              </div>
            </div>
          </div>
        )}

        {/* GRÁFICOS LINHA + PIZZA */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Linha — evolução entregas */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Evolução de Entregas</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Entregas mensais por tipo de destinatário</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoEntregas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip content={<TooltipCustom />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cmei"  name="CMEI"  stroke="#b5174f" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={600}  />
                <Line type="monotone" dataKey="em"    name="EM"    stroke="#e05080" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={800}  />
                <Line type="monotone" dataKey="eti"   name="ETI"   stroke="#f0a0bc" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1000} />
                <Line type="monotone" dataKey="seduc" name="SEDUC" stroke="#94a3b8" strokeWidth={2}   dot={{ r: 3 }} animationDuration={1200} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pizza — distribuição por tipo */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Destinatários</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Distribuição de entregas por tipo</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={distribuicaoPorTipo}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                  animationBegin={0} animationDuration={800}
                  label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {distribuicaoPorTipo.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "escolas"]} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras — materiais recebidos vs entregues */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 2 }}>Materiais: Recebidos vs. Entregues</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Comparativo por categoria neste mês</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoriasMaterial} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
              <XAxis dataKey="categoria" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip content={<TooltipCustom />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="recebido" name="Recebido" fill="#e05080" radius={[6,6,0,0]} animationDuration={600}  />
              <Bar dataKey="entregue" name="Entregue" fill={COR}     radius={[6,6,0,0]} animationDuration={800}  />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TABELA ESTOQUE */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11`, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COR, marginBottom: 4 }}>Situação do Estoque</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Disponibilidade atual por categoria</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                {["CATEGORIA", "TOTAL RECEBIDO", "DISPONÍVEL", "RESERVADO", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statusEstoque.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: categoriaStyle[e.categoria]?.bg, color: categoriaStyle[e.categoria]?.cor, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{e.categoria}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155", fontWeight: 600 }}>{e.total}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: COR_CLARA, borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${e.disponivel}%`, height: "100%", borderRadius: 6, background: e.disponivel < 20 ? "#ef4444" : e.disponivel < 35 ? "#f97316" : COR }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", minWidth: 30 }}>{e.disponivel}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>{e.reservado} un.</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: statusEstoqueStyle[e.status]?.bg, color: statusEstoqueStyle[e.status]?.cor, borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600 }}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABELA ENTREGAS */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: `0 2px 12px ${COR}11` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COR }}>Últimas Entregas</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Movimentações recentes de distribuição</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filtrosCategoria.map(f => (
                <button key={f} onClick={() => setFiltroCategoria(f)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: filtroCategoria === f ? COR : COR_CLARA,
                  color: filtroCategoria === f ? "#fff" : COR,
                  transition: "all 0.2s",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COR_CLARA}` }}>
                {["DATA", "DESTINO", "CATEGORIA", "QTD", "STATUS"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COR_CLARA}` }}>
                  <td style={{ padding: "12px", fontSize: 12, color: "#475569" }}>{e.data}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#334155", fontWeight: 500 }}>{e.destino}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: categoriaStyle[e.categoria]?.bg, color: categoriaStyle[e.categoria]?.cor, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{e.categoria}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: COR }}>{e.qtd}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: statusEntregaStyle[e.status]?.bg, color: statusEntregaStyle[e.status]?.cor, borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 600 }}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}
