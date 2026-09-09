# 🚀 Guía de instalación - Inventario Gelatina

## Paso 1: Descargar e instalar Node.js

1. Abre https://nodejs.org
2. Descarga la versión LTS (18.x o superior)
3. Instala normalmente
4. Abre terminal/cmd y verifica:
```bash
node --version
npm --version
```

Deberían mostrar números de versión.

---

## Paso 2: Descargar el proyecto

Descarga los archivos que te compartí (la carpeta `inventario-gelatina-app`).

Descomprime en una ubicación, por ejemplo:
```
C:\Usuarios\Tu Nombre\Documentos\inventario-gelatina-app
```

---

## Paso 3: Abrir terminal en la carpeta

**En Windows:**
- Click derecho en la carpeta
- "Abrir en terminal" o "Abrir en PowerShell"

**En Mac/Linux:**
- Terminal > Nuevo > cambiar a la carpeta

Verifica que estés en la carpeta correcta:
```bash
pwd  # Mac/Linux
cd   # Windows - debe mostrar la ruta
```

---

## Paso 4: Instalar dependencias

Ejecuta:
```bash
npm install
```

Esto descarga todas las librerías necesarias (React, Supabase, etc).
**Tardará 1-2 minutos.**

---

## Paso 5: Crear base de datos en Supabase

### 5.1 Abre Supabase

1. Ve a https://supabase.com/dashboard
2. Entra a tu proyecto "Inventario Gelatina"

### 5.2 Ir a SQL Editor

En el menú izquierdo → "SQL Editor"

### 5.3 Crear nueva query

Click en "+ New Query"

### 5.4 Pegar y ejecutar SQL

1. Abre el archivo `sql/init.sql` (con cualquier editor de texto)
2. Copia TODO el contenido
3. Pega en la query de Supabase
4. Click en "Run" (triángulo negro)

Espera a que termine (debería decir "Success").

### 5.5 Cargar datos de prueba (opcional)

1. Abre `sql/seed-data.sql`
2. Copia TODO
3. Nueva query en Supabase
4. Pega y ejecuta

Ahora tienes equipos de prueba.

---

## Paso 6: Configurar usuarios de prueba en Supabase

### 6.1 Ir a Authentication

Menú izquierdo → "Authentication"

### 6.2 Crear usuarios

Click en "Add user"

**Usuario 1:**
- Email: `prueba1@gmail.com`
- Password: `123456`
- Click "Save"

**Usuario 2:**
- Email: `prueba2@gmail.com`
- Password: `123456`

---

## Paso 7: Correr la app

En tu terminal (en la carpeta del proyecto), ejecuta:

```bash
npm run dev
```

Debería abrir automáticamente en `http://localhost:3000`

Si no abre, ve a ese link manualmente en tu navegador.

---

## Paso 8: Probar login

En la pantalla de login:
- Email: `prueba1@gmail.com`
- Password: `123456`

Click en "Iniciar sesión"

Si todo está bien, verás el Dashboard 🎉

---

## 🛠️ Troubleshooting

### Error: "npm: comando no encontrado"
- No instalaste Node.js correctamente
- Reinicia la computadora después de instalarlo

### Error: "Cannot find module"
- Ejecuta: `npm install` nuevamente
- Espera a que termine

### Error: "Cannot connect to Supabase"
- Verifica que internet funcione
- Revisa que el `.env.local` tenga las credenciales correctas

### Error: "Table not found"
- No ejecutaste el SQL de `init.sql`
- Abre Supabase → SQL Editor → copia y ejecuta `init.sql`

### Port 3000 already in use
- Cierra otras apps que usen ese puerto
- O modifica en `vite.config.ts` → `port: 3001`

---

## 📱 Acceder desde otro dispositivo

Si quieres acceder desde tu celular (en la misma red):

1. Descubre tu IP local:
   - Windows: `ipconfig` → busca "IPv4 Address"
   - Mac: Sistema → Red → ver IP
   - Linux: `ip addr`

2. En tu celular, abre el navegador:
   ```
   http://TU_IP:3000
   ```
   Por ejemplo: `http://192.168.1.50:3000`

---

## ✅ Checklist

- [ ] Node.js instalado
- [ ] Proyecto descargado
- [ ] Terminal abierta en la carpeta correcta
- [ ] `npm install` completado
- [ ] `init.sql` ejecutado en Supabase
- [ ] Usuarios creados en Supabase Auth
- [ ] `npm run dev` ejecutado
- [ ] Login funciona
- [ ] Ves el Dashboard

---

## ¿Listo?

¡Escríbeme qué cambios necesitas y vamos iterando!

---

**Made for Gelatina 🎬**
