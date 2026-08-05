// js/orientacionView.js — Vistas y lógica del rol Orientación
import { store } from './store.js';
import * as api  from './api.js';
import * as ui   from './ui.js';

export function loadOrientacionView(view, { setActiveNav, on }) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'bus') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta Disciplinaria</h3>
                <div style="display:flex;gap:10px;">
                    <input type="text" id="o-bus-id" placeholder="ID del Estudiante..." style="margin:0">
                    <button id="btn-buscar" class="btn-primary" style="width:150px;">CONSULTAR</button>
                </div>
            </div>
            <div id="o-res" class="hidden"></div>`;
        on('btn-buscar', 'click', buscar);
        on('o-bus-id',   'keydown', e => { if (e.key === 'Enter') buscar(); });

    } else if (view === 'pas') {
        const user = store.get('user');
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Salida</h3>
                <p style="font-size:0.85rem;color:var(--text-light);margin-top:-5px;margin-bottom:20px;">
                    Complete los datos y presione <strong>Registrar</strong>. Luego podrá descargar el PDF.
                </p>
                <h4 style="color:var(--primary);margin-bottom:10px;">Datos del Estudiante</h4>
                <div class="grid">
                    <div>
                        <label>ID del Estudiante</label>
                        <div style="display:flex;gap:8px;">
                            <input id="p-id" placeholder="Ej: EST-001" style="margin:0">
                            <button id="btn-buscar-est" class="btn-primary" style="width:auto;padding:10px 14px;">BUSCAR</button>
                        </div>
                    </div>
                    <div><label>Fecha</label><input id="p-fecha" type="date" readonly style="background:#f5f5f5"></div>
                </div>
                <div class="grid" style="margin-top:10px;">
                    <div><label>Nombre Completo</label><input id="p-nom" readonly style="background:#f5f5f5" placeholder="(autocompletado)"></div>
                    <div><label>Curso / Sección</label><input id="p-cur" readonly style="background:#f5f5f5" placeholder="(autocompletado)"></div>
                </div>
                <h4 style="color:var(--primary);margin:20px 0 10px;">Datos del Pase</h4>
                <div class="grid">
                    <div>
                        <label>Hora de Salida</label>
                        <input id="p-hora" type="time">
                    </div>
                    <div>
                        <label>Motivo de Salida</label>
                        <select id="p-motivo">
                            <option value="">-- Seleccione --</option>
                            <option>Cita médica</option>
                            <option>Emergencia familiar</option>
                            <option>Diligencia personal</option>
                            <option>Otro</option>
                        </select>
                    </div>
                </div>
                <label>Descripción / Detalle (opcional)</label>
                <textarea id="p-detalle" rows="2" placeholder="Información adicional sobre el motivo..." maxlength="500"></textarea>
                <h4 style="color:var(--primary);margin:20px 0 10px;">Responsable del Retiro</h4>
                <div class="grid">
                    <div><label>Nombre de quien retira</label><input id="p-retira" placeholder="Nombre completo" maxlength="200"></div>
                    <div><label>Cédula / Pasaporte</label><input id="p-cedula" placeholder="Ej: 402-1234567-8" maxlength="30"></div>
                </div>
                <label>Parentesco / Relación con el estudiante</label>
                <select id="p-parentesco">
                    <option value="">-- Seleccione --</option>
                    <option>Padre</option>
                    <option>Madre</option>
                    <option>Tutor/a legal</option>
                    <option>Hermano/a mayor</option>
                    <option>Tío/a</option>
                    <option>Otro familiar</option>
                    <option>Otro</option>
                </select>
                <h4 style="color:var(--primary);margin:20px 0 10px;">Autorización</h4>
                <label>Autorizado por</label>
                <input id="p-autoriza" value="${user.nombreCompleto || user.nombre}" readonly style="background:#f5f5f5">
                <div style="margin-top:25px;display:flex;gap:10px;flex-wrap:wrap;">
                    <button id="btn-pase" class="btn-primary">REGISTRAR PASE</button>
                    <button id="btn-descargar-pdf" class="btn-primary" style="display:none;background:var(--success);">⬇ DESCARGAR PDF</button>
                </div>
                <div id="p-confirmacion" style="display:none;margin-top:15px;padding:12px 16px;background:#d4edda;color:#155724;border-radius:8px;font-weight:600;"></div>
            </div>`;

        document.getElementById('p-fecha').value = new Date().toISOString().split('T')[0];
        const ahora = new Date();
        document.getElementById('p-hora').value =
            `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;

        on('btn-buscar-est', 'click',  datosPase);
        on('p-id',           'keydown', e => { if (e.key === 'Enter') datosPase(); });
        on('btn-pase',       'click',  generarPase);

    } else if (view === 'exc') {
        content.innerHTML = `
            <div class="card">
                <h3>Registrar Excusa</h3>
                <label>ID Estudiante</label><input id="e-id">
                <div class="grid">
                    <div><label>Desde</label><input type="date" id="e-ini"></div>
                    <div><label>Hasta</label><input type="date" id="e-fin"></div>
                </div>
                <label>Motivo</label><textarea id="e-mot" maxlength="500"></textarea>
                <button id="btn-excusa" class="btn-primary">GUARDAR</button>
            </div>`;
        on('btn-excusa', 'click', guardarExcusa);

    } else if (view === 'horario') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horario de Curso</h3>
                <div style="display:flex;gap:10px;margin-bottom:20px;">
                    <input id="o-hor-id" placeholder="ID del Curso (Ej: 4A-INF)" style="margin:0">
                    <button id="btn-hor-ori" class="btn-primary" style="width:auto;">BUSCAR</button>
                </div>
                <div id="o-hor-res"></div>
            </div>`;
        on('btn-hor-ori', 'click', buscarHorario);

    } else if (view === 'per') {
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function buscar() {
    const id  = document.getElementById('o-bus-id').value.trim();
    const div = document.getElementById('o-res');
    if (!id) { ui.toast('Ingrese un ID', 'error'); return; }
    const res = await api.buscarEstudiante(id);

    if (!res?.success) {
        ui.toast(res?._status === 404 ? 'Estudiante no encontrado' : 'Error al buscar', 'error');
        return;
    }

    const d = res.data;
    div.classList.remove('hidden');
    div.innerHTML = `
        <div class="card">
            <h3>${d.nombre}</h3>
            <p>Curso: <strong>${d.curso}</strong> | Reportes: <strong>${d.totalReportes}</strong></p>
            ${d.tieneExcusa ? `<div style="background:#fff3cd;padding:10px;border-radius:8px;color:#856404;">📋 Excusa activa: ${d.detalleExcusa}</div>` : ''}
            <div style="margin-top:15px;display:flex;gap:8px;flex-wrap:wrap;">
                <button data-notas="getStudentGradesDetail" class="btn-primary" style="width:auto;padding:8px 12px;font-size:0.8rem;">Notas Detalle</button>
                <button data-notas="getStudentGradesP"      class="btn-primary" style="width:auto;padding:8px 12px;font-size:0.8rem;">Notas P</button>
                <button data-notas="getStudentGradesRA"     class="btn-primary" style="width:auto;padding:8px 12px;font-size:0.8rem;">Notas RA</button>
            </div>
            <div id="o-notas-area" style="margin-top:15px;"></div>
        </div>
        <div class="card">
            <h3>Historial de Reportes</h3>
            <table class="web-table"><thead><tr><th>Fecha</th><th>Falta</th><th>Docente</th></tr></thead><tbody>
            ${d.detalleReportes.map(r => `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.falta}</td><td>${r.docente}</td></tr>`).join('')}
            </tbody></table>
        </div>`;

    div.querySelectorAll('[data-notas]').forEach(btn => {
        btn.addEventListener('click', () => verNotas(btn.dataset.notas));
    });
}

