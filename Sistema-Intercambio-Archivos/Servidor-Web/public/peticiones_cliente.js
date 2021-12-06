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
  fetch('http://localhost:8080/file') // interfaz para acceder y manipular partes de http peticiones y respuestas
    .then(response => response.json()) // el servidor nos responde con el listado de archivos en formato JSON, y lo insertaríamos en el index.html.
    .then(data => crear_tabla_dinamica(data)); // en 'data' nos quedará el string JSON parseado a objeto JavaScript, el cual será de la forma: [{id: hash1, filename: nombre1, filesize: tamaño1}, ...]
}

function solicitud_descarga(hash){
  fetch(`http://localhost:8080/file/${hash}`)
    .then(response => response.json())
    .then(data => alert(data)); // para probar, se puso un alert
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
    .then(response => response.json()) // el servidor nos responde un string de confirmación.
    .then(data => alert(data)); // mostramos el mensaje en el navegador con una alerta.

  // Limpiamos los campos del formulario
  //document.getElementByName("formulario").reset(); //no hago directamente este reset porque genera un nuevo GET
  document.getElementById('filename').value = "";
  document.getElementById('filesize').value = "";
  document.getElementById('nodeIP').value = "";
  document.getElementById('nodePort').value = "";

}


function crear_tabla_dinamica(lista_archivos){

   var col = [];
   for (var i = 0; i < lista_archivos.length; i++) {
       for (var key in lista_archivos[i]) {
           if (col.indexOf(key) === -1) {
               col.push(key);
           }
       }
   }

  col.push("boton");

  // CREATE DYNAMIC TABLE.
  var table = document.createElement("table");

  // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

   var tr = table.insertRow(-1);                   // TABLE ROW = fila.

   for (var i = 0; i < col.length; i++) {
       var th = document.createElement("th");      // TABLE HEADER.
       th.innerHTML = col[i];   //sirve para asignar dato
       tr.appendChild(th);
   }

  // ADD JSON DATA TO THE TABLE AS ROWS.
   for (var i = 0; i < lista_archivos.length; i++) {

       tr = table.insertRow(-1);

       var hash_archivo;

       for (var j = 0; j < col.length-1; j++) {
           var tabCell = tr.insertCell(-1);
           tabCell.innerHTML = lista_archivos[i][col[j]];
           console.log(lista_archivos[i][col[j]]);
           if (j == 0)
            hash_archivo = lista_archivos[i][col[j]]; // resguardamos el valor del hash para luego agregarlo al boton de descarga.
       }
      //Create an input type dynamically.   
      var buttond = document.createElement("input");
      //Assign different attributes to the element. 
      buttond.setAttribute("type", "button");
      buttond.setAttribute("value", "descargar");
      buttond.setAttribute("name", "descargar");
      //buttond.setAttribute("onclick", solicitud_descarga());
      console.log(hash_archivo);
      buttond.onclick = function () {
          solicitud_descarga(hash_archivo);
      }
      var tabCell = tr.insertCell(-1);
      tabCell.append(buttond);
   }

   // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
   var divContainer = document.getElementById("showData");
   divContainer.innerHTML = "";
   divContainer.appendChild(table);

}