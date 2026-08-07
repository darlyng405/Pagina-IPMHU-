<p align="center">
  <img src="logo.png" alt="Logo IPMHU" width="180"/>
</p>

<h1 align="center">SIA-IPMHU — Frontend</h1>
<p align="center">Interfaz web del Sistema de Información Académica del Instituto Politécnico Max Henrríquez Ureña</p>

<p align="center">
  <a href="https://darlyng405.github.io/Pagina-IPMHU-/">🌐 Ver en Producción</a> &nbsp;·&nbsp;
  <a href="../backend/README.md">⚙️ README Backend</a> &nbsp;·&nbsp;
  <a href="mailto:mateodarlyng5@gmail.com">🐛 Reportar Bug</a>
</p>

---

## ¿Qué es esto?

El frontend del SIA es una aplicación web de una sola página (SPA) construida con HTML, CSS y JavaScript puro — sin frameworks, sin bundlers, sin dependencias de instalación. Se despliega directamente en GitHub Pages y se comunica con el backend vía API REST.

---

## Roles del sistema

| Rol | Acceso |
|---|---|
| **Docente** | Asistencia, calificaciones, reportes de conducta, tareas, historial, horario |
| **Estudiante** | Notas, asistencia, excusas, tareas, reportes, horario |
| **Orientación** | Búsqueda de estudiantes, pases de salida, excusas |
| **Coordinación** | Horarios por curso/docente, auditoría de asistencia |
| **Admin** | Gestión completa de usuarios + acceso a todas las vistas |

---

## Estructura del proyecto

```
frontend/
├── index.html              # Punto de entrada único
├── logo.png                # Logo institucional
├── css/
│   └── styles.css          # Estilos globales con variables CSS
└── js/
    ├── app.js              # Orquestador: auth, router, sidebar
    ├── api.js              # Todas las llamadas al backend
    ├── store.js            # Estado global (token, usuario, rol)
    ├── ui.js               # Funciones de render reutilizables
    ├── docenteView.js      # Vistas del rol Docente
    ├── estudianteView.js   # Vistas del rol Estudiante
    ├── orientacionView.js  # Vistas del rol Orientación
    ├── coordinacionView.js # Vistas del rol Coordinación
    └── adminView.js        # Vistas del rol Admin
```

---

## Decisiones técnicas

**Vanilla JS con ES Modules** — El proyecto usa `import/export` nativo del navegador, sin Webpack ni Vite. Esto elimina un paso de build y hace el código más directo de leer y depurar.

**Un archivo por rol** — Toda la lógica de vistas está separada por rol (`docenteView.js`, `estudianteView.js`, etc.). `app.js` solo maneja auth, routing y sidebar.

**Sin `localStorage`** — El token y los datos del usuario viven en el `store.js` en memoria. Al cerrar la pestaña, la sesión expira automáticamente.

**Sanitización XSS** — Todo dato del backend se escapa con la función `s()` de `ui.js` antes de inyectarse en el DOM.

---

## Variables de entorno

El frontend no tiene variables de entorno propias. La URL del backend se configura directamente en `js/api.js`:

```js
const API_BASE = 'https://tu-backend.onrender.com/api';
```

---

## Despliegue

El frontend se despliega automáticamente en GitHub Pages desde la rama `main`. Cualquier push a `main` actualiza la producción.

**URL de producción:** https://darlyng405.github.io/Pagina-IPMHU-/

---

## Hitos del proyecto

| Versión | Estado | Descripción |
|---|---|---|
| v1.0 | ✅ Completado | MVP: login, asistencia, calificaciones |
| v1.1 | ✅ Completado | Estudiantes, orientación, coordinación |
| v1.2 | 🔄 En progreso | Pases de salida con PDF, promedios, seguridad |
| v1.3 | 📋 Pendiente | Panel admin completo, notificaciones |
| v1.4 | 📋 Pendiente | Tutores, comunicación por correo |

---

<p align="center">Desarrollado para el IPMHU · Santo Domingo, República Dominicana</p>
