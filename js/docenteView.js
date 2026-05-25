// js/docenteView.js — Vistas y lógica del rol Docente
import { store } from './store.js';
import * as api  from './api.js';
import * as ui   from './ui.js';

export async function loadDocenteView(view, { setActiveNav, on }) {
    setActiveNav(view);
    const content = document.getElementById('content-area');
    content.innerHTML = '<p>Cargando...</p>';

    const user      = store.get('user');
    const cursosOpts = (user.cursos?.length)
        ? user.cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')
        : '';

    if (view === 'asistencia') {
        const hoy = new Date().toISOString().split('T')[0];
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Lista Diario</h3>
                <div class="grid">
                    <select id="d-curso">
                        <option value="">-- Seleccione Curso --</option>${cursosOpts}
                    </select>
                    <div>
                        <label style="display:block;font-size:0.8rem;margin-bottom:5px">Fecha</label>
                        <input type="date" id="d-fecha" value="${hoy}">
                    </div>
                </div>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso', 'change', e => cargarAlumnos(e.target.value, 'asist'));

    } else if (view === 'calificaciones') {
        content.innerHTML = `
            <div class="card">
                <h3>Registro de Calificaciones</h3>
                <select id="d-curso">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso', 'change', e => cargarAlumnos(e.target.value, 'notas'));

    } else if (view === 'reportes') {
        content.innerHTML = `
            <div class="card" style="border-left:5px solid var(--danger)">
                <h3 style="color:var(--danger)">Reporte de Conducta</h3>
                <select id="d-curso">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso', 'change', e => cargarAlumnos(e.target.value, 'repo'));

    } else if (view === 'excusas') {
        content.innerHTML = `
            <div class="card">
                <h3>Excusas y Justificaciones</h3>
                <select id="d-curso-exc">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso-exc', 'change', e => cargarExcusas(e.target.value));

    } else if (view === 'listados') {
        content.innerHTML = `
            <div class="card">
                <h3>Listados Oficiales</h3>
                <select id="d-curso-list">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso-list', 'change', e => cargarAlumnos(e.target.value, 'lista'));

    } else if (view === 'historial') {
        const meses     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const mesActual = new Date().getMonth();
        content.innerHTML = `
            <div class="card">
                <h3>Historial Mensual de Asistencia</h3>
                <div class="grid">
                    <select id="h-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <select id="h-mes">${meses.map((m, i) => `<option value="${i}"${i === mesActual ? ' selected' : ''}>${m}</option>`).join('')}</select>
                    <input type="number" id="h-anio" value="${new Date().getFullYear()}" placeholder="Año">
                </div>
                <button id="btn-historial" class="btn-primary">GENERAR REPORTE</button>
                <div id="d-area" style="margin-top:20px;overflow-x:auto;"></div>
            </div>`;
        on('btn-historial', 'click', generarHistorial);

    } else if (view === 'reporteNotas') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta de Calificaciones</h3>
                <div class="grid">
                    <select id="rn-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <input id="rn-periodo" placeholder="Periodo (Ej: P1)">
                    <input id="rn-filtro" placeholder="Filtrar Actividad (Opcional)">
                </div>
                <button id="btn-reporte-notas" class="btn-primary">CONSULTAR</button>
                <div id="d-area" style="margin-top:20px;overflow-x:auto;"></div>
            </div>`;
        on('btn-reporte-notas', 'click', generarReporteNotas);

    } else if (view === 'tareas') {
        content.innerHTML = `
            <div class="card">
                <h3>Blackboard — Asignar Tarea</h3>
                <select id="d-curso">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <input id="t-titulo" placeholder="Título de la Tarea">
                <textarea id="t-desc" placeholder="Descripción..." rows="3"></textarea>
                <div class="grid">
                    <div><label>Fecha Límite</label><input type="date" id="t-fecha"></div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <input type="checkbox" id="t-check" style="width:auto;margin:0">
                        <label style="margin:0">Completada en Aula</label>
                    </div>
                </div>
                <button id="btn-publicar-tarea" class="btn-primary">PUBLICAR TAREA</button>
                <div id="t-lista" style="margin-top:30px;border-top:1px solid #eee;padding-top:20px;"></div>
            </div>`;
        on('d-curso',            'change', e => cargarTareas(e.target.value));
        on('btn-publicar-tarea', 'click',  () => guardar('tarea', document.getElementById('d-curso').value));

    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));

    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Mi Horario</h3><div id="d-horario">Cargando...</div></div>`;
        const res = await api.getHorario(store.get('user').id, 'docente');
        const div = document.getElementById('d-horario');
        if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
        else div.innerHTML = 'No hay horario disponible.';
    }
}

