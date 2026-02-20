// ============================================
// ARVET - MÓDULO CUOTAS
// ============================================

async function cargarCuotasAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
        // Obtener todos los jugadores del equipo
        const jugadoresRes = await fetchAPI('getJugadores', { equipoId: user.equipoId });
        if (!jugadoresRes.success) return;
        
        const jugadores = jugadoresRes.data;
        let todasLasCuotas = [];
        
        // Obtener cuotas de cada jugador
        for (let jugador of jugadores) {
            const cuotasRes = await fetchAPI('getCuotas', { jugadorId: jugador.id });
            if (cuotasRes.success) {
                const cuotasConNombre = cuotasRes.data.map(c => ({
                    ...c,
                    nombreJugador: `${jugador.nombre} ${jugador.apellido}`
                }));
                todasLasCuotas = todasLasCuotas.concat(cuotasConNombre);
            }
        }
        
        const tbody = document.querySelector('#tablaCuotas tbody');
        tbody.innerHTML = todasLasCuotas.map(c => `
            <tr>
                <td>${c.nombreJugador}</td>
                <td>${c.tipo}</td>
                <td>${c.mes}/${c.anio}</td>
                <td>${formatCurrency(c.monto)}</td>
                <td>
                    <span class="badge ${c.estado === 'Pagó' ? 'badge-success' : 'badge-warning'}">
                        ${c.estado}
                    </span>
                </td>
                <td>
                    ${c.estado === 'Pendiente' ? 
                        `<button class="btn-action btn-pay" onclick="registrarPagoCuota('${c.id}', ${c.monto})">Registrar Pago</button>` :
                        '<span>Pagado ✓</span>'
                    }
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error(error);
    }
}

async function registrarPagoCuota(cuotaId, monto) {
    const confirmar = confirm(`¿Confirmar pago de ${formatCurrency(monto)}?`);
    if (!confirmar) return;
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        const response = await postAPI('registrarPagoCuota', {
            cuotaId,
            fechaPago: new Date().toISOString(),
            metodoPago: 'Efectivo',
            registradoPor: user.id
        });
        
        if (response.success) {
            alert('Pago registrado correctamente');
            cargarCuotasAdmin();
        }
    } catch (error) {
        alert('Error al registrar pago');
    }
}

function calcularDeudaTotal(cuotas) {
    return cuotas
        .filter(c => c.estado === 'Pendiente')
        .reduce((total, c) => total + parseFloat(c.monto), 0);
}
