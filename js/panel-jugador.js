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

    if (data.success) {

      const jugador = data.data;

      document.getElementById('nombre').value = jugador.nombre || '';
      document.getElementById('apellido').value = jugador.apellido || '';
      document.getElementById('email').value = jugador.email || '';
      document.getElementById('telefono').value = jugador.telefono || '';
      document.getElementById('fechaNacimiento').value = jugador.fechaNacimiento || '';
      document.getElementById('dni').value = jugador.dni || '';
      document.getElementById('cuitCuil').value = jugador.cuitCuil || '';

    } else {
      alert('Error cargando perfil');
    }

  } catch (err) {
    console.error(err);
  }

});
