import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Header } from './components/Header';
import Home from './pages/Home';
import GameDetails from './pages/GameDetails';
import About from './pages/About';
import Legal from './pages/Legal';
import Privacy from './pages/Privacy';
import AdminDashboard from './pages/AdminDashboard';
import DiscordCallback from './pages/DiscordCallback';

function App() {
  const spaRedirect = new URLSearchParams(window.location.search).get('spa-redirect');
  if (spaRedirect) {
    window.history.replaceState(null, '', spaRedirect);
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('ares_theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('ares_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Router>
      <div className={`min-h-screen bg-brand-dark text-white selection:bg-brand-azure selection:text-white ${isDark ? 'theme-dark' : 'theme-light'}`}>
        <Header onSearch={setSearchQuery} isDark={isDark} onToggleTheme={() => setIsDark(value => !value)} />
        <main className="min-h-[80vh]">
          <Routes>
            <Route path="/" element={<Home searchQuery={searchQuery} />} />
            <Route path="/game/:id" element={<GameDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/discord-callback" element={<DiscordCallback />} />
          </Routes>
        </main>
        
        <footer className="border-t border-brand-border py-16 bg-brand-dark">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.dualite.app/122a7ac9-a3d4-45b9-922b-59a2e01416f6/asset-99cd15ba-c40b-47cc-a2b5-6f6a4576c289.webp" 
                  alt="ARES" 
                  className="w-8 h-8 opacity-50"
                />
                <span className="font-black text-gray-600 tracking-tighter">ARES ARCHIVE</span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <Link to="/legal" className="hover:text-brand-azure transition-colors">Legal</Link>
                <Link to="/privacy" className="hover:text-brand-azure transition-colors">Privacy</Link>
                <Link to="/about" className="hover:text-brand-azure transition-colors">About</Link>
              </div>

              <p className="text-gray-700 text-[10px] font-bold uppercase tracking-widest">
                EST. 2025 • DIGITAL PRESERVATION
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;