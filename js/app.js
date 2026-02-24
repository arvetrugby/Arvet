// ============================================
// ARVET - APP PRINCIPAL (CONSOLIDADO)
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbw_qbsljjysOdYX46qv8I4ohiRKf-8OzPnK8QdFsjIANKwJ34GYCdHT29zNysuRsslA/exec';

// ============================================
// UTILIDADES GLOBALES
// ============================================

// Exponer funciones globalmente para asegurar disponibilidad
window.API_URL = API_URL;

window.fetchAPI = async function(action, params = {}) {
    const queryParams = new URLSearchParams({ action, ...params });
    const url = `${API_URL}?${queryParams}`;
    console.log('fetchAPI URL:', url);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('fetchAPI respuesta:', data);
        return data;
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
};

window.postAPI = async function(action, data) {
    const response = await fetch(`${API_URL}?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return await response.json();
};

window.formatDate = function(dateString) {
    const date = new Date(dateString);
    return {
        dia: date.getDate(),
        mes: date.toLocaleDateString('es-ES', { month: 'short' }),
        completa: date.toLocaleDateString('es-ES')
    };
};

window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
};

// ============================================
// DETECTOR DE PÁGINA ACTUAL
// ============================================

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const cleanPage = page.replace('.html', '');
    
    // Detectar páginas de equipo tipo /equipoXXX o /equipo-xxx
    if (cleanPage.startsWith('equipo')) {
        return 'equipo';
    }
    
    return cleanPage;
}

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== APP.JS CARGADO ===');
    const page = getCurrentPage();
    console.log('Página detectada:', page);

    // Router de páginas
    switch(page) {
        case 'index':
        case '':
            console.log('Inicializando INDEX');
            initIndex();
            break;
        case 'login':
            console.log('Inicializando LOGIN');
            initLogin();
            break;
        case 'registro':
            console.log('Inicializando REGISTRO');
            initRegistro();
            break;
        case 'equipo':
            console.log('Inicializando EQUIPO');
            initEquipo();
            break;
        case 'admin':
            console.log('Inicializando ADMIN');
            initAdmin();
            break;
        default:
            console.log('Página no reconocida:', page);
    }
});

// ============================================
// PÁGINA: INDEX (Home)
// ============================================

function initIndex() {
    console.log('Ejecutando initIndex');
    if (document.getElementById('paisesGrid')) {
        cargarPaises();
    }
    if (document.getElementById('partidosList')) {
        cargarProximosPartidos();
    }
}

async function cargarPaises() {
    const container = document.getElementById('paisesGrid');
    if (!container) return;
    
    try {
        const response = await window.fetchAPI('getPaises');
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

async function buscarEquipos() {
    const termino = document.getElementById('searchInput').value;
    const container = document.getElementById('searchResults');
    
    if (!termino) return;
    
    container.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const response = await window.fetchAPI('buscar', { termino });
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

async function cargarProximosPartidos() {
    const container = document.getElementById('partidosList');
    if (!container) return;
    
    try {
        const response = await window.fetchAPI('getProximosPartidos');
        if (response.success) {
            container.innerHTML = response.data.map(partido => {
                const fecha = window.formatDate(partido.fecha);
                return `
                    <div class="partido-card">
                        <div class="partido-info">
                            <h3>vs ${partido.rival}</h3>
                            <div class="partido-meta">
                                <span>📍 ${partido.lugar}</span>
                                <span>🕐 ${partido.hora}</span>
                                <span>💵 ${window.formatCurrency(partido.precioJugador)}</span>
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
// PÁGINA: REGISTRO
// ============================================

function initRegistro() {
    const form = document.getElementById("formRegistro");
    const btn = document.getElementById("btnCrear");
    const loading = document.getElementById("loading");
    const msg = document.getElementById("msg");

    if (!form) {
        console.log('Formulario de registro no encontrado');
        return;
    }

    function showMessage(text, type) {
        msg.textContent = text;
        msg.className = "message " + type;
        msg.style.display = "block";
    }

    function setLoading(state) {
        btn.disabled = state;
        loading.style.display = state ? "block" : "none";
    }

    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        setLoading(true);
        msg.style.display = "none";

        const data = {
            nombre: document.getElementById('nombre').value.trim(),
            paisId: document.getElementById('paisId').value.trim(),
            provinciaId: document.getElementById('provinciaId').value.trim(),
            ciudadId: document.getElementById('ciudadId').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            adminNombre: document.getElementById('adminNombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch(
                `${API_URL}?action=crearEquipo` +
                `&nombre=${encodeURIComponent(data.nombre)}` +
                `&paisId=${encodeURIComponent(data.paisId)}` +
                `&provinciaId=${encodeURIComponent(data.provinciaId)}` +
                `&ciudadId=${encodeURIComponent(data.ciudadId)}` +
                `&direccion=${encodeURIComponent(data.direccion)}` +
                `&adminNombre=${encodeURIComponent(data.adminNombre)}` +
                `&email=${encodeURIComponent(data.email)}` +
                `&password=${encodeURIComponent(data.password)}`
            );

            const result = await response.json();

            if (result.success) {
                showMessage("Equipo creado correctamente ✅ Redirigiendo...", "success");
                localStorage.setItem("arvet_user", JSON.stringify(result.data.user));

                setTimeout(() => {
                    window.location.href = "admin.html";
                }, 1500);
            } else {
                showMessage(result.error || "Error al crear equipo", "error");
                setLoading(false);
            }

        } catch (err) {
            showMessage("Error de conexión con el servidor", "error");
            setLoading(false);
        }
    });
}

