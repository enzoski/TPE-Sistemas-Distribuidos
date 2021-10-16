const http = require('http');
const URL_server = 'http://localhost:8080/';

const request = http.request(URL_server, { method: 'POST' }, function (response) {

  let respuesta = ''
  response.on('data', (chunk) => {
    respuesta += chunk;
  });

  response.on('end', () => {
      console.log(respuesta);
  });

});

// alta_archivo('path/path','1234','nombre.txt','200','2','8080');
listar_archivo();

function alta_archivo(path, id, filename, filesize, nodeIP,nodePort){
    var peticion = `POST  ${path} body: { id: ${id}, filename: ${filename}, filesize: ${filesize}, nodeIP: ${nodeIP}, nodePort: ${nodePort}}`;
    request.write(peticion);
    request.end();
}

function listar_archivo(){
    request.write('GET /file');
    request.end();
}

function solicitud_descarga(hash){ 
    request.write('GET /file ' + hash);
    request.end();
}


