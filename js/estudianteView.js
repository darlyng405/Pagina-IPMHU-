// js/estudianteView.js — Vistas y lógica del rol Estudiante
import { store } from './store.js';
import * as api  from './api.js';
import * as ui   from './ui.js';

export async function loadStudentView(view, { setActiveNav }) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));

    } else if (view === 'reportes') {
        await studentRender(api.getStudentReports, content, data => {
            if (!data.length) return '<p>Sin reportes de conducta.</p>';
            let h = `<table class="web-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Docente</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.tipo}</td><td>${r.docente}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'asistencia') {
        await studentRender(api.getStudentAttendance, content, data => {
            const materias = [...new Set(data.map(d => d.materia))];
            let h = `<div class="filter-bar">
                <select onchange="window.ui.filtrarTabla('t-asist',1,this.value)">
                    <option value="">Todas las Materias</option>
                    ${materias.map(m => `<option>${m}</option>`).join('')}
                </select></div>`;
            h += `<table class="web-table" id="t-asist"><thead><tr><th>Fecha</th><th>Materia</th><th>Estado</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.materia}</td><td>${r.estado}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'calificaciones') {
        await studentRender(api.getStudentGradesDetail, content, data => {
            const mods = [...new Set(data.map(d => d.modulo))];
            const pers = [...new Set(data.map(d => d.periodo))];
            let h = `<div class="filter-bar">
                <select onchange="window.ui.filtrarTabla('t-cal',0,this.value)"><option value="">Todos los Módulos</option>${mods.map(m => `<option>${m}</option>`).join('')}</select>
                <select onchange="window.ui.filtrarTabla('t-cal',1,this.value)"><option value="">Todos los Periodos</option>${pers.map(p => `<option>${p}</option>`).join('')}</select>
                <input placeholder="Filtrar Actividad..." onkeyup="window.ui.filtrarTabla('t-cal',2,this.value)">
            </div>`;
            h += `<table class="web-table" id="t-cal"><thead><tr><th>Materia</th><th>Periodo</th><th>Actividad</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.modulo}</td><td>${r.periodo}</td><td>${r.actividad}</td><td>${r.nota}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'rendimiento') {
        await studentRender(api.getStudentGradesRA, content, data => {
            const mods = [...new Set(data.map(d => d.modulo))];
            let h = `<div class="filter-bar"><select onchange="window.ui.filtrarTabla('t-ra',0,this.value)">
                <option value="">Todos los Módulos</option>${mods.map(m => `<option>${m}</option>`).join('')}
            </select></div>`;
            h += `<table class="web-table" id="t-ra"><thead><tr><th>Módulo</th><th>RA</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.modulo}</td><td>${r.ra}</td><td>${r.notaFinal}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'periodos') {
        await studentRender(api.getStudentGradesP, content, data => {
            let h = `<table class="web-table"><thead><tr><th>Materia</th><th>P1</th><th>P2</th><th>P3</th><th>P4</th><th>Final</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.materia}</td><td>${r.p1 ?? '-'}</td><td>${r.p2 ?? '-'}</td><td>${r.p3 ?? '-'}</td><td>${r.p4 ?? '-'}</td><td>${r.pFinal ?? '-'}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'excusas') {
        await studentRender(api.getStudentExcuses, content, data =>
            ui.renderExcusas(data.map(e => ({
                nombre: '',
                desde:  e.fechaInicio || e.fecha_inicio,
                hasta:  e.fechaFin    || e.fecha_fin,
                motivo: e.motivo,
            })))
        );

    } else if (view === 'tareas') {
        await studentRender(api.getTareasEstudiante, content, data => ui.renderTareas(data));

    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Horario de Clases</h3><div id="s-horario">Cargando...</div></div>`;
        const user = store.get('user');
        const res  = await api.getHorario(user.cursoId || user.cursoid, 'curso');
        const div  = document.getElementById('s-horario');
        if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
        else div.innerHTML = 'No hay horario disponible.';
    }
}

async function studentRender(apiFn, container, renderFn) {
    container.innerHTML = '<p>Cargando...</p>';
    const data = await apiFn();
    if (data?.success) {
        container.innerHTML = `<div class="card">${renderFn(data.data)}</div>`;
    } else {
        container.innerHTML = '<p>Error al cargar datos.</p>';
    }
}