async function verNotas(endpoint) {
    const div = document.getElementById('o-notas-area');
    div.innerHTML = 'Cargando notas...';
    const fnMap = {
        getStudentGradesDetail: api.getStudentGradesDetail,
        getStudentGradesP:      api.getStudentGradesP,
        getStudentGradesRA:     api.getStudentGradesRA,
    };
    const res = await fnMap[endpoint]?.();
    if (res?.success && res.data.length) {
        const keys = Object.keys(res.data[0]);
        let h = `<table class="web-table"><thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>`;
        res.data.forEach(r => h += `<tr>${keys.map(k => `<td>${r[k]}</td>`).join('')}</tr>`);
        div.innerHTML = h + '</tbody></table>';
    } else {
        div.innerHTML = 'No hay calificaciones registradas.';
    }
}

async function datosPase() {
    const id = document.getElementById('p-id').value.trim();
    if (!id) { ui.toast('Ingrese el ID del estudiante', 'error'); return; }
    const res = await api.buscarEstudiante(id);
    if (res?.success) {
        document.getElementById('p-nom').value = res.data.nombre;
        document.getElementById('p-cur').value = res.data.curso;
        ui.toast(`Estudiante encontrado: ${res.data.nombre}`);
    } else {
        ui.toast(res?._status === 404 ? 'Estudiante no encontrado' : 'Error al buscar', 'error');
        document.getElementById('p-nom').value = '';
        document.getElementById('p-cur').value = '';
    }
}

