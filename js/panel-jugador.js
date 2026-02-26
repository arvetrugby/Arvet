document.addEventListener('DOMContentLoaded', async function() {

  const user = JSON.parse(localStorage.getItem('arvet_user'));

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  if (user.rol !== 'Jugador') {
    window.location.href = 'login.html';
    return;
  }
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
  try {

    const response = await fetch(
      `${API_URL}?action=getJugadorById&id=${user.id}`
    );

    const data = await response.json();
    console.log("Respuesta servidor:", data);

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
      alert('Error cargando perfil');
    }

  } catch (err) {
    console.error(err);
  }

  // 👇 AHORA el listener va acá adentro
  const form = document.getElementById('formPerfil');

  form.addEventListener('submit', async function(e) {
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
        body: JSON.stringify({
          action: 'updateJugador',
          ...datosActualizados
        })
      });

      const data = await response.json();
      console.log("Respuesta update:", data);

      if (data.success) {
        alert('Perfil actualizado correctamente');
        location.reload(); // 👈 para ver los datos actualizados
      } else {
        alert('Error al actualizar');
      }

    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }

  });
  /*********************************
   CAMBIAR CONTRASEÑA
  *********************************/

  const btnCambiarPass = document.getElementById('btnCambiarPass');

  if (btnCambiarPass) {

    btnCambiarPass.addEventListener('click', async function() {

      const nuevaPass = document.getElementById('nuevaPassword').value.trim();

      if (!nuevaPass) {
        alert("Ingresá una nueva contraseña");
        return;
      }

      try {

        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updatePassword',
            id: user.id,
            password: nuevaPass
          })
        });

        const data = await response.json();
        console.log("Respuesta updatePassword:", data);

        if (data.success) {
          alert("Contraseña actualizada correctamente");
          document.getElementById('nuevaPassword').value = "";
        } else {
          alert("Error al actualizar contraseña");
        }

      } catch (error) {
        console.error(error);
        alert("Error de conexión");
      }

    });

  }
  /*********************************
   LOGOUT
  *********************************/

  const btnLogout = document.getElementById('btnLogout');

  if (btnLogout) {
    btnLogout.addEventListener('click', function() {
      localStorage.removeItem('arvet_user');
      window.location.href = 'login.html';
    });
  }
});
