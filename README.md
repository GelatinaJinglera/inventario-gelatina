# 📦 Inventario Gelatina

Sistema de control de inventario para Gelatina - Estudio de streaming y producción audiovisual.

## 🚀 Setup rápido

### 1. Clonar o descargar el proyecto

```bash
# Si lo tienes en una carpeta
cd inventario-gelatina-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

El archivo `.env.local` ya tiene tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://iezqzfputltsxyyhhflk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_FrvwwFOoDIINPyHWY59Y5g_r9EUvFwd
```

### 4. Crear las tablas en Supabase

1. Abre tu dashboard de Supabase: https://supabase.com/dashboard
2. Ve a SQL Editor
3. Crea una nueva query
4. Copia todo el contenido de `sql/init.sql`
5. Pega y ejecuta

> **Nota:** Esto crea todas las tablas necesarias + categorías, ubicaciones y datos iniciales.

### 5. Correr la app localmente

```bash
npm run dev
```

Se abrirá en `http://localhost:3000`

## 📋 Para probar

**Login:**
- Email: `prueba@gmail.com`
- Password: `123456`

(Supabase free tier permite crear usuarios sin validación)

## 📁 Estructura del proyecto

```
inventario-gelatina-app/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Header + Sidebar
│   ├── pages/
│   │   ├── LoginPage.tsx       # Autenticación
│   │   ├── DashboardPage.tsx   # KPIs iniciales
│   │   ├── InventoryBrowserPage.tsx  # Búsqueda y categorías
│   │   ├── EquipmentDetailPage.tsx   # Ficha completa
│   │   └── MovementsPage.tsx   # Historial
│   ├── services/
│   │   └── supabaseClient.ts   # Conexión DB
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript
│   ├── App.tsx                 # Router principal
│   ├── index.tsx               # Entry point
│   └── index.css               # Estilos globales
├── sql/
│   └── init.sql                # Script de creación de BD
├── .env.local                  # Variables de entorno
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎯 Funcionalidades actuales (Fase 1)

✅ **Autenticación**
- Login con email/password
- Gestión de sesiones

✅ **Dashboard**
- KPIs: Total equipos, En falla, Retiros activos, Disponibles

✅ **Inventario**
- Búsqueda por nombre/marca/modelo
- Filtrado por categoría
- Vista de fichas de equipos

✅ **Detalle de equipo**
- Información completa
- Foto desde Google Drive
- Últimos movimientos

✅ **Historial de movimientos**
- Filtrado por tipo y fecha
- Vista completa del historial

## 🔧 Próximos pasos (Fase 2+)

- [ ] Crear retiros y devoluciones
- [ ] Plantillas de retiros reutilizables
- [ ] Reportar fallas y mantenimiento
- [ ] Cambios de ubicación
- [ ] Admin panel (usuarios, categorías, ubicaciones)
- [ ] Gráficos y analytics
- [ ] Escaneo de QR/códigos de barras
- [ ] PWA (funciona como app nativa)

## 🛠️ Build para producción

```bash
npm run build
```

Genera una carpeta `dist/` lista para subir a Vercel (o cualquier hosting).

## 📱 Responsive

La app está optimizada para:
- Mobile (iPhone, Android)
- Tablet
- Desktop

## 🆘 Troubleshooting

**Error: "Cannot connect to Supabase"**
- Verifica que `.env.local` tenga las credenciales correctas
- Asegúrate de tener internet

**Error: "Table not found"**
- Corre el SQL del archivo `sql/init.sql` en Supabase
- Espera unos segundos a que se replique

**Error: "No data appears"**
- Carga los equipos manualmente o ejecuta `seed-data.sql`

## 📞 Feedback

Escribe los cambios que necesites y itero sobre ellos.

---

**Made for Gelatina 🎬**
