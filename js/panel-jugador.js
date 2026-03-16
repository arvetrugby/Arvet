
document.addEventListener('DOMContentLoaded', async function() {
  
  console.log('🚀 Iniciando panel de jugador...');
  
  // ==========================================
  // VALIDAR CONFIGURACIÓN
  // ==========================================
  if (typeof API_URL === 'undefined') {
    alert('❌ Error: API_URL no está configurado. Editá el HTML y poné tu URL de Apps Script.');
    return;
  }
  
  // ==========================================
  // SESIÓN Y PERMISOS
  // ==========================================
  const adminEditId = localStorage.getItem('admin_edit_jugador');
  let user = null;
  
  try {
    const userData = localStorage.getItem('arvet_user');
    if (userData) user = JSON.parse(userData);
  } catch (e) {
    console.error('Error leyendo localStorage:', e);
  }
  
  const esAdminEditando = !!adminEditId;
  const jugadorId = esAdminEditando ? adminEditId : (user?.id || user?.ID);
  
  console.log('ID Jugador:', jugadorId, '| Admin:', esAdminEditando);
  
  // Redirigir si no hay sesión
  if (!jugadorId) {
    window.location.href = 'login.html';
    return;
  }
  
  // Validar rol (solo si no es admin editando)
  if (!esAdminEditando && user?.rol !== 'Jugador') {
    window.location.href = 'login.html';
    return;
  }
  
  // ==========================================
  // VARIABLES GLOBALES
  // ==========================================
  let avatarUrlActual = null;
  let equipoColor = '#6366f1'; // Color por defecto
  
  // ==========================================
  // FUNCIONES AUXILIARES
  // ==========================================
  
  function mostrarMensaje(texto, tipo = 'ok') {
    const div = document.getElementById('mensajePerfil');
    if (!div) return;
    
    div.textContent = texto;
    div.style.display = 'block';
    div.style.background = tipo === 'ok' ? '#d1fae5' : '#fee2e2';
    div.style.color = tipo === 'ok' ? '#059669' : '#dc2626';
    
    setTimeout(() => {
      div.style.display = 'none';
    }, 4000);
  }
  
  function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    // Si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return fechaStr;
    
    try {
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha.getTime())) {
        return fecha.toISOString().split('T')[0];
      }
    } catch (e) {}
    
    return fechaStr.split('T')[0].split(' ')[0];
  }
  
  // ==========================================
  // CARGAR DATOS DEL JUGADOR
  // ==========================================
  
  async function cargarPerfil() {
    try {
      console.log('Cargando perfil...');
      
      const response = await fetch(`${API_URL}?action=getJugadorById&id=${jugadorId}`);
      const data = await response.json();
      
      if (!data.success) {
        mostrarMensaje('Error cargando perfil: ' + (data.message || ''), 'error');
        return;
      }
      
      const jugador = data.data;
      console.log('Jugador cargado:', jugador);
      
      // --- Datos personales ---
      document.getElementById('nombre').value = jugador.nombre || '';
      document.getElementById('apellido').value = jugador.apellido || '';
      document.getElementById('email').value = jugador.email || '';
      document.getElementById('telefono').value = jugador.telefono || '';
      document.getElementById('dni').value = jugador.dni || '';
      document.getElementById('cuitCuil').value = jugador.cuitCuil || '';
      
      if (jugador.fechaNacimiento) {
        document.getElementById('fechaNacimiento').value = formatearFecha(jugador.fechaNacimiento);
      }
      
      // --- Avatar ---
      const avatarImg = document.getElementById('avatarPreview');
      if (jugador.avatarUrl || jugador.avatar) {
        avatarUrlActual = jugador.avatarUrl || jugador.avatar;
        avatarImg.src = avatarUrlActual;
      } else {
        avatarImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23e2e8f0"/><text x="60" y="60" text-anchor="middle" fill="%2394a3b8" font-size="14">Sin foto</text></svg>';
      }
      
      // --- Estado ---
      const estadoEl = document.getElementById('estadoJugador');
      const estadoBox = document.getElementById('estadoBox');
      const estado = jugador.estado || 'FALTA DOCUMENTACIÓN';
      
      estadoEl.textContent = estado;
      estadoBox.classList.remove('habilitado', 'faltante');
      
      if (estado === 'HABILITADO') {
        estadoBox.classList.add('habilitado');
      } else {
        estadoBox.classList.add('faltante');
      }
      
      // --- Nombre en header ---
      const nombreCompleto = `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim();
      document.getElementById('nombreJugadorHeader').textContent = nombreCompleto || 'Jugador';
      
      // --- Cargar equipo (color y logo) ---
      if (jugador.equipoId || jugador.equipo_id) {
        await cargarEquipo(jugador.equipoId || jugador.equipo_id);
      }
      
      // --- Documentos ---
      mostrarDocumento('aptoLink', jugador.apto, 'apto');
      mostrarDocumento('estudiosLink', jugador.estudios, 'estudios');
      mostrarDocumento('deslindeLink', jugador.deslinde, 'deslinde');
      
    } catch (err) {
      console.error('Error cargando perfil:', err);
      mostrarMensaje('Error de conexión al cargar perfil', 'error');
    }
  }
  
  // ==========================================
  // CARGAR EQUIPO (COLOR Y LOGO)
  // ==========================================
  
  async function cargarEquipo(equipoId) {
    try {
      console.log('Cargando equipo:', equipoId);
      
      const response = await fetch(`${API_URL}?action=getEquipoById&id=${equipoId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const equipo = data.data;
        
        // Logo
        const logoEl = document.getElementById('equipoLogo');
        if (equipo.logoUrl && logoEl) {
          logoEl.src = equipo.logoUrl;
        }
        
        // Nombre
        const nombreEl = document.getElementById('nombreEquipo');
        if (nombreEl) {
          nombreEl.textContent = equipo.nombre || 'Mi Equipo';
        }
        
        // Color (IMPORTANTE)
        if (equipo.colorPrimario || equipo.color) {
          equipoColor = equipo.colorPrimario || equipo.color;
          document.documentElement.style.setProperty('--equipo-color', equipoColor);
          console.log('Color del equipo aplicado:', equipoColor);
        }
      }
    } catch (err) {
      console.error('Error cargando equipo:', err);
    }
  }
  
  // ==========================================
  // MOSTRAR DOCUMENTOS
  // ==========================================
  
  function mostrarDocumento(divId, url, tipo) {
    const div = document.getElementById(divId);
    if (!div) return;
    
    if (url) {
      div.className = 'doc-link';
      div.innerHTML = `
        <a href="${url}" target="_blank">📄 Ver documento</a>
        <button class="btn-eliminar" onclick="eliminarDocumento('${tipo}')">🗑️ Eliminar</button>
      `;
    } else {
      div.className = 'no-doc';
      div.innerHTML = '❌ No cargado';
    }
  }
  
  // ==========================================
  // ELIMINAR DOCUMENTO (GLOBAL)
  // ==========================================
  
  window.eliminarDocumento = async function(tipo) {
    if (!confirm('¿Seguro que querés eliminar este documento?')) return;
    
    try {
      // Usar no-cors para Apps Script
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'eliminarDocumento',
          idJugador: jugadorId,
          tipo: tipo
        })
      });
      
      mostrarMensaje('Documento eliminado');
      setTimeout(cargarPerfil, 1000); // Recargar después de un momento
      
    } catch (err) {
      console.error('Error eliminando:', err);
      mostrarMensaje('Error al eliminar', 'error');
    }
  };
  
  // ==========================================
  // GUARDAR PERFIL
  // ==========================================
  
  document.getElementById('formPerfil').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const datos = {
      id: jugadorId,
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      fechaNacimiento: document.getElementById('fechaNacimiento').value,
      dni: document.getElementById('dni').value.trim(),
      cuitCuil: document.getElementById('cuitCuil').value.trim(),
      avatarUrl: avatarUrlActual
    };
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateJugador',
          ...datos
        })
      });
      
      mostrarMensaje('✅ Perfil actualizado');
      
      // Actualizar localStorage si es el usuario logueado
      if (!esAdminEditando && user) {
        const updatedUser = { ...user, nombre: datos.nombre, apellido: datos.apellido, email: datos.email };
        localStorage.setItem('arvet_user', JSON.stringify(updatedUser));
      }
      
      // Actualizar nombre en header
      document.getElementById('nombreJugadorHeader').textContent = `${datos.nombre} ${datos.apellido}`.trim();
      
    } catch (err) {
      console.error('Error guardando:', err);
      mostrarMensaje('Error al guardar', 'error');
    }
  });
  
  // ==========================================
  // CAMBIAR AVATAR
  // ==========================================
  
  document.getElementById('btnCambiarAvatar').addEventListener('click', function() {
    document.getElementById('inputAvatar').click();
  });
  
  document.getElementById('inputAvatar').addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      mostrarMensaje('La imagen es muy grande (máx 2MB)', 'error');
      return;
    }
    
    mostrarMensaje('⏳ Subiendo imagen...');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('https://api.imgbb.com/1/upload?key=2c40bfae99afcb6fd536a0e303a77b90', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        avatarUrlActual = result.data.url || result.data.display_url;
        document.getElementById('avatarPreview').src = avatarUrlActual;
        mostrarMensaje('✅ Imagen cargada. Guardá el perfil para confirmar.');
      } else {
        mostrarMensaje('Error al subir imagen', 'error');
      }
    } catch (err) {
      console.error('Error:', err);
      mostrarMensaje('Error de conexión', 'error');
    }
  });
  
  // ==========================================
  // SUBIR DOCUMENTOS
  // ==========================================
  
  document.getElementById('btnSubirDocumentos').addEventListener('click', async function() {
    const aptoFile = document.getElementById('aptoMedico').files[0];
    const estudiosFile = document.getElementById('estudios').files[0];
    const deslindeFile = document.getElementById('deslinde').files[0];
    
    if (!aptoFile && !estudiosFile && !deslindeFile) {
      mostrarMensaje('Seleccioná al menos un documento', 'error');
      return;
    }
    
    this.textContent = '⏳ Subiendo...';
    this.disabled = true;
    
    try {
      const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });
      
      const data = {
        action: 'subirDocumentos',
        idJugador: jugadorId
      };
      
      if (aptoFile) {
        data.apto = { name: aptoFile.name, type: aptoFile.type, data: await toBase64(aptoFile) };
      }
      if (estudiosFile) {
        data.estudios = { name: estudiosFile.name, type: estudiosFile.type, data: await toBase64(estudiosFile) };
      }
      if (deslindeFile) {
        data.deslinde = { name: deslindeFile.name, type: deslindeFile.type, data: await toBase64(deslindeFile) };
      }
      
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      mostrarMensaje('✅ Documentos subidos');
      
      // Limpiar inputs
      document.getElementById('aptoMedico').value = '';
      document.getElementById('estudios').value = '';
      document.getElementById('deslinde').value = '';
      
      setTimeout(cargarPerfil, 1500);
      
    } catch (err) {
      console.error('Error:', err);
      mostrarMensaje('Error al subir documentos', 'error');
    } finally {
      this.textContent = '📤 Subir documentación';
      this.disabled = false;
    }
  });
  
  // ==========================================
  // CAMBIAR CONTRASEÑA
  // ==========================================
  
  document.getElementById('btnCambiarPass').addEventListener('click', async function() {
    const password = document.getElementById('nuevaPassword').value.trim();
    
    if (!password || password.length < 6) {
      mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePassword',
          id: jugadorId,
          password: password
        })
      });
      
      mostrarMensaje('✅ Contraseña actualizada');
      document.getElementById('nuevaPassword').value = '';
      
    } catch (err) {
      console.error('Error:', err);
      mostrarMensaje('Error al actualizar contraseña', 'error');
    }
  });
  
  // ==========================================
  // BOTÓN VOLVER A ADMIN
  // ==========================================
  
  const btnVolver = document.getElementById('btnVolverAdmin');
  if (esAdminEditando && btnVolver) {
    btnVolver.style.display = 'inline-block';
    btnVolver.addEventListener('click', function() {
      localStorage.removeItem('admin_edit_jugador');
      window.location.href = 'admin.html';
    });
  }
  
  // ==========================================
  // LOGOUT
  // ==========================================
  
  document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('arvet_user');
    localStorage.removeItem('admin_edit_jugador');
    window.location.href = 'login.html';
  });
  
  // ==========================================
  // INICIAR
  // ==========================================
  
  await cargarPerfil();
  console.log('✅ Panel cargado completamente');
  
});