async function cargarAlumnos(idCurso, modo) {
    if (!idCurso) return;
    const div  = document.getElementById('d-area');
    const user = store.get('user');
    div.innerHTML = 'Cargando lista...';
    const data = await api.getAlumnos(idCurso);

    if (!data || !Array.isArray(data) || data.length === 0) {
        div.innerHTML = '<p>No hay alumnos en este curso.</p>';
        return;
    }

    if (modo === 'asist') {
        div.innerHTML = ui.renderTablaAsistencia(data);
        const btn = document.createElement('button');
        btn.className       = 'btn-primary';
        btn.style.marginTop = '20px';
        btn.innerText       = 'GUARDAR';
        btn.addEventListener('click', () => guardar('asistencia', idCurso));
        div.appendChild(btn);

    } else if (modo === 'notas') {
        div.innerHTML = `
            <div class="grid" style="margin-bottom:15px;align-items:end;">
                <div><label>Actividad</label><input id="d-act" placeholder="Ej: Examen Parcial" style="margin-bottom:0"></div>
                <div><label>Puntos Máx.</label><input id="d-max" type="number" placeholder="100" style="margin-bottom:0"></div>
                <div><label>Periodo / RA</label><input id="d-corte" placeholder="Ej: P1, RA1" style="margin-bottom:0"></div>
            </div>
            ${ui.renderTablaNotas(data)}`;
        const btn = document.createElement('button');
        btn.className       = 'btn-primary';
        btn.style.marginTop = '20px';
        btn.innerText       = 'GUARDAR NOTAS';
        btn.addEventListener('click', () => guardar('notas', idCurso));
        div.appendChild(btn);

    } else if (modo === 'repo') {
        div.innerHTML = `
            <label>Estudiante</label>
            <select id="d-est">${data.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}</select>
            <label>Tipo</label>
            <select id="d-tipo"><option>Leve</option><option>Grave</option></select>
            <label>Descripción</label>
            <textarea id="d-desc" rows="3" maxlength="500"></textarea>`;
        const btn = document.createElement('button');
        btn.className = 'btn-danger';
        btn.innerText = 'ENVIAR REPORTE';
        btn.addEventListener('click', () => guardar('reporte', idCurso));
        div.appendChild(btn);

    } else if (modo === 'lista') {
        div.innerHTML = ui.renderListado(data);
    }
}

async function guardar(tipo, idCurso) {
    const user       = store.get('user');
    const cursoObj   = user.cursos?.find(c => c.id == idCurso);
    const nombreAsig = cursoObj?.modulo || cursoObj?.materia || '';

    if (tipo === 'asistencia') {
        const fecha   = document.getElementById('d-fecha').value;
        const payload = [];
        document.querySelectorAll('.d-row').forEach(r => {
            payload.push({ idEstudiante: r.dataset.id, idCurso, materia: nombreAsig, estado: r.querySelector('.d-val').value, fecha });
        });
        const res = await api.guardarAsistencia(payload);
        res?.success ? ui.toast('Asistencia guardada') : ui.toast(res?.msg || 'Error al guardar', 'error');

    } else if (tipo === 'notas') {
        const act   = document.getElementById('d-act').value;
        const max   = document.getElementById('d-max').value;
        const corte = document.getElementById('d-corte').value;
        if (!act || !max || !corte) { ui.toast('Complete: Actividad, Puntos Máx. y Periodo/RA', 'error'); return; }
        const payload = [];
        document.querySelectorAll('.d-row').forEach(r => {
            const val = r.querySelector('.d-val').value;
            if (val) payload.push({ idEstudiante: r.dataset.id, idCurso, modulo: nombreAsig, actividad: act, nota: val, maximo: max, periodo: corte });
        });
        if (!payload.length) { ui.toast('No hay notas ingresadas', 'error'); return; }
        const res = await api.guardarMasivo(payload);
        res?.success ? ui.toast('Notas guardadas') : ui.toast(res?.msg || 'Error al guardar', 'error');

    } else if (tipo === 'reporte') {
        const d = {
            idEstudiante: document.getElementById('d-est').value,
            idCurso,
            tipo:         document.getElementById('d-tipo').value,
            descripcion:  document.getElementById('d-desc').value,
        };
        const res = await api.guardarReporte({ datos: d });
        res?.success ? ui.toast('Reporte enviado') : ui.toast('Error al enviar', 'error');

    } else if (tipo === 'tarea') {
        if (!idCurso) { ui.toast('Seleccione un curso', 'error'); return; }
        const payload = {
            idCurso,
            titulo:      document.getElementById('t-titulo').value,
            descripcion: document.getElementById('t-desc').value,
            fecha:       document.getElementById('t-fecha').value,
            completada:  document.getElementById('t-check').checked,
        };
        const res = await api.guardarTarea(payload);
        if (res?.success) { ui.toast('Tarea publicada'); loadDocenteView('tareas', { setActiveNav: () => {}, on: (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn) }); }
        else ui.toast('Error al publicar', 'error');
    }
}

