import { store } from './store.js';
import * as api from './api.js';
import * as ui from './ui.js';

export async function loadSecretariaView(view, { setActiveNav, on }) {
    setActiveNav(view);
    const content = document.getElementById('content-area');
    content.innerHTML = '<p>Cargando...</p>';

    if (view === 'solicitudes') {
        content.innerHTML = `
            <div class="card">
                <h3>Solicitudes de Documentos</h3>
                <div class="filter-bar">
                    <select id="sec-estado" style="margin:0;width:auto;">
                        <option value="">Todos</option>
                        <option value="Pendiente">Pendientes</option>
                        <option value="Completada">Completadas</option>
                    </select>
                    <button id="btn-sec-listar" class="btn-primary" style="width:auto;padding:10px 16px;">FILTRAR</button>
                </div>
                <div id="sec-lista"></div>
            </div>`;

        on('btn-sec-listar', 'click', async () => {
            const estado = document.getElementById('sec-estado').value;
            await cargarSolicitudes(estado);
        });

        await cargarSolicitudes();

    } else if (view === 'nueva-solicitud') {
        content.innerHTML = `
            <div class="card">
                <h3>Nueva Solicitud de Documento</h3>
                <div class="grid">
                    <div>
                        <label>ID del Estudiante</label>
                        <div style="display:flex;gap:8px;">
                            <input id="sec-id" placeholder="Ej: EST-001" style="margin:0">
                            <button id="btn-sec-buscar" class="btn-primary" style="width:auto;padding:10px 14px;">BUSCAR</button>
                        </div>
                    </div>
                    <div><label>Nombre del solicitante</label><input id="sec-solicitante" placeholder="Padre / madre / tutor"></div>
                </div>
                <div class="grid">
                    <div><label>Parentesco</label><input id="sec-parentesco" placeholder="Padre, Madre, Tutor..."></div>
                    <div><label>Curso</label><input id="sec-curso" readonly style="background:#f5f5f5"></div>
                </div>
                <div class="grid">
                    <div><label>Año escolar</label><input id="sec-anio" placeholder="2026-2027"></div>
                    <div><label>Grado</label><input id="sec-grado" placeholder="10mo"></div>
                    <div><label>Sección</label><input id="sec-seccion" placeholder="A"></div>
                </div>
                <div class="grid">
                    <div><label>Tipo de documento</label>
                        <select id="sec-documento">
                            <option value="">-- Seleccione --</option>
                            <option>Constancia de Estudio</option>
                            <option>Certificado de Notas</option>
                            <option>Record Académico</option>
                            <option>Otros</option>
                        </select>
                    </div>
                    <div><label>Periodo / Modulo</label><input id="sec-modulo" placeholder="Ej: P1, P2, o módulo"></div>
                </div>
                <div class="grid">
                    <div><label>Teléfono 1</label><input id="sec-tel1" placeholder="Teléfono principal"></div>
                    <div><label>Teléfono 2</label><input id="sec-tel2" placeholder="Opcional"></div>
                    <div><label>Correo</label><input id="sec-correo" placeholder="Opcional"></div>
                </div>
                <label>Descripción (si es Otros)</label>
                <textarea id="sec-descripcion" rows="3" placeholder="Detalle adicional..."></textarea>
                <button id="btn-sec-guardar" class="btn-primary">REGISTRAR SOLICITUD</button>
            </div>`;

        on('btn-sec-buscar', 'click', buscarEstudianteSecretaria);
        on('btn-sec-guardar', 'click', guardarSolicitud); 

    } else if (view === 'buscar-estudiante') {
        content.innerHTML = `
            <div class="card">
                <h3>Buscar Estudiante</h3>
                <div style="display:flex;gap:10px;">
                    <input id="sec-bus-id" placeholder="ID del estudiante" style="margin:0">
                    <button id="btn-sec-buscar-est" class="btn-primary" style="width:auto;padding:10px 16px;">CONSULTAR</button>
                </div>
                <div id="sec-bus-result" style="margin-top:20px;"></div>
            </div>`;

        on('btn-sec-buscar-est', 'click', buscarEstudianteSecretaria);

    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function cargarSolicitudes(estado = '') {
    const div = document.getElementById('sec-lista');
    if (!div) return;
    div.innerHTML = 'Cargando solicitudes...';

    const res = await api.getSolicitudesSecretaria(estado);
    if (!res?.success || !Array.isArray(res.data)) {
        div.innerHTML = '<p>No se pudieron cargar las solicitudes.</p>';
        return;
    }

    if (!res.data.length) {
        div.innerHTML = '<p>No hay solicitudes registradas.</p>';
        return;
    }

    div.innerHTML = `
        <table class="web-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Solicitante</th>
                    <th>Estudiante</th>
                    <th>Documento</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Entrega</th>
                </tr>
            </thead>
            <tbody>
                ${res.data.map(s => `
                    <tr>
                        <td>${ui.s ? ui.s(s.codigo) : s.codigo}</td>
                        <td>${ui.s ? ui.s(s.nombreSolicitante) : s.nombre_solicitante}</td>
                        <td>${ui.s ? ui.s(s.estudiante || s.idEstudiante || '') : (s.estudiante || s.id_estudiante || '')}</td>
                        <td>${ui.s ? ui.s(s.documento) : s.documento}</td>
                        <td>${ui.s ? ui.s(s.estado) : s.estado}</td>
                        <td>${new Date(s.fechaSolicitud || s.fecha_solicitud).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-primary" style="width:auto;padding:6px 10px;font-size:0.8rem;" data-id="${s.id}" data-accion="entregar">Completar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;

    div.querySelectorAll('[data-accion="entregar"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const quien = window.prompt('Ingrese el nombre de quien recoge:');
            if (!quien) return;
            const cedula = window.prompt('Ingrese la cédula o ID de quien recoge:');
            if (!cedula) return;
            const res = await api.entregarSolicitudSecretaria(id, { quienRecoge: quien, idRecoge: cedula, esEstudiante: false });
            if (res?.success) {
                ui.toast('Solicitud completada');
                await cargarSolicitudes(document.getElementById('sec-estado')?.value || '');
            } else {
                ui.toast(res?.msg || 'Error al completar', 'error');
            }
        });
    });
}

