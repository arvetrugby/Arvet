document.addEventListener('DOMContentLoaded', async function () {

  const user = JSON.parse(localStorage.getItem('arvet_user'));

  if (!user || user.rol !== 'Jugador') {
    window.location.href = 'login.html';
    return;
  }

  /*********************************
   MENSAJE VISUAL
  *********************************/
  function mostrarMensaje(texto, tipo = "ok") {

    const div = document.getElementById('mensajePerfil');
    if (!div) return;

    div.textContent = texto;
    div.style.display = "block";
    div.style.padding = "10px";
    div.style.marginBottom = "15px";
    div.style.borderRadius = "6px";

    if (tipo === "ok") {
      div.style.backgroundColor = "#d4edda";
      div.style.color = "#155724";
    } else {
      div.style.backgroundColor = "#f8d7da";
      div.style.color = "#721c24";
    }

    setTimeout(() => {
      div.style.display = "none";
    }, 4000);
  }

  /*********************************
   CARGAR DATOS DEL JUGADOR
  *********************************/
  async function cargarDatos() {

    try {

      const response = await fetch(
        `${API_URL}?action=getJugadorById&id=${user.id}`
      );

      const data = await response.json();

      if (data.success) {

        const jugador = data.data;

        document.getElementById('nombre').value = jugador.nombre || '';
        document.getElementById('apellido').value = jugador.apellido || '';
        document.getElementById('email').value = jugador.email || '';
        document.getElementById('telefono').value = jugador.telefono || '';

        if (jugador.fechaNacimiento) {
          const fecha = new Date(jugador.fechaNacimiento);
          const fechaFormateada = fecha.toISOString().split('T')[0];
          document.getElementById('fechaNacimiento').value = fechaFormateada;
        }

        document.getElementById('dni').value = jugador.dni || '';
        document.getElementById('cuitCuil').value = jugador.cuitCuil || '';

      } else {
        mostrarMensaje("Error cargando perfil", "error");
      }

    } catch (err) {
      console.error(err);
      mostrarMensaje("Error de conexión", "error");
    }
  }

  await cargarDatos();

  /*********************************
   ACTUALIZAR PERFIL
  *********************************/
  const form = document.getElementById('formPerfil');

  form.addEventListener('submit', async function (e) {

    e.preventDefault();

    const datosActualizados = {
      id: user.id,
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      fechaNacimiento: document.getElementById('fechaNacimiento').value,
      dni: document.getElementById('dni').value.trim(),
      cuitCuil: document.getElementById('cuitCuil').value.trim()
    };

    try {

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateJugador',
          ...datosActualizados
        })
      });

      const data = await response.json();

      if (data.success) {

        // Actualizar localStorage
        const updatedUser = {
          ...user,
          nombre: datosActualizados.nombre,
          apellido: datosActualizados.apellido,
          email: datosActualizados.email
        };

        localStorage.setItem('arvet_user', JSON.stringify(updatedUser));

        mostrarMensaje("Perfil actualizado correctamente", "ok");

      } else {
        mostrarMensaje("Error al actualizar perfil", "error");
      }

    } catch (error) {
      console.error(error);
      mostrarMensaje("Error de conexión", "error");
    }

  });

  /*********************************
   CAMBIAR CONTRASEÑA
  *********************************/
  const btnCambiarPass = document.getElementById('btnCambiarPass');

  if (btnCambiarPass) {

    btnCambiarPass.addEventListener('click', async function () {

      const nuevaPass = document.getElementById('nuevaPassword').value.trim();

      if (!nuevaPass) {
        mostrarMensaje("Ingresá una nueva contraseña", "error");
        return;
      }

      try {

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updatePassword',
            id: user.id,
            password: nuevaPass
          })
        });

        const data = await response.json();

        if (data.success) {
          mostrarMensaje("Contraseña actualizada correctamente", "ok");
          document.getElementById('nuevaPassword').value = "";
        } else {
          mostrarMensaje("Error al actualizar contraseña", "error");
        }

      } catch (err) {
        mostrarMensaje("Error de conexión", "error");
      }

    });
  }

  /*********************************
   LOGOUT
  *********************************/
  const btnLogout = document.getElementById('btnLogout');

  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      localStorage.removeItem('arvet_user');
      window.location.href = 'login.html';
    });
  }

});
