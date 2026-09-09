import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, signOut, getCurrentUser } from '../services/supabaseClient';
import { Menu, LogOut, Home, Package, Send, History, Wrench, Settings, X, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { AuthUser } from '../types';

export default function Layout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser as AuthUser | null);

      if (currentUser?.email) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('email', currentUser.email)
          .single();

        setIsAdmin(usuario?.rol === 'ADMIN');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/mantenimiento', icon: <Wrench size={20} />, label: 'Mantenimiento' },
    { to: '/movimientos', icon: <History size={20} />, label: 'Movimientos' },
    { to: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
    { to: '/inventario', icon: <Package size={20} />, label: 'Inventario' },
    { to: '/retiros', icon: <Send size={20} />, label: 'Retiros' },
  ];

  const desktopNavItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Inicio' },
    { to: '/inventario', icon: <Package size={20} />, label: 'Inventario' },
    { to: '/movimientos', icon: <History size={20} />, label: 'Movimientos' },
    { to: '/retiros', icon: <Send size={20} />, label: 'Retiros' },
    { to: '/mantenimiento', icon: <Wrench size={20} />, label: 'Mantenimiento' },
  ];

  return (
    <div className={`flex flex-col h-screen ${
      theme === 'dark' 
        ? 'bg-neutral-950' 
        : 'bg-neutral-100'
    } md:flex-row transition-colors duration-300`}>
      {/* Sidebar - Desktop Only */}
      <div
        className={`hidden md:flex ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${theme === 'dark' ? 'bg-neutral-900 text-white border-neutral-800' : 'bg-neutral-800 text-white border-neutral-700'} transition-all duration-300 flex-col border-r`}
      >
        {/* Logo */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-700'}`}>
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">Gelatina</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded transition ${
                theme === 'dark'
                  ? 'hover:bg-neutral-800'
                  : 'hover:bg-neutral-700'
              }`}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              sidebarOpen={sidebarOpen}
              theme={theme}
            />
          ))}
        </nav>

        {/* Admin */}
        {isAdmin && (
          <>
            <div className={`border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-700'} p-4`}>
              <NavLink
                to="/admin"
                icon={<Settings size={20} />}
                label="Admin"
                sidebarOpen={sidebarOpen}
                theme={theme}
              />
            </div>
          </>
        )}

        {/* User Info & Logout */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-700'} space-y-2`}>
          {sidebarOpen && (
            <div className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'} truncate`}>
              {user?.email}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 bg-danger-500 hover:bg-danger-600 text-white rounded transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Salir</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <header className={`${
          theme === 'dark'
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        } shadow h-16 flex items-center justify-between px-6 border-b transition-colors duration-300`}>
          <h2 className="text-2xl font-bold">Inventario Gelatina</h2>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition ${
                theme === 'dark'
                  ? 'bg-neutral-800 text-yellow-400 hover:bg-neutral-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition ${
                theme === 'dark'
                  ? 'hover:bg-neutral-800'
                  : 'hover:bg-neutral-100'
              }`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className={`absolute top-16 right-0 rounded-lg w-48 border ${
              theme === 'dark'
                ? 'bg-neutral-900 border-neutral-800 shadow-2xl'
                : 'bg-white border-neutral-200 shadow-lg'
            } md:hidden z-50`}>
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition border-b ${
                      theme === 'dark'
                        ? 'text-neutral-300 hover:bg-neutral-800 border-neutral-800'
                        : 'text-neutral-700 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <Settings size={20} />
                    Admin
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  theme === 'dark'
                    ? 'text-danger-400 hover:bg-danger-950'
                    : 'text-danger-600 hover:bg-danger-50'
                }`}
              >
                <LogOut size={20} />
                Salir
              </button>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className={`fixed bottom-0 left-0 right-0 md:hidden border-t ${
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-neutral-800 border-neutral-700'
      } transition-colors duration-300`}>
        <div className="flex justify-around">
          {navItems.map((item) => (
            <MobileNavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              theme={theme}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  sidebarOpen: boolean;
  theme: string;
}

function NavLink({ to, icon, label, sidebarOpen, theme }: NavLinkProps) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 p-3 rounded transition ${
        isActive
          ? 'bg-primary-500 text-white'
          : theme === 'dark'
          ? 'text-neutral-400 hover:bg-neutral-800'
          : 'text-neutral-300 hover:bg-neutral-700'
      }`}
    >
      {icon}
      {sidebarOpen && <span>{label}</span>}
    </button>
  );
}

interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  theme: string;
}

function MobileNavLink({ to, icon, label, theme }: MobileNavLinkProps) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
        isActive
          ? 'bg-primary-500 text-white'
          : theme === 'dark'
          ? 'text-neutral-400 hover:bg-neutral-800'
          : 'text-neutral-300 hover:bg-neutral-700'
      }`}
      title={label}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}
