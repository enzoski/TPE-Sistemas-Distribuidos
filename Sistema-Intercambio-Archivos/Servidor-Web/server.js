
const http = require('http');

const server = http.createServer(function (request, response) {

    console.log('Connected');
    let consulta = '';

    request.on('data', (chunk) => {
        consulta += chunk;
    });

    request.on('end', () => {
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
    let hash = "";

    let tipo = 0;

    //parseo, cambio a tipo y asignacion a variables.
    //cambiar parseo por lgo que ande mejor en toda situacion 

    let words = consulta.split(' ');
    console.log(words);

    if(words[0]=='POST'){
        tipo = 1;
        path = words[1].replace(',','');
        id = words[5].replace(',','');
        filename = words[7].replace(',','');
        nodePort = words[9].replace(',','');
        nodeIP = words[11].replace(',','');
        hash = words[13].replace('}','');
    }
    else if(words[0]=='GET'){                           //GET /file/{hash}
        let atrib= words[1].split(/['{,}']/);
        path = atrib[0].replace(',','');
        tipo = 2;
        if(atrib.length = 2){
            hash = atrib[1].replace('{','').replace('}','');
            tipo = 3;
        }
        
    }

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


function listar_archivo(){

}


function solicitud_descarga(hash){ 
    // hipotesis: el hash lo manda el cliente que se calcula usando el nombre y tamaño del archivo.
    // aca se hace una llamada a tracker.
}
