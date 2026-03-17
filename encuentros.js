console.log('encuentros.js cargado correctamente');
window.testCarga = true;
// ============================================
// ARVET - SISTEMA DE ENCUENTROS/PARTIDOS
// ============================================

// Estado global
let encuentrosData = {
    misEncuentros: [],
    invitaciones: [],
    encuentroActivo: null
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del localStorage o API
    cargarEncuentros();

    // Escuchar cambios de pestaña
    window.addEventListener('encuentrosTabChange', function(e) {
        if (e.detail === 'invitaciones') {
            cargarInvitaciones();
        }
    });
});

// ============================================
// NAVEGACIÓN DE TABS
// ============================================

function showEncuentrosTab(tab) {
    // Actualizar botones
    document.querySelectorAll('.encuentros-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#e2e8f0';
        btn.style.color = '#64748b';
    });

    const btnActivo = document.getElementById(`tabBtn${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    btnActivo.classList.add('active');
    btnActivo.style.background = '#4f46e5';
    btnActivo.style.color = 'white';

    // Mostrar contenido
    document.querySelectorAll('#encuentros .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`tab-${tab}`).style.display = 'block';

    // Cargar datos según tab
    if (tab === 'creados') {
        renderizarMisEncuentros();
    } else {
        renderizarInvitaciones();
    }
}

// ============================================
// MODAL VACÍO (para extender después)
// ============================================

function nuevoEncuentro() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'modalEncuentro';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Crear Nuevo Encuentro</h2>
                <button class="btn-cerrar" onclick="cerrarModalEncuentro()">×</button>
            </div>
            <div class="modal-body" style="padding: 40px; text-align: center; color: #64748b;">
                <p>Modal vacío - listo para implementar</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function cerrarModalEncuentro() {
    const modal = document.getElementById('modalEncuentro');
    if (modal) modal.remove();
}

// ============================================
// RENDERIZAR MIS ENCUENTROS
// ============================================

function renderizarMisEncuentros() {
    const container = document.getElementById('listaMisEncuentros');
    const empty = document.getElementById('emptyCreados');

    const usuario = obtenerUsuarioActual();
    const encuentros = JSON.parse(localStorage.getItem('arvet_encuentros') || '[]')
        .filter(e => e.creadorId === usuario.id)
        .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

    if (encuentros.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    container.innerHTML = encuentros.map(enc => {
        const nivelClass = `nivel-${enc.nivel}`;
        const estadoClass = `estado-${enc.estado}`;

        const equiposConfirmados = enc.equipos ? enc.equipos.length : 0;
        const plazasLibres = enc.cupoMaximo - equiposConfirmados;

        return `
            <div class="encuentro-card">
                <div class="encuentro-header">
                    <div>
                        <div class="encuentro-titulo">${enc.nombre}</div>
                        <span class="nivel-tag ${nivelClass}">${enc.nivel}</span>
                        <span class="encuentro-estado ${estadoClass}">${enc.estado}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: #4f46e5;">
                            ${equiposConfirmados}/${enc.cupoMaximo}
                        </div>
                        <div style="font-size: 0.8rem; color: #64748b;">
                            ${plazasLibres > 0 ? plazasLibres + ' plaza' + (plazasLibres > 1 ? 's' : '') + ' libre' + (plazasLibres > 1 ? 's' : '') : 'Completo'}
                        </div>
                    </div>
                </div>

                <div class="encuentro-meta">
                    <span>📅 ${formatearFecha(enc.fecha)} ${enc.hora ? '• ' + enc.hora + 'hs' : ''}</span>
                    <span>📍 ${enc.lugar}</span>
                    <span>🏉 ${enc.tipo} ${enc.formato}</span>
                    ${enc.costo > 0 ? `<span>💰 $${enc.costo} por equipo</span>` : ''}
                </div>

                ${enc.descripcion ? `<p style="color: #64748b; margin-bottom: 15px;">${enc.descripcion}</p>` : ''}

                ${renderizarEquiposParticipantes(enc)}

                ${renderizarDocumentacionRequerida(enc)}

                <div class="acciones-encuentro">
                    <button onclick="verDetalleEncuentro('${enc.id}')" class="btn-ver">
                        Ver detalle
                    </button>
                    <button onclick="editarEncuentro('${enc.id}')" class="btn-editar">
                        Editar
                    </button>
                    ${enc.estado !== 'cancelado' ? `
                        <button onclick="cancelarEncuentro('${enc.id}')" class="btn-rechazar">
                            Cancelar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderizarEquiposParticipantes(enc) {
    if (!enc.equipos || enc.equipos.length === 0) {
        return '<p style="color: #94a3b8; font-style: italic;">Sin equipos confirmados todavía</p>';
    }

    const equiposHTML = enc.equipos.map(eq => `
        <div class="equipo-item">
            <div>
                <div class="equipo-nombre">${eq.nombre}</div>
                <div style="font-size: 0.8rem; color: #64748b;">
                    ${eq.jugadoresConfirmados || 0} jugadores confirmados
                </div>
            </div>
            <span class="equipo-estado aceptado">Confirmado</span>
        </div>
    `).join('');

    return `
        <div class="equipos-participantes">
            <h4 style="margin-top: 0; color: #374151;">Equipos confirmados</h4>
            ${equiposHTML}
        </div>
    `;
}

function renderizarDocumentacionRequerida(enc) {
    const docs = [];
    if (enc.documentacion?.aptoMedico) docs.push('Apto médico');
    if (enc.documentacion?.fichaMedica) docs.push('Ficha médica federativa');
    if (enc.documentacion?.dni) docs.push('DNI');
    if (enc.documentacion?.fichaInscripcion) docs.push('Ficha de inscripción');
    if (enc.documentacion?.formularioAdicional) docs.push('Formulario adicional');

    if (docs.length === 0) return '';

    return `
        <div class="documentacion-requerida">
            <h4 style="margin-top: 0; color: #92400e;">📋 Documentación obligatoria</h4>
            <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                ${docs.map(d => `<li>${d}</li>`).join('')}
            </ul>
        </div>
    `;
}

// ============================================
// RENDERIZAR INVITACIONES RECIBIDAS
// ============================================

function renderizarInvitaciones() {
    const container = document.getElementById('listaInvitaciones');
    const empty = document.getElementById('emptyInvitaciones');
    const badge = document.getElementById('badgeInvitaciones');

    const usuario = obtenerUsuarioActual();

    // Obtener invitaciones para este equipo
    const invitaciones = JSON.parse(localStorage.getItem('arvet_invitaciones') || '[]')
        .filter(i => i.equipoId === usuario.id && i.estado === 'pendiente')
        .sort((a, b) => new Date(b.fechaEnvio) - new Date(a.fechaEnvio));

    // Actualizar badge
    if (invitaciones.length > 0) {
        badge.textContent = invitaciones.length;
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }

    if (invitaciones.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    container.innerHTML = invitaciones.map(inv => {
        const encuentro = obtenerEncuentroPorId(inv.encuentroId);
        if (!encuentro) return '';

        const nivelClass = `nivel-${encuentro.nivel}`;

        return `
            <div class="encuentro-card invitacion-pendiente">
                <div class="encuentro-header">
                    <div>
                        <div class="encuentro-titulo">${encuentro.nombre}</div>
                        <span class="nivel-tag ${nivelClass}">${encuentro.nivel}</span>
                        <span class="encuentro-estado estado-borrador">Invitación pendiente</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; color: #64748b;">
                            De: <strong>${encuentro.creadorNombre}</strong>
                        </div>
                    </div>
                </div>

                <div class="encuentro-meta">
                    <span>📅 ${formatearFecha(encuentro.fecha)} ${encuentro.hora ? '• ' + encuentro.hora + 'hs' : ''}</span>
                    <span>📍 ${encuentro.lugar}</span>
                    <span>🏉 ${encuentro.tipo} ${encuentro.formato}</span>
                </div>

                ${encuentro.descripcion ? `<p style="color: #64748b; margin-bottom: 15px;">${encuentro.descripcion}</p>` : ''}

                ${renderizarDocumentacionRequerida(encuentro)}

                <div class="acciones-encuentro">
                    <button onclick="aceptarInvitacion('${inv.id}')" class="btn-aceptar">
                        Aceptar invitación
                    </button>
                    <button onclick="rechazarInvitacion('${inv.id}')" class="btn-rechazar">
                        Rechazar
                    </button>
                    <button onclick="verDetalleEncuentro('${encuentro.id}')" class="btn-ver">
                        Ver más
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ACCIONES DE INVITACIONES
// ============================================

function aceptarInvitacion(invitacionId) {
    const invitaciones = JSON.parse(localStorage.getItem('arvet_invitaciones') || '[]');
    const invIndex = invitaciones.findIndex(i => i.id === invitacionId);

    if (invIndex === -1) return;

    const invitacion = invitaciones[invIndex];
    invitacion.estado = 'aceptada';
    invitacion.fechaRespuesta = new Date().toISOString();

    localStorage.setItem('arvet_invitaciones', JSON.stringify(invitaciones));

    // Agregar equipo al encuentro
    const encuentros = JSON.parse(localStorage.getItem('arvet_encuentros') || '[]');
    const encIndex = encuentros.findIndex(e => e.id === invitacion.encuentroId);

    if (encIndex !== -1) {
        const usuario = obtenerUsuarioActual();
        encuentros[encIndex].equipos.push({
            id: usuario.id,
            nombre: usuario.equipoNombre,
            fechaAceptacion: new Date().toISOString(),
            jugadoresConfirmados: 0,
            jugadores: []
        });

        // Sacar de invitaciones pendientes
        encuentros[encIndex].invitacionesPendientes = encuentros[encIndex].invitacionesPendientes
            .filter(id => id !== usuario.id);

        localStorage.setItem('arvet_encuentros', JSON.stringify(encuentros));

        // Notificar a jugadores del equipo
        notificarJugadoresDeEquipo(encuentros[encIndex]);
    }

    mostrarMensaje('Invitación aceptada. Se notificó a tu plantel.', 'success');
    renderizarInvitaciones();
}

function rechazarInvitacion(invitacionId) {
    if (!confirm('¿Seguro que querés rechazar esta invitación?')) return;

    const invitaciones = JSON.parse(localStorage.getItem('arvet_invitaciones') || '[]');
    const invIndex = invitaciones.findIndex(i => i.id === invitacionId);

    if (invIndex === -1) return;

    invitaciones[invIndex].estado = 'rechazada';
    invitaciones[invIndex].fechaRespuesta = new Date().toISOString();

    localStorage.setItem('arvet_invitaciones', JSON.stringify(invitaciones));

    mostrarMensaje('Invitación rechazada', 'info');
    renderizarInvitaciones();
}

function notificarJugadoresDeEquipo(encuentro) {
    // Simulación: agregar notificación a cada jugador del equipo
    const jugadores = JSON.parse(localStorage.getItem('arvet_jugadores') || '[]')
        .filter(j => j.equipoId === obtenerUsuarioActual().id);

    const notificaciones = jugadores.map(j => ({
        id: 'not_' + Date.now() + '_' + j.id,
        jugadorId: j.id,
        tipo: 'nuevo_encuentro',
        titulo: 'Nuevo encuentro confirmado',
        mensaje: `El equipo se sumó a: ${encuentro.nombre}`,
        encuentroId: encuentro.id,
        fecha: new Date().toISOString(),
        leida: false
    }));

    let todasNotis = JSON.parse(localStorage.getItem('arvet_notificaciones') || '[]');
    todasNotis = todasNotis.concat(notificaciones);
    localStorage.setItem('arvet_notificaciones', JSON.stringify(todasNotis));
}

// ============================================
// EDICIÓN Y CANCELACIÓN
// ============================================

function editarEncuentro(encuentroId) {
    const encuentro = obtenerEncuentroPorId(encuentroId);
    if (!encuentro) return;

    // Solo el creador puede editar
    const usuario = obtenerUsuarioActual();
    if (encuentro.creadorId !== usuario.id) {
        mostrarMensaje('Solo el creador puede editar este encuentro', 'error');
        return;
    }

    // No se puede editar si ya hay equipos confirmados (solo cancelar)
    if (encuentro.equipos && encuentro.equipos.length > 0) {
        mostrarMensaje('No se puede editar: ya hay equipos confirmados', 'error');
        return;
    }

    // TODO: Implementar modal de edición
    mostrarMensaje('Función de edición en desarrollo', 'info');
}

function cancelarEncuentro(encuentroId) {
    const encuentro = obtenerEncuentroPorId(encuentroId);
    if (!encuentro) return;

    const usuario = obtenerUsuarioActual();
    if (encuentro.creadorId !== usuario.id) {
        mostrarMensaje('Solo el creador puede cancelar', 'error');
        return;
    }

    if (!confirm('¿Seguro que querés cancelar este encuentro? Se notificará a todos los equipos invitados.')) {
        return;
    }

    encuentro.estado = 'cancelado';
    actualizarEncuentro(encuentro);

    // Notificar a equipos invitados
    // TODO: Implementar notificación

    mostrarMensaje('Encuentro cancelado', 'info');
    renderizarMisEncuentros();
}

function verDetalleEncuentro(encuentroId) {
    const encuentro = obtenerEncuentroPorId(encuentroId);
    if (!encuentro) return;

    // TODO: Implementar vista detallada
    mostrarMensaje('Vista detallada en desarrollo', 'info');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function obtenerUsuarioActual() {
    // Simulación - en producción viene del login/token
    const usuarioDefault = {
        "id": "usr_123",
        "nombre": "Admin",
        "equipoId": "eq_tigres",
        "equipoNombre": "Tigres RC",
        "rol": "admin"
    };

    const stored = localStorage.getItem('arvet_usuario');
    return stored ? JSON.parse(stored) : usuarioDefault;
}

function obtenerEncuentroPorId(id) {
    const encuentros = JSON.parse(localStorage.getItem('arvet_encuentros') || '[]');
    return encuentros.find(e => e.id === id);
}

function actualizarEncuentro(encuentro) {
    const encuentros = JSON.parse(localStorage.getItem('arvet_encuentros') || '[]');
    const index = encuentros.findIndex(e => e.id === encuentro.id);
    if (index !== -1) {
        encuentros[index] = encuentro;
        localStorage.setItem('arvet_encuentros', JSON.stringify(encuentros));
    }
}

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

function mostrarMensaje(texto, tipo = 'info') {
    // Usar tu sistema de mensajes existente
    const overlay = document.getElementById('msgOverlay');
    const msg = document.getElementById('msgConfig');

    if (overlay && msg) {
        msg.textContent = texto;
        msg.className = 'message ' + tipo;
        overlay.style.display = 'flex';

        setTimeout(() => {
            overlay.style.display = 'none';
        }, 3000);
    }
}

function cargarEncuentros() {
    renderizarMisEncuentros();
}

function cargarInvitaciones() {
    renderizarInvitaciones();
}
