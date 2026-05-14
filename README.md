<p align="center">
  <img src="logo.png" alt="Logo IPMHU" width="200"/>
</p>

# Sistema de Gestión Académica — IPMHU

**Plataforma web para la gestión de asistencia, calificaciones, conducta, tareas y horarios del Instituto Politécnico Max Henrriquez Ureña (IPMHU).**

**Ver en Producción:** https://darlyng405.github.io/Pagina-IPMHU-/  
**Reportar Bug:** mateodarlyng5@gmail.com

---

## Sobre el Proyecto

El Sistema de Gestión Académica del IPMHU es una aplicación web full-stack que digitaliza los procesos escolares más importantes de la institución. Permite a docentes, estudiantes, orientadores y coordinadores acceder a su información académica desde cualquier navegador, sin instalar nada.

---

## ¿Qué resuelve?

- Eliminación del registro de asistencia en papel
- Acceso inmediato a calificaciones por parte de estudiantes
- Auditoría en tiempo real de qué docentes han pasado lista
- Gestión digital de excusas y pases de salida
- Blackboard de tareas por curso

---

## Tecnologías Utilizadas

### Frontend

| Tecnología | Uso |
|------------|-----|
| HTML5      | Estructura de la página |
| CSS3       | Estilos con variables CSS, Flexbox y diseño responsive |
| JavaScript Vanilla (ES6+) | Lógica del cliente sin frameworks |
| jsPDF      | Generación de PDFs en el navegador (pases de salida) |
| Google Fonts | Tipografía Poppins |

### Backend

| Tecnología | Uso |
|------------|-----|
| Node.js    | Entorno de ejecución |
| Express v5 | Framework del servidor web |
| JSON Web Tokens (JWT) | Autenticación con tokens firmados |
| bcryptjs   | Hash de contraseñas (implementación pendiente) |
| CORS       | Manejo de peticiones cross-origin |
| dotenv     | Gestión de variables de entorno |

### Base de Datos

| Tecnología | Uso |
|------------|-----|
| PostgreSQL | Motor de base de datos relacional |
| Supabase   | Hosting de PostgreSQL en la nube |
| node-postgres (pg) | Driver de conexión con pool de conexiones |

### Infraestructura

| Tecnología | Uso |
|------------|-----|
| Render.com | Hosting del backend (Node.js) |
| Supabase   | Hosting de la base de datos |
| GitHub     | Control de versiones |
