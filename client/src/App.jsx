import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/home";
import Lobby from "./pages/lobby";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/lobby/:code" element={<Lobby />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;