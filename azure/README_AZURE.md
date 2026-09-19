# Guía de Despliegue en Microsoft Azure & Generación Móvil - FashionStore

Esta guía detalla los pasos para poner en producción tanto el Backend (NestJS), la Base de Datos (PostgreSQL en Azure), la Aplicación Web (React) y la Aplicación Móvil (React Native con Expo).

---

## 1. Arquitectura en la Nube (Azure)

- **Base de Datos**: Azure Database for PostgreSQL Flexible Server (versión 16).
- **Backend API**: Azure App Service / Azure Container Apps ejecutando el contenedor NestJS.
- **Frontend Web**: Azure App Service / Azure Static Web Apps ejecutando el frontend compilado con Nginx.
- **Registro de Contenedores**: Azure Container Registry (ACR) privado para las imágenes Docker.
- **Móvil**: Compilación de binarios nativos (.apk Android / .ipa iOS) utilizando **Expo Application Services (EAS Build)**.

---

## 2. Despliegue Automatizado con Azure CLI

### Prerrequisitos
1. Tener una cuenta activa en [Microsoft Azure](https://portal.azure.com/).
2. Tener instalado [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
3. Iniciar sesión en tu terminal:
   ```bash
   az login
   ```

### Ejecutar el Script Automatizado (Windows PowerShell)
Desde la raíz del proyecto `c:\Users\HP\Desktop\si2`:
```powershell
.\azure\azure-deploy.ps1
```

El script ejecutará automáticamente:
1. Creación del Resource Group (`rg-fashionstore-prod`).
2. Aprovisionamiento del servidor PostgreSQL administrado con SSL obligatorio.
3. Creación del Azure Container Registry (ACR).
4. Compilación remota multi-stage en Azure de las imágenes Docker para Backend y Frontend.
5. Creación del App Service Plan y despliegue de las instancias con variables de entorno conectadas.

---

## 3. Despliegue con Docker Compose (Servidor Cloud / VM)

Si dispones de una Máquina Virtual Linux en Azure (Ubuntu 22.04 LTS):

1. Clona el repositorio en la VM.
2. Configura tu archivo `.env` o variables:
   ```env
   DB_PASSWORD=FashionStore2026Secure!
   JWT_SECRET=FashionStoreSuperSecret2026Key
   ```
3. Levanta todos los servicios:
   ```bash
   docker compose up -d --build
   ```
4. El backend estará disponible en el puerto `3000` y el frontend en el puerto `80`.

---

## 4. Compilación y Publicación de la App Móvil (React Native)

La aplicación móvil está construida con **Expo y React Native**. Para generar el instalador **APK de Android** o probarla inmediatamente en tu teléfono físico:

### A) Prueba inmediata en tu teléfono (Expo Go)
1. Instala la app **Expo Go** en tu smartphone (Google Play o App Store).
2. En la terminal dentro de `mobile/`:
   ```bash
   cd mobile
   npx expo start
   ```
3. Escanea el código QR que aparecerá en la terminal con la cámara de tu teléfono. ¡La app cargará inmediatamente con acceso a la cámara y vestidor virtual AR!

### B) Generar instalador independiente (.APK para Android)
1. Instala la herramienta oficial de compilación de Expo:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Configura la compilación en `mobile/`:
   ```bash
   eas build:configure
   ```
3. Genera el APK:
   ```bash
   eas build -p android --profile preview
   ```
4. Expo compilará el APK en la nube y te proporcionará un enlace directo de descarga para instalarlo en cualquier dispositivo Android.
