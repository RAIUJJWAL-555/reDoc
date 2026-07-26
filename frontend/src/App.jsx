import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import UserSelector from "./components/UserSelector";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/Editor";
import Landing from "./pages/Landing";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <>
      {/* Top bar with user selector — visible only on app pages */}
      <header className="app-header">
        <a href="/dashboard" className="app-logo">
          <span className="app-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <circle cx="12" cy="5" r="2" fill="currentColor" />
              <circle cx="12" cy="19" r="2" fill="currentColor" />
              <circle cx="5" cy="12" r="2" fill="currentColor" />
              <circle cx="19" cy="12" r="2" fill="currentColor" />
            </svg>
          </span>
          reDoc
        </a>
        <UserSelector />
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/document/:id" element={<EditorPage />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
