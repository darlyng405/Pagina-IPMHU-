// js/coordinacionView.js — Vistas y lógica del rol Coordinación
import * as api from './api.js';
import * as ui  from './ui.js';
import { store } from './store.js';

export async function loadCoordinacionView(view, { setActiveNav, on }) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'horarios') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horarios</h3>
                <div class="grid">
                    <div>
                        <label>Por Docente (ID)</label>
                        <div style="display:flex;gap:8px;">
                            <input id="c-doc-id" placeholder="Ej: DOC-001" style="margin:0">
                            <button id="btn-hor-doc" class="btn-primary" style="width:auto;">VER</button>
                        </div>
                    </div>
                    <div>
                        <label>Por Curso (ID)</label>
                        <div style="display:flex;gap:8px;">
                            <input id="c-cur-id" placeholder="Ej: 4A-INF" style="margin:0">
                            <button id="btn-hor-cur" class="btn-primary" style="width:auto;">VER</button>
                        </div>
                    </div>
                </div>
                <div id="c-hor-res" style="margin-top:20px;"></div>
            </div>`;
        on('btn-hor-doc', 'click', () => verHorario('docente'));
        on('btn-hor-cur', 'click', () => verHorario('curso'));

    } else if (view === 'auditoria') {
        content.innerHTML = `
            <div class="card">
                <h3>Auditoría de Asistencia</h3>
                <button id="btn-auditoria" class="btn-primary">EJECUTAR AUDITORÍA</button>
                <div id="c-res" style="margin-top:20px;"></div>
            </div>`;
        on('btn-auditoria', 'click', auditar);

    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function verHorario(tipo) {
    const id  = document.getElementById(tipo === 'docente' ? 'c-doc-id' : 'c-cur-id').value;
    const div = document.getElementById('c-hor-res');
    if (!id) { ui.toast('Ingrese un ID', 'error'); return; }
    div.innerHTML = 'Cargando...';
    const res = await api.getHorario(id, tipo);
    if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
    else div.innerHTML = 'No se encontró horario.';
}

async function auditar() {
    const div = document.getElementById('c-res');
    div.innerHTML = 'Analizando...';
    const res = await api.getAuditoriaAsistencia();
    if (!res?.success) { div.innerHTML = 'Error al realizar auditoría.'; return; }
    if (!res.data.length) {
        div.innerHTML = `<div style="padding:15px;background:#d4edda;color:#155724;border-radius:8px;">✅ Todos los docentes han pasado lista hoy.</div>`;
        return;
    }
    let h = `<h4 style="color:var(--accent)">Alertas (${res.data.length})</h4>
        <table class="web-table"><thead><tr><th>Docente</th><th>Curso</th><th>Hora</th><th>Estado</th></tr></thead><tbody>`;
    res.data.forEach(r => h += `<tr><td>${r.docente}</td><td>${r.curso}</td><td>${r.hora}</td><td style="color:red;font-weight:bold">Pendiente</td></tr>`);
    div.innerHTML = h + '</tbody></table>';
}
