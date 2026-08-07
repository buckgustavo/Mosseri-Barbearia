import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Instagram from "./pages/Instagram";
import Agendar from "./pages/Agendar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/instagram" element={<Instagram />} />
        <Route path="/agendar" element={<Agendar />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