// ============================================
// PÁGINA: LOGIN
// ============================================

function initLogin() {
    checkExistingSession();

    const form = document.getElementById('loginForm');
    const btnLogin = document.getElementById('btnLogin');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('errorMsg');

    if (!form) {
        console.log('Formulario de login no encontrado');
        return;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    function setLoading(loading) {
        if (loading) {
            btnLogin.disabled = true;
            btnLogin.textContent = 'Verificando...';
            loadingDiv.style.display = 'block';
        } else {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Ingresar';
            loadingDiv.style.display = 'none';
        }
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('Por favor completa todos los campos');
            return;
        }
        
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            );

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (data.success) {
                localStorage.setItem('arvet_user', JSON.stringify(data.user));

                const user = data.user;
                const rolesAdmin = ['Admin', 'Capitán', 'Manager'];

                if (rolesAdmin.includes(user.rol)) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }

            } else {
                showError(data.error || 'Credenciales incorrectas');
                setLoading(false);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            showError('Error de conexión con el servidor');
            setLoading(false);
        }
    });
}

function checkExistingSession() {
    const user = localStorage.getItem('arvet_user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            const rolesAdmin = ['Admin', 'Capitán', 'Manager'];
            if (rolesAdmin.includes(userData.rol)) {
                window.location.href = 'admin.html';
            }
        } catch(e) {
            localStorage.removeItem('arvet_user');
        }
    }
}

// ============================================
// PÁGINA: EQUIPO (PÚBLICO)
// ============================================

function initEquipo() {
    console.log('=== INICIO EQUIPO ===');
    console.log('URL completa:', window.location.href);
    console.log('Search:', window.location.search);
    console.log('Pathname:', window.location.pathname);
    
    let slug = null;
    
    // OPCIÓN 1: URL con ?slug=vvv (formato query string)
    const urlParams = new URLSearchParams(window.location.search);
    slug = urlParams.get('slug');
    console.log('Slug de query params:', slug);
    
    // OPCIÓN 2: URL tipo /equipo332xx (formato pathname)
    if (!slug) {
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s);
        const lastSegment = segments[segments.length - 1];
        
        console.log('Último segmento:', lastSegment);
        slug = lastSegment.replace('.html', '');
        console.log('Slug limpio:', slug);
    }
    
    console.log('Slug final:', slug);
    
    if (!slug || slug === '' || slug === 'equipo') {
        console.error('❌ No se encontró slug válido');
        const header = document.getElementById('equipoHeader');
        if (header) {
            header.innerHTML = '<div class="error">Error: No se pudo identificar el equipo</div>';
        }
        return;
    }
    
    console.log('✅ Slug válido:', slug);
    
    // Verificar que fetchAPI esté disponible
    if (typeof window.fetchAPI !== 'function') {
        console.error('❌ fetchAPI no está disponible');
        return;
    }
    
    cargarEquipo(slug);
}

