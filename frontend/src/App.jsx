import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import RedeFisicaPage from "./pages/RedeFisicaPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rede-fisica" element={<RedeFisicaPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App