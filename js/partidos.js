// ============================================
// ARVET - MÓDULO PARTIDOS
// ============================================

async function cargarPartidosAdmin() {

    const user = JSON.parse(localStorage.getItem('arvet_user'));
    if (!user || !user.equipoId) {
        console.log('Usuario no autenticado');
        return;
    }

    try {
        const response = await fetchAPI('getPartidos', { equipoId: user.equipoId });

        if (response.success) {
            const tbody = document.querySelector('#tablaPartidos tbody');
            tbody.innerHTML = response.data.map(p => {
                const fecha = formatDate(p.fecha);
                return `
                    <tr>
                        <td>${fecha.completa}</td>
                        <td>${p.rival}</td>
                        <td>${p.lugar}</td>
                        <td>${formatCurrency(p.precioJugador)}</td>
                        <td><span class="badge badge-warning">${p.estado}</span></td>
                        <td>
                            <button class="btn-action btn-edit" onclick="gestionarPartido('${p.id}')">Gestionar</button>
                            <button class="btn-action btn-pay" onclick="verConvocados('${p.id}')">Convocados</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (error) {
        console.error(error);
    }
}

function nuevoPartido() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Nuevo Partido</h2>
            <form onsubmit="crearPartido(event)">
                <div class="form-group">
                    <label>Rival</label>
                    <input type="text" id="rival" required>
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="fechaPartido" required>
                </div>
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" id="horaPartido" required>
                </div>
                <div class="form-group">
                    <label>Lugar</label>
                    <input type="text" id="lugar" required>
                </div>
                <div class="form-group">
                    <label>Precio por jugador</label>
                    <input type="number" id="precioJugador" required>
                </div>
                <button type="submit" class="btn-full">Crear Partido</button>
                <button type="button" onclick="this.closest('.modal').remove()" class="btn-secondary">Cancelar</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function crearPartido(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('arvet_user'));
if (!user || !user.equipoId) return;
    
    const data = {
        equipoId: user.equipoId,
        rival: document.getElementById('rival').value,
        fecha: document.getElementById('fechaPartido').value,
        hora: document.getElementById('horaPartido').value,
        lugar: document.getElementById('lugar').value,
        precioJugador: parseFloat(document.getElementById('precioJugador').value)
    };
    
    try {
        const response = await postAPI('crearPartido', data);
        if (response.success) {
            alert('Partido creado correctamente');
            location.reload();
        }
    } catch (error) {
        alert('Error al crear partido');
    }
}

async function verConvocados(partidoId) {
    try {
        const response = await fetchAPI('getConvocados', { partidoId });
        if (response.success) {
            const modal = document.createElement('div');
            modal.className = 'modal';
            
            const totalJugadores = response.data.length;
            const pagaron = response.data.filter(c => c.estadoPago === 'Pagó').length;
            const totalRecaudado = pagaron * 1000; // Aquí deberías calcular el precio real
            
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <h2>Lista de Convocados</h2>
                    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                        <div class="stat-card">
                            <small>Total Jugadores</small>
                            <div class="stat-value">${totalJugadores}</div>
                        </div>
                        <div class="stat-card">
                            <small>Pagaron</small>
                            <div class="stat-value text-success">${pagaron}</div>
                        </div>
                        <div class="stat-card">
                            <small>Recaudado</small>
                            <div class="stat-value">${formatCurrency(totalRecaudado)}</div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Jugador</th>
                                <th>Estado Pago</th>
                                <th>Asistencia</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${response.data.map(c => `
                                <tr>
                                    <td>#${c.numeroCamiseta} ${c.nombreJugador}</td>
                                    <td>
                                        <span class="badge ${c.estadoPago === 'Pagó' ? 'badge-success' : 'badge-danger'}">
                                            ${c.estadoPago}
                                        </span>
                                    </td>
                                    <td>${c.asistencia}</td>
                                    <td>
                                        ${c.estadoPago === 'Pendiente' ? 
                                            `<button class="btn-action btn-pay" onclick="registrarPagoPartido('${c.id}', '${partidoId}', '${c.jugadorId}')">Registrar Pago</button>` : 
                                            '<span>Pagado ✓</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">Cerrar</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error(error);
    }
}

async function registrarPagoPartido(convocadoId, partidoId, jugadorId) {
    const monto = prompt('Ingrese el monto pagado:');
    if (!monto) return;
    
    const user = JSON.parse(localStorage.getItem('arvet_user'));
if (!user || !user.id) return;
    
    try {
        const response = await postAPI('registrarPagoPartido', {
            convocadoId,
            partidoId,
            jugadorId,
            monto: parseFloat(monto),
            metodoPago: 'Efectivo',
            registradoPor: user.id
        });
        
        if (response.success) {
            alert('Pago registrado correctamente');
            location.reload();
        }
    } catch (error) {
        alert('Error al registrar pago');
    }
}