async function cargarEquipo(slug) {
    console.log('=== cargarEquipo ===');
    console.log('Llamando con slug:', slug);
    
    const header = document.getElementById('equipoHeader');
    const quienesSomos = document.getElementById('quienesSomosContent');
    const comisionGrid = document.getElementById('comisionGrid');
    const plantelGrid = document.getElementById('plantelGrid');
    const partidosList = document.getElementById('partidosEquipoList');
    
    try {
        console.log('Enviando a API: action=getEquipoBySlug, slug=' + slug);
        const response = await window.fetchAPI('getEquipoBySlug', { slug: slug });
        console.log('Respuesta completa:', response);

        if (!response.success) {
            console.error('Error:', response.error);
            if (header) {
                header.innerHTML = `<div class="error">Error: ${response.error}</div>`;
            }
            return;
        }

        const equipo = response.data;
        console.log('Equipo cargado:', equipo);
        console.log('Nombre:', equipo.nombre);
        console.log('Coordenadas:', equipo.lat, equipo.lng);

        // Actualizar UI - Header
        if (header) {
            header.innerHTML = `
                <h1>${equipo.nombre}</h1>
                <p>${equipo.ciudad}, ${equipo.pais}</p>
                <p>${equipo.descripcion || ''}</p>
            `;
        }

        // Actualizar Quienes Somos
        if (quienesSomos) {
            quienesSomos.innerHTML = `
                <p>${equipo.historia || 'Sin información disponible'}</p>
                <p><strong>Fundación:</strong> ${equipo.fechaFundacion || 'N/A'}</p>
                <p><strong>Colores:</strong> ${equipo.colores || 'N/A'}</p>
            `;
        }

        // Cargar datos adicionales si hay ID
        if (equipo.id) {
            console.log('Cargando jugadores y partidos para equipo ID:', equipo.id);
            if (comisionGrid && plantelGrid) {
                await cargarJugadoresEquipo(equipo.id);
            }
            if (partidosList) {
                await cargarPartidosEquipoPublico(equipo.id);
            }
        }

        // Configurar mapa
        if (equipo.lat && equipo.lng) {
            console.log('✅ Tiene coordenadas:', equipo.lat, equipo.lng);
            window.equipoCoords = {
                lat: parseFloat(equipo.lat),
                lng: parseFloat(equipo.lng)
            };
        } else {
            console.log('⚠️ Sin coordenadas, usando default');
            window.equipoCoords = {
                lat: -34.6037,
                lng: -58.3816
            };
        }
        
        // Inicializar mapa solo si existe el contenedor y Leaflet está cargado
        const mapContainer = document.getElementById('map');
        if (mapContainer && typeof L !== 'undefined') {
            console.log('Inicializando mapa...');
            inicializarMapa();
        } else {
            console.log('Mapa no inicializado - contenedor:', !!mapContainer, 'Leaflet:', typeof L !== 'undefined');
        }

    } catch (error) {
        console.error('❌ Error en cargarEquipo:', error);
        if (header) {
            header.innerHTML = '<div class="error">Error de conexión</div>';
        }
    }
}

