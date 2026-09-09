import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, signOut, getCurrentUser } from '../services/supabaseClient';
import { Menu, LogOut, Home, Package, Send, History, Wrench, Settings, X } from 'lucide-react';
import { AuthUser } from '../types';

export default function Layout() {
  const navigate = useNavigate();
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
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
      {/* Sidebar - Desktop Only */}
      <div
        className={`hidden md:flex ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">Gelatina</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded"
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
            />
          ))}
        </nav>

        {/* Admin */}
        {isAdmin && (
          <>
            <div className="border-t border-gray-700 p-4">
              <NavLink
                to="/admin"
                icon={<Settings size={20} />}
                label="Admin"
                sidebarOpen={sidebarOpen}
              />
            </div>
          </>
        )}

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {sidebarOpen && (
            <div className="text-xs text-gray-400 truncate">
              {user?.email}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Salir</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-white shadow h-16 flex items-center justify-between px-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Inventario Gelatina</h2>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg w-48 border border-gray-200 md:hidden z-50">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition border-b"
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
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition"
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
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <MobileNavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
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
}

function NavLink({ to, icon, label, sidebarOpen }: NavLinkProps) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 p-3 rounded transition ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800'
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
}

function MobileNavLink({ to, icon, label }: MobileNavLinkProps) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800'
      }`}
      title={label}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}
