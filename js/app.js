// ============================================
// ARVET - APP PRINCIPAL
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxI61wDYAFqFr5y5pjHTRDPWxMNbxUVntK9xRqJoagelKPRYgcoW7n4BnMFM6-Vz5Zv/exec'; 

// ============================================
// UTILIDADES
// ============================================

async function fetchAPI(action, params = {}) {
    const queryParams = new URLSearchParams({ action, ...params });
    const response = await fetch(`${API_URL}?${queryParams}`);
    return await response.json();
}

async function postAPI(action, data) {
    const response = await fetch(`${API_URL}?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return await response.json();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return {
        dia: date.getDate(),
        mes: date.toLocaleDateString('es-ES', { month: 'short' }),
        completa: date.toLocaleDateString('es-ES')
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos según la página
    if (document.getElementById('paisesGrid')) {
        cargarPaises();
    }
    if (document.getElementById('partidosList')) {
        cargarProximosPartidos();
    }
});

// ============================================
// PAÍSES
// ============================================

async function cargarPaises() {
    const container = document.getElementById('paisesGrid');
    try {
        const response = await fetchAPI('getPaises');
        if (response.success) {
            container.innerHTML = response.data.map(pais => `
                <div class="pais-card" onclick="filtrarPorPais('${pais.id}')">
                    <div class="pais-flag">${pais.flag || '🏳️'}</div>
                    <h3>${pais.nombre}</h3>
                    <p>${pais.cantidadEquipos || 0} equipos</p>
                </div>
            `).join('');
        }
    } catch (error) {
        container.innerHTML = '<p>Error al cargar países</p>';
    }
}

// ============================================
// BÚSQUEDA
// ============================================

async function buscarEquipos() {
    const termino = document.getElementById('searchInput').value;
    const container = document.getElementById('searchResults');
    
    if (!termino) return;
    
    container.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const response = await fetchAPI('buscar', { termino });
        if (response.success && response.data.equipos.length > 0) {
            container.innerHTML = response.data.equipos.map(equipo => `
                <div class="card" onclick="window.location.href='equipo.html?slug=${equipo.slug}'">
                    <h3>${equipo.nombre}</h3>
                    <p>Ver perfil del equipo →</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No se encontraron equipos</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Error en la búsqueda</p>';
    }
}

// ============================================
// PRÓXIMOS PARTIDOS
// ============================================

async function cargarProximosPartidos() {
    const container = document.getElementById('partidosList');
    try {
        const response = await fetchAPI('getProximosPartidos');
        if (response.success) {
            container.innerHTML = response.data.map(partido => {
                const fecha = formatDate(partido.fecha);
                return `
                    <div class="partido-card">
                        <div class="partido-info">
                            <h3>vs ${partido.rival}</h3>
                            <div class="partido-meta">
                                <span>📍 ${partido.lugar}</span>
                                <span>🕐 ${partido.hora}</span>
                                <span>💵 ${formatCurrency(partido.precioJugador)}</span>
                            </div>
                        </div>
                        <div class="partido-fecha">
                            <div class="dia">${fecha.dia}</div>
                            <div class="mes">${fecha.mes}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        container.innerHTML = '<p>Error al cargar partidos</p>';
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await postAPI('login', { email, password });
        if (response.success) {
            localStorage.setItem('user', JSON.stringify(response.user));
            window.location.href = 'admin.html';
        } else {
            alert('Credenciales incorrectas');
        }
    } catch (error) {
        alert('Error al iniciar sesión');
    }
}

function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
    }
    return JSON.parse(user);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
