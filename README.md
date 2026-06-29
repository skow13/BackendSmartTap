# SmartTap Backend

Backend REST para la app Android SmartTap.  
Recibe datos BLE desde la app y los guarda en PostgreSQL (Railway) usando stored functions.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/register | ❌ | Registro de usuario |
| POST | /api/auth/login | ❌ | Login → devuelve JWT |
| GET | /api/devices | ✅ JWT | Listar dispositivos del usuario |
| POST | /api/devices/register | ✅ JWT | Vincular ESP32 por MAC |
| GET | /api/devices/:mac/history | ✅ JWT | Historial de medidas |
| POST | /api/devices/:mac/data | ✅ JWT | Subir datos BLE al backend |
| DELETE | /api/devices/:mac | ✅ JWT | Eliminar dispositivo |
| GET | /health | ❌ | Estado del servidor y DB |

## Deploy en Railway

1. Sube esta carpeta a un repo de GitHub
2. En Railway → New Project → Deploy from GitHub repo
3. Selecciona el repo
4. En **Variables** agrega:
   ```
   DATABASE_URL = postgresql://postgres:ArcIPDAXoLwtXPZaVLmwikQVgiesMzLf@zephyr.proxy.rlwy.net:21533/railway
   JWT_SECRET   = smarttap_jwt_secret_2024
   PORT         = 3000
   ```
5. Railway detecta el `package.json` y corre `npm start` automáticamente
6. Copia la URL pública que Railway te asigne (ej: `https://smarttap-backend-xxxx.up.railway.app`)
7. Pégala en `AppModule.kt` de la app Android:
   ```kotlin
   private const val BACKEND_URL = "https://TU_URL.up.railway.app/"
   ```

## Variables de entorno (.env para desarrollo local)

```
DATABASE_URL=postgresql://postgres:ArcIPDAXoLwtXPZaVLmwikQVgiesMzLf@zephyr.proxy.rlwy.net:21533/railway
JWT_SECRET=smarttap_jwt_secret_2024
PORT=3000
```
