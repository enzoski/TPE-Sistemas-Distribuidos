// No necesitamos hacer un "require('node-fetch')", ya que el navegador ya tiene integrado un 'fetch'.
// De hecho, a priori tampoco podríamos importar ese modulo porque es propio de npm/node (el interprete de JS del navegador no lo reconocería).

// El 'fetch' nos permite desde el navegador, hacerle peticiones HTTP al servidor web con código javascript,
// para que nos devuelva un recurso concreto y podamos gestionar desde acá (.js),
// por ejemplo, cómo insertarlo en el HTML actual para que se vea en el navegador.
// Las peticiones GET para cambiar de páginas, las realiza directamente el navegador
// al ingresar o cambiar una URL (como 'GET /' o 'GET /formulario', donde el servidor
// nos devuelve el HTML completo que representa a la pagina en cuestión).

/*
EL CODIGO PARA EL USO DE FETCH FUE SACADO DE LA DOCUMENTACION:
https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch
*/

function listar_archivos(){
  fetch('http://localhost:8080/file')
    .then(response => response.text()) // en principio, el servidor nos mandaría el listado de archivos en formato HTML, y lo insertaríamos en el index.html.
    .then(data => alert(data));
}

function alta_archivo(){
  
  // Obtenemos los valores escritos en el formulario HTML
  let datos_torrente = {
    filename: document.getElementById('filename').value,
    filesize: parseInt(document.getElementById('filesize').value),
    nodeIP: document.getElementById('nodeIP').value,
    nodePort: parseInt(document.getElementById('nodePort').value),
    hash: ""
  }

  // muestro en la consola del navegador (para pruebas)
  console.log(datos_torrente);
  console.log(JSON.stringify(datos_torrente));
  
  // Le mandamos al servidor los datos del nuevo torrente a subir
  fetch('http://localhost:8080/file/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
        },
      body: JSON.stringify(datos_torrente) // convertimos el objeto de JS en string JSON, que es lo que enviaremos.
    })
    .then(response => response.text()) // el servidor nos responde un string de confirmación.
    .then(data => alert(data)); // mostramos el mensaje en el navegador con una alerta.

  // Limpiamos los campos del formulario
  //document.getElementByName("formulario").reset(); //no hago directamente este reset porque genera un nuevo GET
  document.getElementById('filename').value = "";
  document.getElementById('filesize').value = "";
  document.getElementById('nodeIP').value = "";
  document.getElementById('nodePort').value = "";

}