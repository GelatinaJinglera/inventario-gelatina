import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, getSession } from './services/supabaseClient';
import { initializeGoogleDrive } from './services/googleDriveService';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryBrowserPage from './pages/InventoryBrowserPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import MovementsPage from './pages/MovementsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import WithdrawalDetailPage from './pages/WithdrawalDetailPage';
import CreateWithdrawalPage from './pages/CreateWithdrawalPage';
import MaintenancePage from './pages/MaintenancePage';
import MaintenanceDetailPage from './pages/MaintenanceDetailPage';
import AdminPage from './pages/AdminPage';
import EquiposPage from './pages/EquiposPage';
import UsuariosPage from './pages/UsuariosPage';
import CategoriasPage from './pages/CategoriasPage';
import UbicacionesPage from './pages/UbicacionesPage';
import EstadísticasPage from './pages/EstadísticasPage';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Inicializar Google Drive en background (no bloquea)
      initializeGoogleDrive().catch(() => {
        // Silenciar errores - Google Drive es opcional en startup
      });

      const session = await getSession();
      setIsAuthenticated(!!session);

      if (session?.user?.email) {
        // Verificar si es admin
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('email', session.user.email)
          .single();

        setIsAdmin(usuario?.rol === 'ADMIN');
      }

      // Escuchar cambios de autenticación
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
        setIsAuthenticated(!!session);
        if (session?.user?.email) {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('email', session.user.email)
            .single();
          setIsAdmin(usuario?.rol === 'ADMIN');
        } else {
          setIsAdmin(false);
        }
      });

      return () => subscription?.unsubscribe();
    };

    checkAuth();
  }, []);

  // Esperando a que se resuelva la autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
          <p className="text-gray-600">Inicializando aplicación</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de login (pública) */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        {/* Rutas protegidas */}
        {isAuthenticated ? (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventario" element={<InventoryBrowserPage />} />
            <Route path="/equipos/:id" element={<EquipmentDetailPage />} />
            <Route path="/movimientos" element={<MovementsPage />} />
            <Route path="/retiros" element={<WithdrawalsPage />} />
            <Route path="/retiros/nuevo" element={<CreateWithdrawalPage />} />
            <Route path="/retiros/:id" element={<WithdrawalDetailPage />} />
            <Route path="/mantenimiento" element={<MaintenancePage />} />
            <Route path="/mantenimiento/:id" element={<MaintenanceDetailPage />} />
            {/* Rutas admin */}
            {isAdmin && (
              <>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/equipos" element={<EquiposPage />} />
                <Route path="/admin/usuarios" element={<UsuariosPage />} />
                <Route path="/admin/categorias" element={<CategoriasPage />} />
                <Route path="/admin/ubicaciones" element={<UbicacionesPage />} />
                <Route path="/admin/estadisticas" element={<EstadísticasPage />} />
              </>
            )}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
