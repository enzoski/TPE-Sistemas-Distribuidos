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
      fetch(`http://localhost:8080/file/${hash}`).then(response => {
          if (response.status != 404) { // si se encontró el archivo (tambien se podría poner 'if(response.ok)')
              // El header que viene contiene entre otras cosas -> Content-Disposition: attachment; filename="archivo.torrente"
              const filename = response.headers.get('Content-Disposition').split('"')[1];
              return response.blob().then(myBlob => {
                  // Código para que se genere el archivo .torrente con el contenido que recibimos del servidor ({hash, trackerIP, trackerPort}).
                  // hay que hacer esto ya que la peticion fue desde acá, codigo javascript haciendo uso de 'fetch',
                  // pero si pegaramos la url en el navegador, nos descarga el archivo .torrente de una.
                  var objectURL = URL.createObjectURL(myBlob);
                  var link = document.createElement("a");
                  link.href = objectURL;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(objectURL);
              });
          } else { // si nos llegó un código de estado 404, quiere decir que no se encontró el archivo (not found).
              return response.json().then(jsonError => {
                  alert(jsonError.error);
              });
          }
      })
}

function alta_archivo(){
  
  // Obtenemos los valores escritos en el formulario HTML
  let datos_torrente = {
    filename: document.getElementById('filename').value,
    filesize: parseInt(document.getElementById('filesize').value), // el parseInt también redondea, asi que no habrá problemas con decimales.
    nodeIP: document.getElementById('nodeIP').value,
    nodePort: parseInt(document.getElementById('nodePort').value),
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
    .then(response => response.json()) // el servidor nos responde con un valor booleano de confirmación (true/false).
    .then(data => {
        let mensaje_estado; // mostramos en el navegador el éxito o no del alta del archivo con una alerta.
        let filename = document.getElementById('filename').value;
        
        if(data)
          mensaje_estado = `El archivo "${filename}" ha sido dado de alta en la red con éxito!`;
        else
          mensaje_estado = `Hubo un error al intentar dar de alta el archivo "${filename}" en la red, inténtelo nuevamente.`;
        
        alert(mensaje_estado);

        // Limpiamos los campos del formulario
        //document.getElementByName("formulario").reset(); //no hago directamente este reset porque genera un nuevo GET
        document.getElementById('filename').value = "";
        document.getElementById('filesize').value = "";
        document.getElementById('nodeIP').value = "";
        document.getElementById('nodePort').value = "";
    });

}


function crear_tabla_dinamica(lista_archivos){

   var col = [];

   for (var i = 0; i < lista_archivos.length; i++) {
       for (var key in lista_archivos[i]) {
           if (col.indexOf(key) === -1 && key !== 'id') { // preferimos que los hashes no sean visibles en una columna de la tabla.
               col.push(key);
           }
       }
   }

  col.push(""); // columna del boton (lo dejaremos sin nombre)

  // CREATE DYNAMIC TABLE.
  var table = document.createElement("table");

  // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

   var tr = table.insertRow(-1);                   // TABLE ROW = fila.

   for (var i = 0; i < col.length; i++) {
       var th = document.createElement("th");      // TABLE HEADER.
       // ya que sabemos con exactitud que columnas tendremos, lo podemos predefinir.
       let nombre_columna;
       switch(col[i]){
          case 'filename': nombre_columna = "Nombre del Archivo";
                           break;
          case 'filesize': nombre_columna = "Tamaño del Archivo";
                           break;
          default: nombre_columna = ""; //sería la columna del boton
       }
       th.innerHTML = nombre_columna;   //sirve para asignar dato
       tr.appendChild(th);
   }

  // ADD JSON DATA TO THE TABLE AS ROWS.
   for (var i = 0; i < lista_archivos.length; i++) {

       var hash_archivo = lista_archivos[i]['id']; // resguardamos el valor del hash del archivo actual para luego agregarlo al boton de descarga.

       tr = table.insertRow(-1);

       for (var j = 0; j < col.length-1; j++) { // con el '-1' evitamos evaluar la columna del botón.
           var tabCell = tr.insertCell(-1);
           tabCell.innerHTML = lista_archivos[i][col[j]];
       }
      //Create an input type dynamically.   
      var buttond = document.createElement("input");
      //Assign different attributes to the element. 
      buttond.setAttribute("type", "button");
      buttond.setAttribute("value", "descargar");
      buttond.setAttribute("name", hash_archivo); // si le pusiera al nombre del atributo 'hash', por alguna razon despues no anda bien.
      //buttond.setAttribute("onclick", solicitud_descarga());
      buttond.onclick = function () {
          solicitud_descarga(this.name); // referencia a un atributo del propio elemento (el boton creado dinamicamente en este caso).
      }
      var tabCell = tr.insertCell(-1);
      tabCell.append(buttond);
   }

   // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
   var divContainer = document.getElementById("showData");
   divContainer.innerHTML = "";
   divContainer.appendChild(table);

}