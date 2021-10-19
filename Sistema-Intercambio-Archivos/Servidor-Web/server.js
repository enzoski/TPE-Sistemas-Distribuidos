
const http = require('http');

const server = http.createServer(function (request, response) {

    console.log('Connected');
    let consulta = '';

    request.on('data', (chunk) => {
        consulta += chunk;
    });

    request.on('end', () => {
		//llamado a funcion de ejecucion de consulta
        //respuesta = ejecutar_consulta(consulta);
        //response.end(respuesta);
        response.end("respuesta del servidor");
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


function listar_archivo(){
    return 'lista nombres y tamaños de archivos';
}


function solicitud_descarga(hash){ 
    return 'archivo descargado';
}