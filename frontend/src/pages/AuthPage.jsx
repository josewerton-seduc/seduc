import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const fotosGaleria = [
  "/im1.jpeg",
  "/im2.jpeg",
  "/im3.jpeg"
]

const letras = ["S", "E", "D", "U", "C"]

function AuthPage() {
  const [erro, setErro] = useState("")
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [letrasVisiveis, setLetrasVisiveis] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFotoAtiva(atual => (atual + 1) % fotosGaleria.length)
    }, 7000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    letras.forEach((_, i) => {
      setTimeout(() => {
        setLetrasVisiveis(prev => [...prev, i])
      }, i * 200)
    })
  }, [])

  const handleGoogle = () => {
    const emailSimulado = prompt("Digite seu email institucional:")
    if (!emailSimulado) return
    if (!emailSimulado.endsWith("@caruaru.g12.br")) {
      setErro("Acesso restrito a emails institucionais (@caruaru.g12.br)")
      return
    }
    setErro("")
    navigate("/dashboard")
  }

  return (
    <div style={styles.page}>
      <div style={styles.galeriaFundo}>
        {fotosGaleria.map((foto, i) => (
          <img
            key={i}
            src={foto}
            alt=""
            style={{
              ...styles.galeriaFoto,
              opacity: i === fotoAtiva ? 1 : 0,
              transition: "opacity 1s ease-in-out"
            }}
          />
        ))}
        <div style={styles.galeriaOverlay} />
        <div style={styles.galeriaDots}>
          {fotosGaleria.map((_, i) => (
            <button
              key={i}
              onClick={() => setFotoAtiva(i)}
              style={{
                ...styles.dot,
                background: i === fotoAtiva ? "#fff" : "rgba(255,255,255,0.4)"
              }}
            />
          ))}
        </div>
      </div>

      <div style={styles.paginaFlutuante}>
        <div style={styles.chevron}>
          <svg viewBox="0 0 200 600" style={styles.chevronSvg} preserveAspectRatio="none">
            <polygon points="0,0 160,0 200,300 160,600 0,600" fill="#2d6a2d" />
            <polygon points="20,0 130,0 170,300 130,600 20,600" fill="#3a8a3a" opacity="0.5" />
          </svg>
          <div style={styles.chevronDots}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={styles.chevronDot} />
            ))}
          </div>
        </div>

        {/*
          ╔══════════════════════════════════════════════════════╗
          ║  CONTEUDO — controla a divisão horizontal da página  ║
          ║                                                      ║
          ║  gridTemplateColumns: "1fr 340px"                    ║
          ║    · "1fr"  → coluna do SEDUC (espaço restante)     ║
          ║    · "340px"→ coluna do LOGIN (largura fixa)         ║
          ║    · Aumente "340px" → login vai mais pra esquerda   ║
          ║    · Diminua "340px" → login vai mais pra direita    ║
          ║                                                      ║
          ║  padding: "topo direita baixo esquerda"              ║
          ║    · Aumente o 4º valor (esquerda) → SEDUC vai       ║
          ║      mais pra direita                                ║
          ║    · Diminua o 4º valor → SEDUC vai mais pra         ║
          ║      esquerda                                        ║
          ║                                                      ║
          ║  gap: espaço entre o SEDUC e o card de login         ║
          ╚══════════════════════════════════════════════════════╝
        */}
        <div style={styles.conteudo}>

          {/*
            ╔══════════════════════════════════════════════════╗
            ║  BLOCO SEDUC                                     ║
            ║                                                  ║
            ║  Para mover o SEDUC horizontalmente:             ║
            ║    · Use paddingLeft aqui para empurrar          ║
            ║      mais pra direita dentro da coluna           ║
            ║    · Ou ajuste o padding-left do "conteudo"      ║
            ║      acima (4º valor do padding)                 ║
            ║                                                  ║
            ║  Para mover verticalmente:                       ║
            ║    · Mude alignItems no "conteudo":              ║
            ║      "center" = centralizado                     ║
            ║      "flex-start" = topo                         ║
            ║      "flex-end" = baixo                          ║
            ╚══════════════════════════════════════════════════╝
          */}
          <div style={styles.centro}>
            <p style={styles.subtitulo}>SISTEMA DE GESTÃO INTEGRADO<br />SECRETARIA DE EDUCAÇÃO E ESPORTES</p>

            <div style={styles.seducImagemContainer}>         {/* ← container novo */}
              <img
                src="/seduc_bg.jpg"
                alt=""
                style={styles.seducImagem}
              />
              <div style={styles.seducRow}>                   {/* ← seducRow agora fica DENTRO */}
                {letras.map((letra, i) => (
                  <span
                    key={i}
                    style={{
                      ...styles.letra,
                      opacity: letrasVisiveis.includes(i) ? 1 : 0,
                      transform: letrasVisiveis.includes(i)
                        ? "translateY(0px)"
                        : "translateY(-60px)",
                      transition: "opacity 0.4s ease, transform 0.4s ease"
                    }}
                  >
                    {letra}
                  </span>
                ))}
              </div>
            </div>                                            {/* ← fecha container novo */}
          </div>

          {/*
            ╔══════════════════════════════════════════════════╗
            ║  CARD DE LOGIN                                   ║
            ║                                                  ║
            ║  Para mover o card horizontalmente:              ║
            ║    · Aumente/diminua "340px" no                  ║
            ║      gridTemplateColumns do "conteudo"           ║
            ║    · Ou use marginLeft aqui para ajuste fino     ║
            ║      ex: marginLeft: "auto" = cola na direita    ║
            ║          marginLeft: "0"    = cola na esquerda   ║
            ║                                                  ║
            ║  Para mover verticalmente:                       ║
            ║    · Use marginTop: "Xrem" para baixar           ║
            ║    · Use marginBottom: "Xrem" para subir         ║
            ╚══════════════════════════════════════════════════╝
          */}
          <div style={styles.loginCard}>
            <div style={styles.loginHeader}>
              <div style={styles.loginIcone}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6a2d" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.loginTitulo}>Acesso ao Sistema</h2>
                <p style={styles.loginSub}>Conta institucional obrigatória</p>
              </div>
            </div>

            <div style={styles.loginDivider} />

            <p style={styles.loginInstrucao}>
              Entre com seu email <strong>@caruaru.g12.br</strong> para acessar.
            </p>

            <button
              style={styles.btnGoogle}
              onClick={handleGoogle}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f8f8"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>

            {erro && (
              <div style={styles.erroBox}>
                <p style={styles.erroTexto}>⚠ {erro}</p>
              </div>
            )}

            <p style={styles.rodape}>
              Problemas de acesso? Contate o administrador do sistema.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "stretch",
    background: "#1a3a1a",
    overflow: "hidden",
    position: "relative"
  },
  seducImagemContainer: {
    position: "absolute",
    display: "inline-block",
    // ↓ sobe/desce a imagem independentemente
    top: "150px",     // ← ajuste aqui
    left: "-30px",
  },
  seducImagem: {
    // ↓ largura da imagem — ajuste até alinhar com as letras
    width: "122%",
    // ↓ altura da faixa de imagem atrás das letras
    height: "162px",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
    borderRadius: "8px",
    marginTop: "-7rem",
  },
  galeriaFundo: {
    position: "fixed",
    top: 0,
    left: 0,
    // ↓ largura da galeria visível à esquerda da página flutuante
    width: "20vw",
    height: "100vh",
    zIndex: 0,
    overflow: "hidden"
  },
  galeriaFoto: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  galeriaOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(30, 70, 30, 0.55)"
  },
  galeriaDots: {
    position: "absolute",
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    zIndex: 2
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    padding: 0,
    transition: "background 0.2s"
  },

  paginaFlutuante: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    // ↓ POSIÇÃO HORIZONTAL DA PÁGINA FLUTUANTE
    // Deve ser MENOR que o width da galeriaFundo para galeria aparecer atrás
    // Aumente → galeria aparece mais → página vai mais pra direita
    // Diminua → galeria aparece menos → página vai mais pra esquerda
    marginLeft: "18vw",
    marginRight: 0,
    background: "#ffffff",
    // ↓ sombra que cria efeito de profundidade (página flutuando sobre galeria)
    boxShadow: "-20px 0 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.3)",
    display: "flex",
    minHeight: "100vh",
    overflow: "hidden"
  },

  chevron: {
    position: "relative",
    // ↓ largura do bloco verde chevron
    width: "160px",
    flexShrink: 0
  },
  chevronSvg: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0
  },
  chevronDots: {
    position: "absolute",
    // ↓ posição vertical dos pontinhos decorativos
    top: "60px",
    // ↓ posição horizontal dos pontinhos decorativos
    left: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 10px)",
    gap: "10px",
    zIndex: 1
  },
  chevronDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.4)"
  },

  conteudo: {
    flex: 1,
    display: "grid",
    // ↓ DIVISÃO HORIZONTAL ENTRE SEDUC E LOGIN
    // "1fr"  = coluna do SEDUC ocupa o espaço restante
    // "340px"= coluna do LOGIN tem largura fixa
    // Aumente 340px → login vai mais pra esquerda (ocupa mais espaço)
    // Diminua 340px → login vai mais pra direita (ocupa menos espaço)
    gridTemplateColumns: "1fr 340px",
    alignItems: "center",
    // ↓ padding: topo | direita | baixo | esquerda
    // 4º valor (esquerda): empurra o SEDUC pra direita se aumentar
    padding: "3rem 2rem 3rem 4rem",
    paddingRight: "7rem",
    // ↓ espaço entre o bloco SEDUC e o card de login
    gap: "2rem"
  },

  centro: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingLeft: "0rem",
    position: "relative",
    // ↓ altura fixa necessária para os elementos absolute funcionarem
    height: "300px",
    // ↓ move o bloco inteiro verticalmente na página
    marginTop: "5rem",
  },

  subtitulo: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2d6a2d",
    letterSpacing: "2.5px",
    position: "absolute",
    // ↓ sobe/desce o texto "SECRETARIA DE..."
    top: "0px",      // ← ajuste aqui
    left: "-1.5rem",
  },
  seducRow: {
    display: "flex",
    gap: "10px",
    position: "absolute",   // ← sai do fluxo normal
    top: "-108px",            // ← distância do topo da imagem, diminua para subir
    left: "13px",              // ← distância da esquerda
  },
  letra: {
    fontSize: "9vw",
    fontWeight: "900",
    fontFamily: "Arial, serif",
    color: "#ffffff",
    lineHeight: 1,
    display: "inline-block"
  },

  loginCard: {
    // ↓ largura do card de login
    width: "320px",
    background: "#fff",
    border: "1px solid #ffffff",
    borderRadius: "16px",
    padding: "1.8rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    // ↓ POSIÇÃO FINA DO CARD DE LOGIN dentro da coluna
    // marginLeft: "auto"  → cola na direita da coluna
    // marginLeft: "0"     → cola na esquerda da coluna
    // marginLeft: "Xrem"  → ajuste fino de posição horizontal
    marginLeft: "0",
    // ↓ para mover verticalmente use marginTop / marginBottom
    // ex: marginTop: "2rem" desce o card
  },
  loginHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  loginIcone: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f0f7f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  loginTitulo: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f1923",
    margin: 0
  },
  loginSub: {
    fontSize: "12px",
    color: "#888",
    margin: 0
  },
  loginDivider: {
    height: "1px",
    background: "#f0f0f0"
  },
  loginInstrucao: {
    fontSize: "13px",
    color: "#555",
    lineHeight: "1.6"
  },
  btnGoogle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    background: "#fff",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#333",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    transition: "background 0.15s"
  },
  erroBox: {
    background: "#fff5f5",
    border: "1px solid #fed7d7",
    borderRadius: "8px",
    padding: "12px"
  },
  erroTexto: {
    color: "#c53030",
    fontSize: "13px"
  },
  rodape: {
    fontSize: "11px",
    color: "#bbb",
    textAlign: "center"
  }
}

export default AuthPage