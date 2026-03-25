import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import RedeFisicaPage from "./pages/RedeFisicaPage"
import GGTerceirizadasPage from "./pages/GGTerceirizadasPage"
import GGJuridicaPage from "./pages/GGJuridicaPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rede-fisica" element={<RedeFisicaPage />} />
        <Route path="/gg-terceirizadas" element={<GGTerceirizadasPage />} />
        <Route path="/gg-juridica" element={<GGJuridicaPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
