# AeroManage - Sistema de Gestión de Vuelos

Aplicación web full-stack diseñada para la gestión integral de reservas aéreas intercontinentales. El sistema ofrece una experiencia dinámica que abarca desde la selección visual de asientos hasta el seguimiento en tiempo real del estado operativo de los vuelos.

## 2. Descripción del Proyecto
El sistema resuelve la complejidad de la logística de reservas mediante una arquitectura desacoplada. Es dinámico porque permite la interacción en tiempo real con el inventario de asientos y refleja cambios de estado de vuelo (A tiempo, Retrasado, Cancelado) de manera instantánea en la interfaz del pasajero.

## 3. Características Principales
* **Autenticación Robusta:** Flujo seguro con JWT, encriptación Bcrypt y recuperación de cuenta mediante tokens temporales por correo electrónico.
* **Gestión de Sesión:** Temporizador visual de inactividad de 15 minutos para protección de datos según estándares de seguridad bancaria.
* **Terminal de Reservas:** Buscador de vuelos con filtros opcionales y mapa dinámico de selección de asientos por pasajero.
* **Módulo de Billetes:** Emisión de pases de abordar electrónicos con seguimiento dinámico del estado del vuelo.
* **Perfil de Usuario:** Gestión de datos personales, avatares dinámicos y sistema de borrado lógico mediante desactivación de cuenta.

## 4. Tecnologías Utilizadas

### Backend
* **Entorno:** Node.js
* **Framework:** Express
* **ORM:** Prisma ORM
* **Base de Datos:** PostgreSQL
* **Seguridad:** JWT (JSON Web Tokens) y Bcrypt
* **Correo:** Nodemailer (Servicio SMTP)

### Frontend
* **Framework:** React.js (Vite)
* **Estilos:** Tailwind CSS (Diseño responsivo y Glassmorphism)
* **Animaciones:** CSS nativo y transiciones de entrada para componentes de acceso
* **Cliente API:** Axios

## 5. Requisitos Previos
* Node.js v18 o superior
* PostgreSQL (Instalado localmente o instancia en la nube como Neon.tech)
* Gestor de paquetes npm

## 6. Instalación y Configuración

### Backend
1. Navegar a la carpeta backend: `cd backend`
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en archivo `.env`
4. Generar cliente Prisma: `npx prisma generate`
5. Ejecutar esquema en base de datos: `npx prisma db push`
6. Iniciar servidor: `npm run dev`

### Frontend
1. Navegar a la carpeta frontend: `cd frontend`
2. Instalar dependencias: `npm install`
3. Iniciar entorno de desarrollo: `npm run dev`

## 7. Variables de Envorno (.env)

### Backend
```env
DATABASE_URL="postgresql://user:password@localhost:5432/aeromanage_db"
JWT_SECRET="tu_clave_secreta"
PORT=4000
EMAIL_USER="tu_correo@gmail.com"
EMAIL_PASS="tu_app_password"
FRONTEND_URL="http://localhost:5173"
```

## 8. Características de Administración (NEW ✨)

AeroManage ahora incluye un sistema completo de administración para gestionar vuelos, usuarios y reservas.

### Acceso Admin
- Crear usuario admin: `node backend/scripts/createAdmin.js`
- Login con credenciales admin
- Acceso automático al dashboard de administración

### Dashboard Administrativo
El panel de admin incluye 4 secciones principales:

#### 📊 Resumen (Overview)
- Estadísticas en tiempo real
- Total de vuelos activos
- Total de usuarios registrados
- Total de reservas procesadas

#### ✈️ Gestión de Vuelos
- Ver todos los vuelos con disponibilidad de asientos
- Crear nuevos vuelos
- Cambiar estado de vuelos (A Tiempo | Retrasado | Cancelado)
- Actualizar precios y capacidad
- Tabla completa con rutas, horarios y disponibilidad

#### 👥 Gestión de Usuarios
- Listar todos los usuarios del sistema
- Ver rol de cada usuario (Pasajero | Administrador)
- Cantidad de reservas por usuario
- Información de contacto

#### 🎫 Gestión de Reservas
- Ver todas las reservas del sistema
- Detalles del pasajero y vuelos asociados
- Estado de la reserva (Confirmada | Pendiente | Cancelada)
- Información de precios

### API de Administración
```
GET    /api/admin/flights        - Listar vuelos
POST   /api/admin/flights        - Crear vuelo
PUT    /api/admin/flights/:id    - Actualizar vuelo
DELETE /api/admin/flights/:id    - Cancelar vuelo
PUT    /api/admin/flights/:id/status - Cambiar estado
GET    /api/admin/users          - Listar usuarios
GET    /api/admin/bookings       - Listar reservas
```

### Estructura de Vuelo
Cada vuelo incluye:
- 150 asientos totales (120 economía + 30 negocios)
- Selección de asientos automática
- Precios dinámicos según día y horario
- Estado del vuelo actualizable

## 9. Datos de Vuelos (Base de Datos Completa)

El seed genera vuelos para todo el año 2025-2026:

### Rutas Internacionales (8 rutas)
- Bogotá ↔ Miami
- Bogotá ↔ Madrid
- Bogotá ↔ Ciudad de México
- Bogotá ↔ Nueva York
- Bogotá ↔ Lima
- Plus rutas bidireccionales

### Estadísticas de Datos
- **Periodo**: 1 Enero 2025 - 31 Diciembre 2026
- **Vuelos**: ~17,520 vuelos
- **Asientos**: ~2,628,000 asientos
- **Frecuencia**: 3 vuelos/día por ruta
- **Horarios**: 06:00, 12:00, 18:00

### Ejecutar Seed
```bash
cd backend
npm run seed
```

Ver `SEED_EXECUTION_GUIDE.md` para instrucciones detalladas de seeding en producción.

## 10. Guías Completas

- **ADMIN_QUICK_REFERENCE.md** - Referencia rápida para administradores
- **SEED_EXECUTION_GUIDE.md** - Guía de ejecución de datos
- **IMPLEMENTATION_SUMMARY.md** - Resumen técnico de implementación