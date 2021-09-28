
const http = require('http');

const server = http.createServer(function (request, response) {

    console.log('Connected');
    let consulta = '';

    request.on('data', (chunk) => {
        consulta += chunk;
    });

    request.on('end', () => {                           // ver si esta bien que sea on 'end'
		//llamado a funcion de ejecucion de consulta
        respuesta = ejecutar_consulta(consulta);
        response.end(respuesta);
    });

    request.on('close', () => {
		console.log('Socket closed');
    });

});

server.listen(8080, function() {
    console.log('Server started');
});


// funcion ejecucion

function ejecutar_consulta(consulta){

    let path = "";
    let id = "";
    let filesize = 0;
    let filename = "";
    let nodePort = 0;
    let nodeIP = "";
    let hash = ""; // ???????????????????????????????????

    let tipo = 0;
    //parseo, cambio a tipo y asignacion a variables.
    if (tipo== 1) { 
        alta_archivo(path, id, filename, filesize, nodeIP,nodePort);
    } 
    else{
        if (tipo== 2){
            listar_archivo(path);
        } 
        else{
            if (tipo== 3){
                solicitud_descarga(path,hash);
            }
        }
    }
}

/** 
POST /file/
body: {
    id: str,
    filename: str,
    filesize: int,
    nodeIP: str,
    nodePort: int
}

GET /file


GET /file/{hash}

*/

//funciones 

function alta_archivo(path, id, filename, filesize, nodeIP,nodePort){

}


function listar_archivo(path){

}


function solicitud_descarga(path, hash){ // hipotesis: el hash lo manda el cliente que se calcula usando el nombre y tamaño del archivo.

    // aca se hace una llamada a tracker.
}
