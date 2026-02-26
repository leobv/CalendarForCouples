import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ShoppingCart, LogOut } from 'lucide-react';
import CalendarView from './pages/CalendarView';
import ShoppingListView from './pages/ShoppingListView';
import LoginView from './pages/LoginView';
import axios from 'axios';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


const BottomNav = () => {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pwa-safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 w-full py-2 transition-colors ${isActive('/') ? 'text-primary-600' : 'text-zinc-400'}`}
        >
          <CalendarIcon className="w-6 h-6" strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Calendario</span>
        </Link>
        <Link
          to="/list"
          className={`flex flex-col items-center gap-1 w-full py-2 transition-colors ${isActive('/list') ? 'text-primary-600' : 'text-zinc-400'}`}
        >
          <ShoppingCart className="w-6 h-6" strokeWidth={isActive('/list') ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Compras</span>
        </Link>
      </div>
    </nav>
  );
};

const Header = ({ theme, toggleTheme }) => {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-40 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="flex justify-between items-center h-14 px-4 max-w-md mx-auto">
        <h1 className="font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">Casa</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            )}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen pb-20 bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-primary-200 selection:text-primary-900 transition-colors duration-200">
        <Header theme={theme} toggleTheme={toggleTheme} />
        <main className="max-w-md mx-auto">
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <CalendarView />
                </PrivateRoute>
              }
            />
            <Route
              path="/list"
              element={
                <PrivateRoute>
                  <ShoppingListView />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