async function buscarEstudianteSecretaria() {
    const id = document.getElementById('sec-id')?.value.trim() || document.getElementById('sec-bus-id')?.value.trim();
    if (!id) {
        ui.toast('Ingrese un ID de estudiante', 'error');
        return;
    }

    const res = await api.buscarEstudianteSecretaria(id);
    if (!res?.success) {
        ui.toast(res?._status === 404 ? 'Estudiante no encontrado' : 'Error al buscar', 'error');
        return;
    }

    const d = res.data;
    const cursoInput = document.getElementById('sec-curso');
    const buscarRes = document.getElementById('sec-bus-result');

    if (cursoInput) cursoInput.value = d.curso || '';
    if (buscarRes) {
        buscarRes.innerHTML = `
            <div class="card">
                <h3>${d.nombre}</h3>
                <p><strong>ID:</strong> ${d.idUsuario || d.id_usuario}</p>
                <p><strong>Curso:</strong> ${d.curso || '—'}</p>
                <p><strong>Rol:</strong> ${d.rol || 'Estudiante'}</p>
            </div>`;
    }

    ui.toast(`Estudiante encontrado: ${d.nombre}`);
}

async function guardarSolicitud() {
    const payload = {
        idEstudiante: document.getElementById('sec-id')?.value.trim() || null,
        nombreSolicitante: document.getElementById('sec-solicitante')?.value.trim(),
        parentesco: document.getElementById('sec-parentesco')?.value.trim(),
        anioEscolar: document.getElementById('sec-anio')?.value.trim(),
        grado: document.getElementById('sec-grado')?.value.trim(),
        seccion: document.getElementById('sec-seccion')?.value.trim(),
        documento: document.getElementById('sec-documento')?.value,
        modulo: document.getElementById('sec-modulo')?.value.trim(),
        telefono1: document.getElementById('sec-tel1')?.value.trim(),
        telefono2: document.getElementById('sec-tel2')?.value.trim(),
        correo: document.getElementById('sec-correo')?.value.trim(),
        descripcionOtro: document.getElementById('sec-descripcion')?.value.trim(),
    };

    if (!payload.nombreSolicitante || !payload.anioEscolar || !payload.grado || !payload.seccion || !payload.documento || !payload.telefono1) {
        ui.toast('Complete los campos obligatorios', 'error');
        return;
    }

    const res = await api.crearSolicitudSecretaria(payload);
    if (res?.success) {
        ui.toast('Solicitud registrada');
        document.getElementById('sec-id').value = '';
        document.getElementById('sec-solicitante').value = '';
        document.getElementById('sec-parentesco').value = '';
        document.getElementById('sec-curso').value = '';
        document.getElementById('sec-anio').value = '';
        document.getElementById('sec-grado').value = '';
        document.getElementById('sec-seccion').value = '';
        document.getElementById('sec-documento').value = '';
        document.getElementById('sec-modulo').value = '';
        document.getElementById('sec-tel1').value = '';
        document.getElementById('sec-tel2').value = '';
        document.getElementById('sec-correo').value = '';
        document.getElementById('sec-descripcion').value = '';
    } else {
        ui.toast(res?.msg || 'Error al guardar solicitud', 'error');
    }
}
