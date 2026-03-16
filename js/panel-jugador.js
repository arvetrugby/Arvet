document.addEventListener('DOMContentLoaded', async function () {

  const adminEditId = localStorage.getItem('admin_edit_jugador');
  const user = JSON.parse(localStorage.getItem('arvet_user') || "{}");

  const esAdminEditando = !!adminEditId;
  const jugadorId = esAdminEditando ? adminEditId : user?.id;

  /*********************************
  VALIDAR SESIÓN
  *********************************/
  if (!user.id && !esAdminEditando) {
    window.location.href = 'login.html';
    return;
  }

  if (user.rol !== 'Jugador' && !esAdminEditando) {
    window.location.href = 'login.html';
    return;
  }

  /*********************************
  VARIABLES GLOBALES
  *********************************/
  let avatarUrlActual = null;
  let jugadorData = null; // Guardamos los datos para usarlos después

  /*********************************
  REFERENCIAS A ELEMENTOS DEL DOM
  *********************************/
  const nombre = document.getElementById('nombre');
  const apellido = document.getElementById('apellido');
  const email = document.getElementById('email');
  const telefono = document.getElementById('telefono');
  const fechaNacimiento = document.getElementById('fechaNacimiento');
  const dni = document.getElementById('dni');
  const cuitCuil = document.getElementById('cuitCuil');

  /*********************************
  MENSAJES
  *********************************/
  function mostrarMensaje(texto, tipo = "ok") {
    const div = document.getElementById('mensajePerfil');
    if (!div) return;

    div.textContent = texto;
    div.style.display = "block";
    div.style.background = tipo === "ok" ? "#d1fae5" : "#fee2e2";
    div.style.color = tipo === "ok" ? "#059669" : "#dc2626";

    setTimeout(() => div.style.display = "none", 4000);
  }

  /*********************************
  VOLVER A ADMIN
  *********************************/
  const btnVolverAdmin = document.getElementById('btnVolverAdmin');

  if (esAdminEditando && btnVolverAdmin) {
    btnVolverAdmin.style.display = 'inline-block';
    btnVolverAdmin.addEventListener('click', () => {
      localStorage.removeItem('admin_edit_jugador');
      window.location.href = 'admin.html';
    });
  }

  /*********************************
  CARGAR PERFIL DEL JUGADOR
  *********************************/
  async function cargarPerfil() {
    try {
      console.log('Cargando perfil para ID:', jugadorId);
      
      const response = await fetch(`${API_URL}?action=getJugadorById&id=${jugadorId}`);
      const data = await response.json();

      console.log('Respuesta del servidor:', data);

      if (!data.success) {
        mostrarMensaje("Error cargando perfil: " + (data.message || "Error desconocido"), "error");
        return;
      }

      jugadorData = data.data;

      /*************** DATOS PERSONALES ***************/
      if (nombre) nombre.value = jugadorData.nombre || '';
      if (apellido) apellido.value = jugadorData.apellido || '';
      if (email) email.value = jugadorData.email || '';
      if (telefono) telefono.value = jugadorData.telefono || '';
      if (dni) dni.value = jugadorData.dni || '';
      if (cuitCuil) cuitCuil.value = jugadorData.cuitCuil || '';

      if (jugadorData.fechaNacimiento && fechaNacimiento) {
        // Manejar diferentes formatos de fecha
        let fechaStr = jugadorData.fechaNacimiento;
        if (fechaStr.includes('T')) {
          fechaStr = fechaStr.split('T')[0];
        } else if (fechaStr.includes(' ')) {
          fechaStr = fechaStr.split(' ')[0];
        }
        fechaNacimiento.value = fechaStr;
      }

      /*************** AVATAR ***************/
      const avatarImg = document.getElementById('avatarPreview');
      if (jugadorData.avatarUrl && avatarImg) {
        avatarUrlActual = jugadorData.avatarUrl;
        avatarImg.src = jugadorData.avatarUrl;
        avatarImg.onerror = function() {
          this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23e2e8f0"/><text x="60" y="60" text-anchor="middle" fill="%2394a3b8">Sin foto</text></svg>';
        };
      }

      /*************** ESTADO ***************/
      const estadoEl = document.getElementById("estadoJugador");
      const estadoBox = document.getElementById("estadoBox");
      
      if (estadoEl) {
        estadoEl.textContent = jugadorData.estado || "FALTA DOCUMENTACIÓN";
        
        // Limpiar clases anteriores
        estadoBox.classList.remove("habilitado", "faltante");
        estadoEl.classList.remove("habilitado", "faltante");
        
        if (jugadorData.estado === "HABILITADO") {
          estadoBox.classList.add("habilitado");
          estadoEl.classList.add("habilitado");
        } else {
          estadoBox.classList.add("faltante");
          estadoEl.classList.add("faltante");
        }
      }

      /*************** NOMBRE EN HEADER ***************/
      const nombreJugadorHeader = document.getElementById('nombreJugadorHeader');
      if (nombreJugadorHeader) {
        nombreJugadorHeader.textContent = (jugadorData.nombre || '') + ' ' + (jugadorData.apellido || '');
      }

      /*********************************
      CARGAR DATOS DEL EQUIPO
      *********************************/
      if (jugadorData.equipoId) {
        await cargarEquipo(jugadorData.equipoId);
      }

      /*********************************
      MOSTRAR DOCUMENTOS
      *********************************/
      mostrarDocumento("aptoLink", jugadorData.aptoMedico || jugadorData.apto, "aptoMedico");
      mostrarDocumento("estudiosLink", jugadorData.estudiosRealizados || jugadorData.estudios, "estudios");
      mostrarDocumento("deslindeLink", jugadorData.deslindeResponsabilidad || jugadorData.deslinde, "deslinde");

    } catch (err) {
      console.error("Error cargando perfil:", err);
      mostrarMensaje("Error de conexión al cargar perfil", "error");
    }
  }

  /*********************************
  CARGAR DATOS DEL EQUIPO
  *********************************/
  async function cargarEquipo(equipoId) {
    try {
      const resEquipo = await fetch(`${API_URL}?action=getEquipoById&id=${equipoId}`);
      const dataEquipo = await resEquipo.json();

      if (dataEquipo.success) {
        const equipo = dataEquipo.data;

        const logo = document.getElementById("equipoLogo");
        const nombreEquipo = document.getElementById("nombreEquipo");

        if (logo && equipo.logoUrl) {
          logo.src = equipo.logoUrl;
          logo.onerror = function() {
            this.style.display = 'none';
          };
        }

        if (nombreEquipo) {
          nombreEquipo.textContent = equipo.nombre || 'Equipo';
        }

        if (equipo.colorPrimario) {
          document.documentElement.style.setProperty('--equipo-color', equipo.colorPrimario);
        }
      }
    } catch (err) {
      console.error("Error cargando equipo:", err);
    }
  }

  /*********************************
  MOSTRAR DOCUMENTOS CON BOTÓN ELIMINAR
  *********************************/
  function mostrarDocumento(divId, url, tipo) {
    const div = document.getElementById(divId);
    if (!div) return;

    if (url) {
      div.innerHTML = `
        <a href="${url}" target="_blank">📄 Ver documento</a>
        <button onclick="window.eliminarDocumento('${tipo}')" class="btn-danger">❌ Eliminar</button>
      `;
      div.className = "doc-link";
    } else {
      div.innerHTML = `<span class="no-doc">❌ No cargado</span>`;
      div.className = "no-doc";
    }
  }

  /*********************************
  ELIMINAR DOCUMENTO (global para poder llamar desde onclick)
  *********************************/
  window.eliminarDocumento = async function(tipo) {
    if (!confirm('¿Estás seguro de que querés eliminar este documento?')) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'eliminarDocumento',
          jugadorId: jugadorId,
          tipoDocumento: tipo
        })
      });

      const result = await response.json();

      if (result.success) {
        mostrarMensaje("Documento eliminado correctamente");
        // Recargar para actualizar la vista
        cargarPerfil();
      } else {
        mostrarMensaje("Error al eliminar: " + (result.message || "Error desconocido"), "error");
      }
    } catch (err) {
      console.error("Error eliminando documento:", err);
      mostrarMensaje("Error de conexión al eliminar", "error");
    }
  };

  /*********************************
  GUARDAR PERFIL (DATOS PERSONALES)
  *********************************/
  const form = document.getElementById('formPerfil');
  
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const datos = {
        id: jugadorId,
        nombre: nombre.value.trim(),
        apellido: apellido.value.trim(),
        email: email.value.trim(),
        telefono: telefono.value.trim(),
        fechaNacimiento: fechaNacimiento.value,
        dni: dni.value.trim(),
        cuitCuil: cuitCuil.value.trim(),
        avatarUrl: avatarUrlActual
      };

      console.log('Guardando datos:', datos);

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateJugador',
            ...datos
          })
        });

        const result = await response.json();

        if (result.success) {
          mostrarMensaje("✅ Perfil actualizado correctamente");

          // Actualizar localStorage si no es admin editando
          if (!esAdminEditando) {
            const updatedUser = {
              ...user,
              nombre: datos.nombre,
              apellido: datos.apellido,
              email: datos.email
            };
            localStorage.setItem('arvet_user', JSON.stringify(updatedUser));
          }

          // Actualizar nombre en header
          const nombreJugadorHeader = document.getElementById('nombreJugadorHeader');
          if (nombreJugadorHeader) {
            nombreJugadorHeader.textContent = datos.nombre + ' ' + datos.apellido;
          }

        } else {
          mostrarMensaje("❌ Error al actualizar: " + (result.message || "Error desconocido"), "error");
        }
      } catch (err) {
        console.error("Error guardando perfil:", err);
        mostrarMensaje("❌ Error de conexión", "error");
      }
    });
  }

  /*********************************
  CAMBIAR AVATAR
  *********************************/
  const btnCambiarAvatar = document.getElementById('btnCambiarAvatar');
  const inputAvatar = document.getElementById('inputAvatar');
  const avatarPreview = document.getElementById('avatarPreview');

  if (btnCambiarAvatar && inputAvatar) {
    btnCambiarAvatar.addEventListener('click', () => inputAvatar.click());

    inputAvatar.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;

      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        mostrarMensaje("La imagen es muy grande (máx 2MB)", "error");
        return;
      }

      mostrarMensaje("⏳ Subiendo imagen...");

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          "https://api.imgbb.com/1/upload?key=2c40bfae99afcb6fd536a0e303a77b90",
          { method: "POST", body: formData }
        );

        const result = await response.json();

        if (result.success) {
          avatarUrlActual = result.data.url; // Usar URL directa
          if (avatarPreview) avatarPreview.src = avatarUrlActual;
          mostrarMensaje("✅ Imagen cargada. No olvides guardar los cambios.");
        } else {
          mostrarMensaje("❌ Error al subir imagen", "error");
        }
      } catch (err) {
        console.error("Error subiendo avatar:", err);
        mostrarMensaje("❌ Error de conexión al subir imagen", "error");
      }
    });
  }

  /*********************************
  SUBIR DOCUMENTOS
  *********************************/
  const btnSubirDocumentos = document.getElementById('btnSubirDocumentos');
  
  if (btnSubirDocumentos) {
    btnSubirDocumentos.addEventListener('click', async function() {
      const aptoFile = document.getElementById('aptoMedico').files[0];
      const estudiosFile = document.getElementById('estudios').files[0];
      const deslindeFile = document.getElementById('deslinde').files[0];

      if (!aptoFile && !estudiosFile && !deslindeFile) {
        mostrarMensaje("Seleccioná al menos un documento", "error");
        return;
      }

      mostrarMensaje("⏳ Subiendo documentos...");

      try {
        const documentos = {};

        // Subir apto médico si existe
        if (aptoFile) {
          const url = await subirArchivoAServidor(aptoFile);
          documentos.aptoMedico = url;
        }

        // Subir estudios si existe
        if (estudiosFile) {
          const url = await subirArchivoAServidor(estudiosFile);
          documentos.estudiosRealizados = url;
        }

        // Subir deslinde si existe
        if (deslindeFile) {
          const url = await subirArchivoAServidor(deslindeFile);
          documentos.deslindeResponsabilidad = url;
        }

        // Guardar en el servidor
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateDocumentosJugador',
            id: jugadorId,
            ...documentos
          })
        });

        const result = await response.json();

        if (result.success) {
          mostrarMensaje("✅ Documentos subidos correctamente");
          // Limpiar inputs
          document.getElementById('aptoMedico').value = '';
          document.getElementById('estudios').value = '';
          document.getElementById('deslinde').value = '';
          // Recargar perfil
          cargarPerfil();
        } else {
          mostrarMensaje("❌ Error al guardar documentos: " + (result.message || ""), "error");
        }

      } catch (err) {
        console.error("Error subiendo documentos:", err);
        mostrarMensaje("❌ Error al subir documentos", "error");
      }
    });
  }

  /*********************************
  FUNCIÓN AUXILIAR: SUBIR ARCHIVO
  *********************************/
  async function subirArchivoAServidor(file) {
    // Usar ImgBB para documentos también (o cambiar por tu propio servidor)
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(
      "https://api.imgbb.com/1/upload?key=2c40bfae99afcb6fd536a0e303a77b90",
      { method: "POST", body: formData }
    );

    const result = await response.json();
    
    if (result.success) {
      return result.data.url;
    } else {
      throw new Error("Error subiendo archivo");
    }
  }

  /*********************************
  CAMBIAR CONTRASEÑA
  *********************************/
  const btnCambiarPass = document.getElementById('btnCambiarPass');
  const nuevaPassword = document.getElementById('nuevaPassword');

  if (btnCambiarPass && nuevaPassword) {
    btnCambiarPass.addEventListener('click', async function() {
      const password = nuevaPassword.value.trim();
      
      if (!password || password.length < 6) {
        mostrarMensaje("La contraseña debe tener al menos 6 caracteres", "error");
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'cambiarPassword',
            id: jugadorId,
            password: password
          })
        });

        const result = await response.json();

        if (result.success) {
          mostrarMensaje("✅ Contraseña actualizada correctamente");
          nuevaPassword.value = '';
        } else {
          mostrarMensaje("❌ Error: " + (result.message || "No se pudo actualizar"), "error");
        }
      } catch (err) {
        console.error("Error cambiando password:", err);
        mostrarMensaje("❌ Error de conexión", "error");
      }
    });
  }

  /*********************************
  LOGOUT
  *********************************/
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('arvet_user');
      localStorage.removeItem('admin_edit_jugador');
      window.location.href = "login.html";
    });
  }

  /*********************************
  INICIAR CARGA
  *********************************/
  await cargarPerfil();

});
