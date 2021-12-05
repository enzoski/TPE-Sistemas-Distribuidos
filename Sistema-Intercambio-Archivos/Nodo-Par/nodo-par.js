const prompt = require('prompt-sync')();


// ******************************* CONFIGURACION IP Y PUERTO *******************************

const contenido_config = fs.readFileSync('config.json');
const config_pares = JSON.parse(contenido_config);
let id_par;
do{
  id_par = prompt("Ingrese el N° de par [1-4]: ");
  id_par = Number(id_par);
}
while(id_tracker < 1 || id_tracker > 4);

// Obtenemos la config específica del par
const t = config_pares[id_par-1]; // creo que no es necesario preguntar si t.id==id_par
const my_IP = t.ip; 
const my_port = t.port;  


// ******************************* DESCARGA ARCHIVO DESDE ARCHIVO.TORRENTE *******************************
const file = prompt("archivo torrente:"); //file hola.torrente 
// abro archivo paso a JSON y extraigo hash, ip y puerto del tracker
let fs = require('fs');
fs.readFile(file, 'utf-8', (err,data) => {
    if (err){
        console.log(err);
        return;
    }
const torrente = JSON.parse(data);
let hash = torrente['hash'];
let ip_tracker = torrente['ip_tracker'];
let port_tracker = torrente['port_tracker'];
solicitar_descarga(hash, ip_tracker, port_tracker); 
 });


// comunicacion con trackers
    // Solicitud archivo torrente
    function solicitar_descarga(hash, ip_tracker, port_tracker){
        let pares;
        let nombre_archivo;

        let search = {
            messageId: '123', // ???
            route: `/file/${hash}`,
            originIP: my_IP,
            originPort: my_port
        } ;

        const client = udp.createSocket('udp4');
        client.send(JSON.stringify(search), port_tracker, ip_tracker);
        client.on('message', function (msg) { 
            let respuesta = JSON.parse(msg.toString()); //llega un found
            pares = respuesta['body']['pares']; //aca tengo el arreglo de pares: [{parip, },{}]
            nombre_archivo = respuesta['filename'];
            client.close();
        });

        //ACA SIEMPRE ACCEDO AL PRIMERO, PODRIAMOS HACER QUE SI ESA DESCARGA ME DEVUELVE UN ERROR INTENTE CON EL SEGUNDO

        let ip_par = pares[0]['parIP'] ;
        let port_par = pares[0]['parPort'];
        descargar(hash,ip_par,port_par, nombre_archivo);
    }
    

// comunicacion con otros pares
    //Solicitud de descarga de archivo (abrir un socket, consultar el archivo y empezar a pasar bytes)

    function descargar(hash, ip_par, port_par, nombre_archivo){
        const fs = require('fs');
        const net = require('net');
        const client = new net.Socket();
        let solicitud = JSON.stringify({
            type: 'GET FILE',
            hash: hash
        });

        client.connect(port_par, ip_par, function() {
            client.write(solicitud);
        });

        client.on('data', function(data) {
            fs.writeFile(nombre_archivo, data, (err) => {
            if (err)
                console.log(err);
            });
            client.end();
        });
    }


// ******************************* ENVIAR ARCHIVO A OTRO PAR *******************************

// TCP server
// server.js

const net = require('net');
const server = net.createServer(conexionEntrante);

server.listen(my_port, function () { // no se si escucha en ese mismo puerto, creo que no hay problema 
  console.log('Server started');
});

function conexionEntrante (socket) {

    const fs = require('fs');
    const sha1 = require('sha1');

	socket.on('data', function(data) {
		let solicitud = JSON.parse(data.toString());
        let hash = solicitud['hash']; //hash buscado
        let hash_actual;
        let respuesta;

        //parte del codigo sacado de https://www.codegrepper.com/code-examples/javascript/javascript+foreach+file+in+directory
        
        const path = require('path');
        const fs = require('fs');
        const directoryPath = path.join(__dirname, 'archivos');
        fs.readdir(directoryPath, function (err, files) {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 
            files.forEach(function (file) {
                let filename = file;
                var stats = fs.statSync(`./archivos/${file}`);
                let filesize = stats.size; //en bytes
                hash_actual = sha1(filename+filesize);
                if (hash_actual == hash){
                    
                    fs.readFile(`./archivos/${filename}`, 'utf-8', (err,data) => {
                        if (err){
                            console.log(err);
                            return;
                        }
                        respuesta = data;
                    });
                }
            });
            // aca se puede agregar un if !respuesta ... enviar un archivo no encontrado o algo asi.
        });

		socket.write(respuesta); //mando el contenido del archivo.
	});

    server.close();
}


    
