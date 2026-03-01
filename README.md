# Sistema de Reserva y Gestión de Vuelos - Intouch Airlines

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
DATABASE_URL="postgresql://user:password@localhost:5432/intouch_db"
JWT_SECRET="tu_clave_secreta"
PORT=4000
EMAIL_USER="tu_correo@gmail.com"
EMAIL_PASS="tu_app_password"
FRONTEND_URL="http://localhost:5173"