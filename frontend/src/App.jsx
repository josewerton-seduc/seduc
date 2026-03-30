import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import RedeFisicaPage from "./pages/RedeFisicaPage"
import GGTerceirizadasPage from "./pages/GGTerceirizadasPage"
import GGJuridicaPage from "./pages/GGJuridicaPage"
import GGAlimentacaoPage from "./pages/GGAlimentacaoPage"
import GGOrganizacaoEscolarPage from "./pages/GGOrganizacaoEscolarPage"
import GGCARFPage from "./pages/GGCARFPage"
import GGCentroDistribuicaoPage from "./pages/GGCentroDistribuicaoPage"
import GGFinanceiraPage from "./pages/GGFinanceiraPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rede-fisica" element={<RedeFisicaPage />} />
        <Route path="/gg-terceirizadas" element={<GGTerceirizadasPage />} />
        <Route path="/gg-juridica" element={<GGJuridicaPage />} />
        <Route path="/gg-alimentacao" element={<GGAlimentacaoPage />} />
        <Route path="/gg-organizacao-escolar" element={<GGOrganizacaoEscolarPage />} />
        <Route path="/ggcarf" element={<GGCARFPage />} />
        <Route path="/gg-centro-distribuicao" element={<GGCentroDistribuicaoPage />} />
        <Route path="/gg-financeira" element={<GGFinanceiraPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
