import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import UserSelector from "./components/UserSelector";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/Editor";
import "./App.css";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        {/* Top bar with user selector — always visible */}
        <header className="app-header">
          <a href="/" className="app-logo">
            reDoc
          </a>
          <UserSelector />
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/document/:id" element={<EditorPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
