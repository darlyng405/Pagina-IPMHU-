// js/adminView.js — Vistas y lógica del rol Admin
import * as api from './api.js';
import * as ui  from './ui.js';

let _pagina = 1;
let _buscar = '';
let _rol    = '';
export let _cursos = [];

export async function loadAdminView(view, { setActiveNav, on }) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'usuarios') {
        content.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
                    <h3 style="margin:0">Gestión de Usuarios</h3>
                    <button id="btn-nuevo-usuario" class="btn-primary" style="width:auto;padding:10px 20px;">+ Nuevo Usuario</button>
                </div>
                <div class="filter-bar">
                    <input id="adm-buscar" placeholder="Buscar por nombre o ID..." style="margin:0">
                    <select id="adm-rol" style="margin:0;width:auto;">
                        <option value="">Todos los roles</option>
                        <option>Docente</option>
                        <option>Estudiante</option>
                        <option>Orientacion</option>
                        <option>Coordinacion</option>
                        <option>Admin</option>
                    </select>
                    <button id="btn-adm-buscar" class="btn-primary" style="width:auto;padding:10px 16px;">BUSCAR</button>
                </div>
                <div id="adm-tabla"></div>
                <div id="adm-paginacion" style="display:flex;gap:8px;justify-content:center;margin-top:15px;"></div>
            </div>
            <div id="adm-modal" class="hidden"></div>`;

        // Cargar cursos para el modal
        const resCursos = await api.adminGetCursos?.();
        if (resCursos?.success) _cursos = resCursos.data;

        _pagina = 1; _buscar = ''; _rol = '';
        await cargarTabla();

        on('btn-adm-buscar',   'click', async () => {
            _pagina = 1;
            _buscar = document.getElementById('adm-buscar').value;
            _rol    = document.getElementById('adm-rol').value;
            await cargarTabla();
        });
        on('adm-buscar', 'keydown', async e => {
            if (e.key === 'Enter') {
                _pagina = 1;
                _buscar = document.getElementById('adm-buscar').value;
                _rol    = document.getElementById('adm-rol').value;
                await cargarTabla();
            }
        });
        on('btn-nuevo-usuario', 'click', () => abrirModal(null));

    } else if (view === 'perfil') {
        const { store } = await import('./store.js');
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function cargarTabla() {
    const div = document.getElementById('adm-tabla');
    div.innerHTML = 'Cargando...';
    const res = await api.adminGetUsuarios({ buscar: _buscar, rol: _rol, pagina: _pagina });
    if (!res?.success) { div.innerHTML = 'Error al cargar usuarios.'; return; }

    let h = `<table class="web-table" id="tbl-usuarios">
        <thead><tr><th>ID</th><th>Nombre</th><th>Rol</th><th>Curso</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
        ${res.data.map(u => `
            <tr data-id="${u.id}">
                <td><code style="font-size:0.8rem">${u.id}</code></td>
                <td>${u.nombre}</td>
                <td><span style="background:#e8f0fe;color:var(--primary);padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:600">${u.rol}</span></td>
                <td>${u.curso || '—'}</td>
                <td>${u.activo !== false
                    ? '<span style="color:var(--success);font-weight:600">Activo</span>'
                    : '<span style="color:var(--danger);font-weight:600">Inactivo</span>'}</td>
                <td style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button data-accion="editar"   data-id="${u.id}" style="width:auto;padding:5px 10px;font-size:0.8rem;">Editar</button>
                    <button data-accion="toggle"   data-id="${u.id}" style="width:auto;padding:5px 10px;font-size:0.8rem;background:${u.activo !== false ? 'orange' : 'var(--success)'};color:white;">${u.activo !== false ? 'Desactivar' : 'Activar'}</button>
                    <button data-accion="eliminar" data-id="${u.id}" style="width:auto;padding:5px 10px;font-size:0.8rem;background:var(--danger);color:white;">Eliminar</button>
                </td>
            </tr>`).join('')}
        </tbody></table>`;

    div.innerHTML = h;

    document.getElementById('tbl-usuarios').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const { accion, id } = btn.dataset;

        if (accion === 'editar') {
            abrirModal(id);
        } else if (accion === 'toggle') {
            const user = res.data.find(u => u.id === id);
            if (!confirm(`¿Seguro que quieres ${user?.activo !== false ? 'desactivar' : 'activar'} a ${user?.nombre}?`)) return;
            const r = await api.adminToggleActivo(id);
            r?.success ? (ui.toast(r.msg), cargarTabla()) : ui.toast(r?.msg || 'Error', 'error');
        } else if (accion === 'eliminar') {
            const user = res.data.find(u => u.id === id);
            if (!confirm(`¿Seguro que quieres ELIMINAR permanentemente a ${user?.nombre}? Esta acción no se puede deshacer.`)) return;
            const r = await api.adminEliminarUsuario(id);
            r?.success ? (ui.toast('Usuario eliminado'), cargarTabla()) : ui.toast(r?.msg || 'Error', 'error');
        }
    });

    const pag = document.getElementById('adm-paginacion');
    pag.innerHTML = '';
    if (res.paginas > 1) {
        for (let i = 1; i <= res.paginas; i++) {
            const btn = document.createElement('button');
            btn.innerText     = i;
            btn.style.cssText = `width:auto;padding:6px 12px;font-size:0.85rem;${i === _pagina ? 'background:var(--primary);color:white;' : 'background:#f0f4ff;color:var(--primary);'}`;
            btn.addEventListener('click', () => { _pagina = i; cargarTabla(); });
            pag.appendChild(btn);
        }
    }
}

async function abrirModal(id = null) {
    const modal  = document.getElementById('adm-modal');
    const titulo = id ? 'Editar Usuario' : 'Nuevo Usuario';
    let datos    = { id: '', nombre: '', rol: 'Docente', cursoId: '', cedula: '', telefono: '', email: '' };

    if (id) {
        const res = await api.adminGetUsuario(id);
        if (!res?.success) { ui.toast('Error al cargar usuario', 'error'); return; }
        datos = res.data;
    }

    const cursosOpts = _cursos.map(c =>
        `<option value="${c.id}" ${datos.cursoId === c.id ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');

    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;">
            <div style="background:white;border-radius:12px;padding:30px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 style="margin:0;color:var(--primary)">${titulo}</h3>
                    <button id="btn-cerrar-modal" style="width:auto;padding:5px 12px;background:transparent;color:var(--text-light);border:1px solid var(--border);">✕</button>
                </div>
                <label>ID de Usuario ${id ? '(no editable)' : '(obligatorio)'}</label>
                <input id="m-id" value="${datos.id}" ${id ? 'readonly style="background:#f5f5f5"' : ''}>
                <label>Nombre Completo</label>
                <input id="m-nombre" value="${datos.nombre}" maxlength="200">
                <label>Rol</label>
                <select id="m-rol">
                    ${['Docente','Estudiante','Orientacion','Coordinacion','Admin'].map(r =>
                        `<option value="${r}" ${datos.rol === r ? 'selected' : ''}>${r}</option>`
                    ).join('')}
                </select>
                <label>Curso (solo para Estudiantes y Docentes)</label>
                <select id="m-curso">
                    <option value="">— Sin curso —</option>${cursosOpts}
                </select>
                <label>Cédula</label>
                <input id="m-cedula" value="${datos.cedula || ''}" maxlength="30">
                <label>Teléfono</label>
                <input id="m-telefono" value="${datos.telefono || ''}" maxlength="20">
                <label>Email</label>
                <input id="m-email" value="${datos.email || ''}" maxlength="200">
                <label>${id ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña (obligatoria)'}</label>
                <input id="m-password" type="password" placeholder="${id ? 'Nueva contraseña...' : 'Mínimo 8 caracteres'}">
                <div style="display:flex;gap:10px;margin-top:10px;">
                    <button id="btn-guardar-usuario" class="btn-primary">GUARDAR</button>
                    <button id="btn-cancelar-modal" style="background:transparent;color:var(--text-light);border:1px solid var(--border);">Cancelar</button>
                </div>
            </div>
        </div>`;

    document.getElementById('btn-cerrar-modal')?.addEventListener('click',   () => modal.classList.add('hidden'));
    document.getElementById('btn-cancelar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-guardar-usuario')?.addEventListener('click', () => guardarUsuario(id));
}

async function guardarUsuario(id = null) {
    const payload = {
        id:       document.getElementById('m-id').value.trim(),
        nombre:   document.getElementById('m-nombre').value.trim(),
        rol:      document.getElementById('m-rol').value,
        cursoId:  document.getElementById('m-curso').value || null,
        cedula:   document.getElementById('m-cedula').value.trim() || null,
        telefono: document.getElementById('m-telefono').value.trim() || null,
        email:    document.getElementById('m-email').value.trim() || null,
        password: document.getElementById('m-password').value || null,
    };

    if (!payload.nombre) { ui.toast('El nombre es obligatorio', 'error'); return; }
    if (!id && !payload.password) { ui.toast('La contraseña es obligatoria para usuarios nuevos', 'error'); return; }

    const res = id
        ? await api.adminEditarUsuario(id, payload)
        : await api.adminCrearUsuario(payload);

    if (res?.success) {
        ui.toast(res.msg);
        document.getElementById('adm-modal').classList.add('hidden');
        cargarTabla();
    } else {
        ui.toast(res?.msg || 'Error al guardar', 'error');
    }
}