async function generarPase() {
    const idEst      = document.getElementById('p-id').value.trim();
    const nombre     = document.getElementById('p-nom').value.trim();
    const retira     = document.getElementById('p-retira').value.trim();
    const cedula     = document.getElementById('p-cedula').value.trim();
    const motivo     = document.getElementById('p-motivo').value;
    const detalle    = document.getElementById('p-detalle').value.trim();
    const hora       = document.getElementById('p-hora').value;
    const parentesco = document.getElementById('p-parentesco').value;
    const autoriza   = document.getElementById('p-autoriza').value;

    if (!idEst || !nombre) { ui.toast('Busque primero al estudiante por ID', 'error'); return; }
    if (!motivo)            { ui.toast('Seleccione el motivo de salida', 'error'); return; }
    if (!retira)            { ui.toast('Ingrese el nombre de quien retira', 'error'); return; }
    if (!cedula)            { ui.toast('Ingrese la cédula/pasaporte de quien retira', 'error'); return; }
    if (!parentesco)        { ui.toast('Seleccione el parentesco/relación', 'error'); return; }

    const btnRegistrar    = document.getElementById('btn-pase');
    btnRegistrar.disabled  = true;
    btnRegistrar.innerText = 'Registrando...';

    const res = await api.guardarPase({
        tipo: 'pase', idEstudiante: idEst, motivo, detalle,
        horaSalida: hora, parentesco, autorizadoPor: autoriza,
        cedulaRetira: cedula, nombreRetira: retira,
    });

    btnRegistrar.disabled  = false;
    btnRegistrar.innerText = 'REGISTRAR PASE';

    if (!res?.success) { ui.toast(res?.msg || 'Error al guardar el pase', 'error'); return; }

    const paseId = res.id;
    const conf   = document.getElementById('p-confirmacion');
    conf.style.display = 'block';
    conf.innerText = `✅ Pase N° ${String(paseId).padStart(6,'0')} registrado correctamente.`;

    const btnPdf = document.getElementById('btn-descargar-pdf');
    btnPdf.style.display = 'inline-block';
    btnPdf.onclick = () => descargarPdf(paseId);
    ui.toast('Pase registrado. Ya puede descargar el PDF.');
}

async function descargarPdf(paseId) {
    const btn     = document.getElementById('btn-descargar-pdf');
    btn.disabled  = true;
    btn.innerText = 'Generando PDF...';
    const blob    = await api.getPasePdf(paseId);
    btn.disabled  = false;
    btn.innerText = '⬇ DESCARGAR PDF';
    if (!blob) { ui.toast('Error al generar el PDF', 'error'); return; }
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `pase-${String(paseId).padStart(6,'0')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}

async function buscarHorario() {
    const id  = document.getElementById('o-hor-id').value;
    const div = document.getElementById('o-hor-res');
    div.innerHTML = 'Cargando...';
    const res = await api.getHorario(id, 'curso');
    if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
    else div.innerHTML = '<p>No se encontró horario para ese ID.</p>';
}

async function guardarExcusa() {
    const fInicio = document.getElementById('e-ini').value;
    const fFin    = document.getElementById('e-fin').value;
    if (new Date(fInicio) > new Date(fFin)) {
        ui.toast('La fecha de inicio no puede ser mayor a la fecha fin', 'error');
        return;
    }
    const user = store.get('user');
    const res  = await api.guardarExcusa({
        tipo:          'excusa',
        idEstudiante:  document.getElementById('e-id').value,
        fInicio, fFin,
        motivo:        document.getElementById('e-mot').value,
        autorizadoPor: user.nombreCompleto || user.nombre,
    });
    res?.success ? ui.toast('Excusa guardada') : ui.toast('Error al guardar', 'error');
}
