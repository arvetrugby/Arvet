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
function mostrarMensaje(texto, tipo = "ok") {

  const div = document.getElementById('mensajePerfil');

  div.textContent = texto;
  div.style.display = "block";

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
        mostrarMensaje("Perfil actualizado correctamente", "ok");
        location.reload(); // 👈 para ver los datos actualizados
      } else {
        mostrarMensaje("Error al actualizar", "error");
      }

    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }

  });

});
