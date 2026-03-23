import { useNavigate, useLocation } from "react-router-dom"

function Header({ titulo, sub, extra }) {
  const navigate = useNavigate()
  const location = useLocation()

  const navItens = [
    {
      path: "/dashboard",
      titulo: "Início",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    }
    // ← novos ícones de navegação entram aqui futuramente
    // exemplo:
    // { path: "/relatorios", titulo: "Relatórios", icone: <svg>...</svg> }
  ]

  return (
    <div style={styles.header}>

      {/* ESQUERDA — informações da página atual */}
      <div style={styles.esquerda}>
        <div style={styles.chevron} />
        <div>
          <h1 style={styles.titulo}>{titulo}</h1>
          {sub && <p style={styles.sub}>{sub}</p>}
        </div>
      </div>

      {/* CENTRO — ícones de navegação */}
      <div style={styles.centro}>
        {navItens.map(item => {
          const ativo = location.pathname === item.path
          return (
            <button
              key={item.path}
              title={item.titulo}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navBtn,
                background: ativo ? "#f0f7f0" : "transparent",
                color: ativo ? "#2d6a2d" : "#888",
                border: ativo ? "1px solid #c8e0c8" : "1px solid transparent"
              }}
              onMouseEnter={e => {
                if (!ativo) {
                  e.currentTarget.style.background = "#f7f7f7"
                  e.currentTarget.style.color = "#2d6a2d"
                }
              }}
              onMouseLeave={e => {
                if (!ativo) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#888"
                }
              }}
            >
              {item.icone}
              <span style={styles.navLabel}>{item.titulo}</span>
            </button>
          )
        })}
      </div>

      {/* DIREITA — extra (ex: data) + logout */}
      <div style={styles.direita}>
        {extra && <span style={styles.extra}>{extra}</span>}
        <button
          style={styles.btnSair}
          onClick={() => navigate("/")}
          onMouseEnter={e => e.currentTarget.style.background = "#f0f7f0"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d6a2d" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>

    </div>
  )
}

const styles = {
  header: {
    background: "#fff",
    borderBottom: "1px solid #e0ece0",
    padding: "0 2.5rem",
    height: "64px",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",  // ← esquerda | centro | direita
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    position: "fixed",   // ← congela no topo
    top: 0,              // ← distância do topo
    left: 0,             // ← da borda esquerda
    right: 0,            // ← até a borda direita
    zIndex: 100          // ← fica acima de tudo
  },

  // ESQUERDA
  esquerda: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  chevron: {
    width: "6px",
    height: "36px",
    background: "#2d6a2d",
    borderRadius: "3px",
    flexShrink: 0
  },
  titulo: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a2e1a",
    margin: 0,
    fontFamily: "Georgia, serif",
    letterSpacing: "1px"
  },
  sub: {
    fontSize: "11px",
    color: "#888",
    margin: 0
  },

  // CENTRO
  centro: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px"
  },
  navBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
    minWidth: "56px"
  },
  navLabel: {
    fontSize: "10px",
    fontWeight: "500",
    lineHeight: 1
  },

  // DIREITA
  direita: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px"
  },
  extra: {
    fontSize: "13px",
    color: "#888",
    fontWeight: "500"
  },
  btnSair: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #c8e0c8",
    background: "transparent",
    color: "#2d6a2d",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.15s"
  }
}

export default Header