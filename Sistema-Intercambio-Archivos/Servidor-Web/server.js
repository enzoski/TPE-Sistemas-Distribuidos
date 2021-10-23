
const http = require('http');

const server = http.createServer(function (request, response) {

    // Información sobre la petición del cliente
    // https://nodejs.org/api/http.html#http_class_http_incomingmessage
    const metodo_peticion_cliente = request.method;
    const path_peticion_cliente = request.url;

    console.log(`[${Date().split(' ')[4]}]`) // para las pruebas quise mostrar la hora en que llega una petición
    console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
    
    // Cuerpo del mensaje de un POST (los GET en teoría no deberían mandar nada)
    let body = '';
    request.on('data', (chunk) => {
        body += chunk;
    });

    // Gestión de la petición HTTP recibida del cliente (en nuestro caso, el navegador)
    request.on('end', () => {
        console.log('Cuerpo del mensaje recibido: ' + body);
        let respuesta = 'ERROR, petición no válida...';
        if(metodo_peticion_cliente == 'GET' && path_peticion_cliente == '/'){ // Página de inicio
          // la onda sería leer el contenido de nuestro "index.html" para mandarselo al navegador (y él lo interpretará y lo mostrará en pantalla)
          const index_torrente = '<html> <head> <title>Torrente Bay</title> </head> <body> <h1>BIENVENIDOS AL HIMALAYA!</h1> <a href="/file">Listar torrentes.</a> </body> </html>';
          respuesta = index_torrente;
        }
        else if(metodo_peticion_cliente == 'GET' && path_peticion_cliente == '/file') // Página de listado de torrentes
          respuesta = listar_archivos();
        else if(metodo_peticion_cliente == 'GET' && path_peticion_cliente == '/file/hash')
          respuesta = solicitud_descarga();
        else if(metodo_peticion_cliente == 'POST' && path_peticion_cliente == '/file')
          respuesta = alta_archivo(body);
        console.log(`Respuesta: ${respuesta}`);
        response.end(respuesta); // Le respondemos al cliente (navegador web)
		
        //llamado a funcion de ejecucion de consulta
        //respuesta = ejecutar_consulta(consulta);
        //response.end(respuesta);
        //response.end("respuesta del servidor");
    });

    request.on('close', () => {
		console.log('Conexión cerrada\n');
    });

});

const port = 8080;
server.listen(port, function() {
    console.log(`Server started listening at http://localhost:${port} ...\n`);
});


// funcion ejecucion

function ejecutar_consulta(consulta){

    let path = "";
    let id = "";
    let filesize = 0;
    let filename = "";
    let nodePort = 0;
    let nodeIP = "";
    let hash = "";
    let tipo = 0;
    let respuesta = '';

/**
    let words = consulta.split(' ');

    if(words[0]=='POST'){
        tipo = 1;
        path = words[1].replace(',','');
        id = words[5].replace(',','');
        filename = words[7].replace(',','');
        nodePort = words[9].replace(',','');
        nodeIP = words[11].replace(',','');
        hash = words[13].replace('}','');
    }
    else if(words[0]=='GET'){
        let atrib= words[1].split(/['{,}']/);
        tipo = 2;
        if(atrib.length > 1){
            hash = atrib[1];
            tipo = 3;
        }
        
    }
     */
    if (tipo== 1) { 
        respuesta = alta_archivo(path, id, filename, filesize, nodeIP,nodePort);
    } 
    else{
        if (tipo== 2){
            respuesta = listar_archivo();
        } 
        else{
            if (tipo== 3){
                respuesta = solicitud_descarga(hash);
            }
        }
    }

    return respuesta;
}


function alta_archivo(path, id, filename, filesize, nodeIP,nodePort){
    return 'Alta exitosa';
}


function listar_archivos(){
    return 'lista nombres y tamaños de archivos';
}


function solicitud_descarga(hash){ 
    return 'archivo descargado';
}