async function cargarJugadoresEquipo(equipoId) {
    console.log('Cargando jugadores para equipo:', equipoId);
    
    try {
        const response = await window.fetchAPI('getJugadores', { equipoId });
        if (!response.success) {
            console.log('No se pudieron cargar jugadores:', response.error);
            return;
        }
        
        const jugadores = response.data;
        console.log('Jugadores cargados:', jugadores.length);
        
        const comision = jugadores.filter(j => j.rol && j.rol !== 'Jugador');
        const plantel = jugadores.filter(j => !j.rol || j.rol === 'Jugador');
        
        const comisionGrid = document.getElementById('comisionGrid');
        const plantelGrid = document.getElementById('plantelGrid');
        
        if (comisionGrid) {
            comisionGrid.innerHTML = comision.map(j => `
                <div class="card">
                    <h3>${j.nombre} ${j.apellido}</h3>
                    <p class="badge badge-success">${j.rol}</p>
                </div>
            `).join('') || '<p>Sin comisión registrada</p>';
        }
        
        if (plantelGrid) {
            plantelGrid.innerHTML = plantel.map(j => `
                <div class="card">
                    <h3>#${j.numeroCamiseta || '-'} ${j.nombre} ${j.apellido}</h3>
                    <p>${j.posicion || 'Jugador'}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando jugadores:', error);
    }
}

async function cargarPartidosEquipoPublico(equipoId) {
    console.log('Cargando partidos para equipo:', equipoId);
    
    try {
        const response = await window.fetchAPI('getPartidos', { equipoId });
        if (!response.success) {
            console.log('No se pudieron cargar partidos:', response.error);
            return;
        }
        
        const partidosList = document.getElementById('partidosEquipoList');
        if (!partidosList) return;
        
        if (response.data.length === 0) {
            partidosList.innerHTML = '<p>No hay partidos programados</p>';
            return;
        }
        
        partidosList.innerHTML = response.data.map(partido => {
            const fecha = window.formatDate(partido.fecha);
            return `
                <div class="partido-card">
                    <div class="partido-info">
                        <h3>vs ${partido.rival}</h3>
                        <div class="partido-meta">
                            <span>📍 ${partido.lugar}</span>
                            <span>🕐 ${partido.hora}</span>
                        </div>
                    </div>
                    <div class="partido-fecha">
                        <div class="dia">${fecha.dia}</div>
                        <div class="mes">${fecha.mes}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error cargando partidos:', error);
    }
}

// ============================================
// PÁGINA: ADMIN
// ============================================

function initAdmin() {
    console.log('Iniciando Admin');
    
    let currentUser = null;

    try {
        const storedUser = localStorage.getItem('arvet_user');
        if (storedUser && storedUser !== "undefined") {
            currentUser = JSON.parse(storedUser);
            console.log('Usuario cargado:', currentUser);
        }
    } catch (e) {
        console.error("Error parseando usuario:", e);
        currentUser = null;
    }

    // 🔒 Protección de sesión
    if (!currentUser) {
        console.log('No hay usuario, redirigiendo a login');
        window.location.href = "login.html";
        return;
    }

    // Datos de usuario
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const currentDateEl = document.getElementById('currentDate');

    if (userNameEl) userNameEl.textContent = currentUser.nombre || '';
    if (userRoleEl) userRoleEl.textContent = currentUser.rol || '';
    if (currentDateEl) {
        currentDateEl.textContent = new Date().toLocaleDateString('es-ES');
    }

    // Botón sitio público
    const btn = document.getElementById('btnVerSitio');
    if (btn) {
        if (currentUser.slug) {
            btn.addEventListener('click', function() {
                window.location.href = `/${currentUser.slug}`;
            });
        } else if (currentUser.equipoId) {
            btn.addEventListener('click', async function() {
                try {
                    const response = await window.fetchAPI('getEquipoBySlug', { slug: currentUser.equipoId });
                    if (response.success && response.data.slug) {
                        window.location.href = `/${response.data.slug}`;
                    } else {
                        window.location.href = `/${currentUser.equipoId}`;
                    }
                } catch (e) {
                    window.location.href = `/${currentUser.equipoId}`;
                }
            });
        }
    }

    // Navegación de secciones
    window.showSection = function(sectionId) {
        document.querySelectorAll('.section-content')
            .forEach(el => el.classList.add('hidden'));
        const section = document.getElementById(sectionId);
        if (section) section.classList.remove('hidden');
    }

    // Inicializar funciones
    cargarDashboard();
    cargarJugadoresAdmin();
    
    // Llamar funciones de otros archivos si existen
    if (typeof cargarPartidosAdmin === 'function') cargarPartidosAdmin();
    if (typeof cargarCuotasAdmin === 'function') cargarCuotasAdmin();
}

async function cargarDashboard() {
    const statJugadores = document.getElementById('statJugadores');
    const statPartidos = document.getElementById('statPartidos');
    const statRecaudacion = document.getElementById('statRecaudacion');
    const statDeuda = document.getElementById('statDeuda');

    if (statJugadores) statJugadores.textContent = '25';
    if (statPartidos) statPartidos.textContent = '4';
    if (statRecaudacion) statRecaudacion.textContent = '$450.000';
    if (statDeuda) statDeuda.textContent = '$125.000';
}

async function cargarJugadoresAdmin() {
    const currentUser = JSON.parse(localStorage.getItem('arvet_user') || '{}');
    
    if (!currentUser.equipoId) {
        console.log('No hay equipoId en el usuario');
        return;
    }
    
    try {
        const response = await window.fetchAPI('getJugadores', {
            equipoId: currentUser.equipoId
        });

        if (response.success) {
            const tbody = document.querySelector('#tablaJugadores tbody');
            if (!tbody) return;

            tbody.innerHTML = response.data.map(j => `
                <tr>
                    <td>${j.numeroCamiseta || '-'}</td>
                    <td>${j.nombre} ${j.apellido || ''}</td>
                    <td>${j.posicion || '-'}</td>
                    <td>${j.email || '-'}</td>
                    <td>
                        <span class="badge badge-success">
                            ${j.rol || 'Jugador'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-action btn-edit"
                            onclick="editarJugador('${j.id}')">
                            Editar
                        </button>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error cargando jugadores admin:', error);
    }
}

window.nuevoJugador = function() {
    alert('Función para crear nuevo jugador');
}

window.editarJugador = function(id) {
    alert('Editar jugador: ' + id);
}

window.logout = function() {
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('arvet_user');
        localStorage.removeItem('arvet_login_time');
        window.location.href = 'login.html';
    }
}

// ============================================
// MAPA (LEAFLET) - Para página equipo
// ============================================

let mapaCreado = false;
let mapInstance = null;

function inicializarMapa() {
    console.log('=== inicializarMapa ===');
    
    // Verificar que Leaflet esté cargado
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet no está cargado');
        return;
    }
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.log('❌ No existe contenedor #map');
        return;
    }
    
    if (mapaCreado && mapInstance) {
        console.log('Actualizando mapa existente...');
        if (window.equipoCoords) {
            const lat = parseFloat(window.equipoCoords.lat);
            const lng = parseFloat(window.equipoCoords.lng);
            mapInstance.setView([lat, lng], 15);
            
            mapInstance.eachLayer(layer => {
                if (layer instanceof L.Marker) mapInstance.removeLayer(layer);
            });
            
            L.marker([lat, lng]).addTo(mapInstance)
                .bindPopup("📍 Ubicación del equipo")
                .openPopup();
        }
        return;
    }
    
    const lat = window.equipoCoords ? parseFloat(window.equipoCoords.lat) : -34.6037;
    const lng = window.equipoCoords ? parseFloat(window.equipoCoords.lng) : -58.3816;
    const zoom = window.equipoCoords ? 15 : 13;
    
    console.log('Creando mapa en:', lat, lng);
    
    try {
        mapInstance = L.map('map').setView([lat, lng], zoom);
        mapaCreado = true;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance);
        
        L.marker([lat, lng]).addTo(mapInstance)
            .bindPopup("📍 Ubicación del equipo")
            .openPopup();
            
        console.log('✅ Mapa creado correctamente');
    } catch (error) {
        console.error('❌ Error creando mapa:', error);
    }
}
