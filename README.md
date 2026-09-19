# FashionStore — Plataforma Inteligente de Comercio Electrónico con Vestidores Virtuales AR

Plataforma integral de comercio electrónico de moda con **vestidores virtuales mediante Realidad Aumentada**, gestión de sucursales físicas, reservas de vestidores, puntos de venta en caja (POS), pasarela digital y asistente de moda con inteligencia artificial.

---

## 🚀 Tecnologías Implementadas

- **Backend**: [NestJS](https://nestjs.com/) (TypeScript) + TypeORM + Swagger OpenAPI + JWT RBAC.
- **Frontend Web**: [React](https://react.dev/) (Vite + TypeScript) + Vanilla CSS con diseño de alta costura + Three.js / Canvas AR.
- **Aplicación Móvil**: [React Native](https://reactnative.dev/) (Expo) + `expo-camera` para Realidad Aumentada nativa + comprobantes QR.
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) (Soporte local y Azure Database for PostgreSQL Flexible Server).
- **Inteligencia Artificial**: Asistente de moda virtual, recomendador inteligente de prendas y análisis generativo para la gerencia.
- **Despliegue en la Nube**: [Microsoft Azure](https://azure.microsoft.com/) (Docker, Azure App Service, Azure Container Apps, Azure Database).

---

## 📁 Estructura del Proyecto

```text
si2/
├── backend/                  # API REST NestJS
│   ├── src/
│   │   ├── auth/             # Autenticación JWT y guards de roles
│   │   ├── users/            # Gestión de usuarios y personal
│   │   ├── branches/         # Sucursales y ciudades
│   │   ├── catalog/          # Categorías, temporadas, colecciones y prendas
│   │   ├── inventory/        # Stock por sucursal y movimientos (Kardex)
│   │   ├── reservations/     # Reservas de vestidores físicos
│   │   ├── orders/           # Ventas digitales y POS de caja
│   │   ├── ai/               # Asesor virtual IA y reportes generativos
│   │   └── seed/             # Carga automática de datos de prueba
│   └── Dockerfile
├── frontend/                 # Aplicación Web React
│   ├── src/
│   │   ├── components/       # Componentes (Navbar, AR Virtual Fitting, POS, Dashboard, etc.)
│   │   ├── services/         # Cliente API Axios y tipos
│   │   └── App.tsx           # Vistas dinámicas según rol y tabs
│   ├── Dockerfile
│   └── nginx.conf
├── mobile/                   # Aplicación Móvil React Native (Expo)
│   ├── src/
│   │   ├── screens/          # Catálogo, Vestidor AR con Cámara, Reservas, Carrito, Asistente IA
│   │   └── services/         # Cliente API móvil
│   └── App.tsx
├── azure/                    # Scripts y configuración de despliegue en la nube
│   ├── azure-deploy.ps1      # Script automatizado Azure CLI
│   ├── README_AZURE.md       # Guía paso a paso de Azure y generación de APK móvil
│   └── docker-compose.yml
└── README.md
```

---

## 🔑 Usuarios y Roles Preconfigurados (Semilla)

Todas las contraseñas iniciales son: `123456`

| Rol | Correo Electrónico | Descripción de Acceso |
| :--- | :--- | :--- |
| **Administrador** | `admin@fashionstore.com` | Control total, inventario consolidado, indicadores globales y reportes IA. |
| **Encargado de Sucursal** | `encargado@fashionstore.com` | Cola de reservas, preparación de prendas en perchero y stock local. |
| **Cajero (POS)** | `cajero@fashionstore.com` | Facturación presencial en mostrador, cobro en efectivo/QR y emisión de tickets. |
| **Cliente** | `cliente@fashionstore.com` | Catálogo, vestidor virtual AR, citas de probador y compras online. |
| **Proveedor** | `proveedor@fashionstore.com` | Gestión y suministro de colecciones por temporada. |

---

## 🛠️ Cómo Ejecutar Localmente

### 1. Backend (NestJS)
```bash
cd backend
npm run start:dev
```
- API REST: `http://localhost:3000/api`
- Documentación interactiva Swagger: `http://localhost:3000/api/docs`

### 2. Frontend Web (React)
```bash
cd frontend
npm run dev
```
- Aplicación Web en el navegador: `http://localhost:5173/`

### 3. Aplicación Móvil (React Native)
```bash
cd mobile
npx expo start
```
- Escanea el código QR con la aplicación **Expo Go** en Android o iOS para probar la cámara y vestidor virtual.

---

## ☁️ Despliegue en Azure
Revisa la documentación detallada en [`azure/README_AZURE.md`](./azure/README_AZURE.md).