async function cargarTareas(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('t-lista');
    div.innerHTML = 'Cargando tareas...';
    const res = await api.getTareasDocente(idCurso);
    if (!res?.success || !res.data.length) {
        div.innerHTML = "<p style='color:var(--text-light)'>No hay tareas para este curso.</p>";
        return;
    }
    div.innerHTML = `
        <h4>Tareas Publicadas</h4>
        <table class="web-table" id="tbl-tareas">
            <thead><tr><th>Título</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>${res.data.map(t => `
                <tr>
                    <td>${t.titulo}</td>
                    <td>${new Date(t.fecha).toLocaleDateString()}</td>
                    <td>${t.completada ? '<span style="color:var(--success)">Completada</span>' : '<span style="color:orange">Pendiente</span>'}</td>
                    <td style="display:flex;gap:6px;">
                        <button data-id="${t.id}" data-accion="toggle" style="width:auto;padding:5px 10px;font-size:0.8rem;">${t.completada ? 'Reabrir' : 'Completar'}</button>
                        <button data-id="${t.id}" data-accion="delete" style="width:auto;padding:5px 10px;font-size:0.8rem;background:var(--danger);color:white;">Eliminar</button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;

    document.getElementById('tbl-tareas').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const { id, accion } = btn.dataset;
        if (!confirm(accion === 'delete' ? '¿Eliminar esta tarea?' : '¿Cambiar estado?')) return;
        await api.manageTarea(id, accion);
        cargarTareas(idCurso);
    });
}

async function cargarExcusas(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = 'Buscando excusas...';
    const res = await api.getExcusas(idCurso);
    if (!res?.success || !res.data?.length) {
        div.innerHTML = "<p style='color:var(--text-light)'>No hay excusas para este curso.</p>";
        return;
    }
    div.innerHTML = ui.renderExcusas(res.data);
}

async function generarHistorial() {
    const curso = document.getElementById('h-curso').value;
    const mes   = document.getElementById('h-mes').value;
    const anio  = document.getElementById('h-anio').value;
    const div   = document.getElementById('d-area');
    if (!curso) { ui.toast('Seleccione un curso', 'error'); return; }
    div.innerHTML = 'Generando reporte...';
    const res = await api.getHistorial(curso, mes, anio);
    if (!res?.success || !res.data.length) { div.innerHTML = 'No hay datos para este periodo.'; return; }
    const diasDelMes = new Date(anio, parseInt(mes) + 1, 0).getDate();
    div.innerHTML = ui.renderHistorial(res.data, diasDelMes);
}

async function generarReporteNotas() {
    const curso   = document.getElementById('rn-curso').value;
    const periodo = document.getElementById('rn-periodo').value;
    const filtro  = document.getElementById('rn-filtro').value;
    const div     = document.getElementById('d-area');
    if (!curso || !periodo) { ui.toast('Seleccione curso y escriba un Periodo/RA', 'error'); return; }
    div.innerHTML = 'Consultando...';
    const res = await api.getReporteNotas(curso, periodo, filtro);
    if (!res?.success || !res.data.length) { div.innerHTML = 'No se encontraron calificaciones.'; return; }
    const estudiantes = {};
    const columnas    = new Set();
    res.data.forEach(r => {
        if (!estudiantes[r.idEstudiante]) estudiantes[r.idEstudiante] = { nombre: r.nombre, notas: {} };
        columnas.add(r.actividad);
        estudiantes[r.idEstudiante].notas[r.actividad] = r.nota;
    });
    const user          = store.get('user');
    const cursoObj      = user.cursos?.find(c => c.id == curso);
    const materiaNombre = cursoObj?.modulo || cursoObj?.materia || '';
    div.innerHTML = ui.renderReporteNotas(estudiantes, Array.from(columnas).sort(), materiaNombre);
}
