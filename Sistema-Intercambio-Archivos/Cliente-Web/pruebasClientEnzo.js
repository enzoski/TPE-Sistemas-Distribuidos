// ESTO FUE LO QUE SE ME OCURRIÓ EN BASE A LA DOCU QUE LEÍ.
// YO LE PREGUNTARIA AL PROFE SI SÍ O SÍ HAY QUE HACER ESO DEL PARSEO,
// PORQUE DE ESTA FORMA NO HARÍA FALTA USARLO, YA QUEDAN LAS PETICIONES ESTRUCTURADAS.

const http = require('http');

// INTERFAZ CLIENTE-SERVIDOR [HTTP]
const options_alta_torrente = {
  //host: 'localhost', // la url completa sería: 'http://localhost:8080/file'
  //port: 8080,
  path: '/file', // si no ponemos path, por defecto es '/'.
  method: 'POST'
};

const options_listar_torrentes = {
  //host: 'localhost', // la url completa sería: 'http://localhost:8080/file'
  //port: 8080,
  path: '/file',
  method: 'GET'
};

const options_descargar_torrente = {
  //host: 'localhost', // la url completa sería: 'http://localhost:8080/file/{hash}'
  //port: 8080,
  path: '/file/{hash}',
  method: 'GET'
};


// SE APRETÓ BOTON X LLAMA A FUNCION:
function seApretoBotonX(boton){
    if(boton == 'alta'){
        const body = "{id: '1', filename: 'matrix.torrente', filesize: 999, nodeIP: '1.1.1.1', nodePort: 123}";
        peticion_cliente(options_alta_torrente, body);
    }
    else if(boton == 'listar')
        peticion_cliente(options_listar_torrentes);
    else if(boton == 'descargar')
        peticion_cliente(options_descargar_torrente);

}

// NOS COMUNICAMOS CON EL SERVIDOR
function peticion_cliente(options, body=''){ // `body` es opcional, solo se requiere en el alta de archivos (POST)
    
    // https://nodejs.org/api/http.html#http_http_request_options_callback
    const request = http.request('http://localhost:8080', options, function (response) {

      let body_respuesta = ''

      // preguntar si la respuesta siempre viene en 'pedacitos'
      // y si sí o si tiene que ser un string (al parecer si, fijarse docu).
      response.on('data', (chunk) => {
        body_respuesta += chunk;
      });

      // gestionamos la respuesta del servidor
      response.on('end', () => {
        console.log('2) Received: ' + body_respuesta);
        if(options.method == 'POST'){
            // calculo que el servidor nos informará el éxito o fracaso del alta del torrent, y lo mostraríamos en el navegador.
        }
        else if(options.method == 'GET' && options.path == '/file'){
            // el server nos devolvería el listado de todos los torrents, y lo mostraríamos en el navegador.
        }
        else if(options.method == 'GET' && options.path == '/file/{hash}'){
            // hay que ver como sería la onda de que el server nos mande un archivo.
        }
      });

      response.on('close', () => {
          console.log('3) Connection closed\n');
      });

    });

    // Mandamos la peticion al servidor

    console.log(`1) Peticion: ${JSON.stringify(options)}`); //es para mostrar el objeto como string

    // WRITE SERIA SOLO PARA POST, EN UN GET SOLO SOLICITAMOS COSAS, NO MANDAMOS DATOS.
    // SI PROBAMOS DE USAR EL WRITE CON UNA PETICION GET, NO LE VA A LLEGAR NADA AL SERVER.
    // (y de hecho medio que se rompe la cosa, porque el cliente no recibe una respuesta del server)
    if(options.method == 'POST')
        request.write(body); //https://nodejs.org/api/http.html#http_response_write_chunk_encoding_callback

    request.end(); // CON ESTO ALCANZA PARA HACER UN GET.

    // (por lo que entendí, el BODY de un POST son los datos que el cliente le manda al server)
    // (ejemplo: const body = "{id: '1', filename: 'matrix.torrente', filesize: 999, nodeIP: '1.1.1.1', nodePort: 123}";)
}

// ------------------------------------------------

// pruebas
seApretoBotonX('alta');
setTimeout(seApretoBotonX, 3000, 'listar'); //para que no se superpongan las respuestas en la consola
setTimeout(seApretoBotonX, 5000, 'descargar');