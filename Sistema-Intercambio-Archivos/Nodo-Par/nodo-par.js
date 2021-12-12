const prompt = require('prompt-sync')();
const fs = require('fs');
const net = require('net'); // para conexion TCP entre pares
const udp = require('dgram'); // para conexion UDP par->tracker


// ******************************* CONFIGURACION IP Y PUERTO *******************************

const contenido_config = fs.readFileSync('config.json');
const config_pares = JSON.parse(contenido_config);
let id_par;
do{
  id_par = prompt("Ingrese el N° de par [1-4]: ");
  id_par = Number(id_par);
}
while(id_par < 1 || id_par > 4);

// Obtenemos la config específica del par
const p = config_pares[id_par-1]; // creo que no es necesario preguntar si p.id==id_par
const my_IP = p.ip; 
const my_port = p.port;


// ************************** SELECCIÓN DE LA ACCION A SEGUIR *******************************

let accion;
do{
  accion = prompt("Ingrese que operacion realizar, Descargar [D] o Compartir [C]: ");
  accion = accion.toLowerCase();
}
while(accion != 'd' && accion != 'c');

if(accion == 'd')
    inicio_descarga();
else
    inicio_compartir();


// ******************************* ENVIAR ARCHIVO A OTRO PAR *******************************

function inicio_compartir(){

    // TCP server
    // server.js

    const server = net.createServer(conexionEntrante);

    server.listen(my_port, function () { // no se si escucha en ese mismo puerto, creo que no hay problema 
        console.log('Compartiendo archivos en la red...');
    });

    function conexionEntrante (socket) {

        const sha1 = require('sha1');

        socket.on('data', function(data) {
            let solicitud = JSON.parse(data.toString());
            let hash = solicitud['hash']; //hash buscado
            let hash_actual;
            let respuesta;

            //parte del codigo sacado de https://www.codegrepper.com/code-examples/javascript/javascript+foreach+file+in+directory
            
            const path = require('path');
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

                            socket.write(respuesta); //mando el contenido del archivo.
                            console.log(`Archivo ${filename} enviado!`);
                        });
                    }
                });
                // aca se puede agregar un if !respuesta ... enviar un archivo no encontrado o algo asi.
            });
        });

        //server.close(); no cerramos el server para que quede siempre compartiendo archivos.
    }

}


// ******************************* DESCARGA ARCHIVO DESDE ARCHIVO.TORRENTE *******************************

function inicio_descarga(){
    const file = prompt("Ingrese el nombre del archivo .torrente: "); //file hola.torrente 
    // abro archivo paso a JSON y extraigo hash, ip y puerto del tracker
    fs.readFile(file, 'utf-8', (err,data) => {
        if (err){
            console.log(err);
            return;
        }
        const torrente = JSON.parse(data);
        let hash = torrente['hash'];
        let ip_tracker = torrente['trackerIP'];
        let port_tracker = torrente['trackerPort'];
        solicitar_descarga(hash, ip_tracker, port_tracker); 
     });
}

// comunicacion con trackers
    // Solicitud archivo torrente
    function solicitar_descarga(hash, ip_tracker, port_tracker){
        let pares;
        let nombre_archivo;

        let search = {
            // --- POR INTEROPERABILIDAD, AHORA LOS messageId SON UN STRING ALEATORIO, PARA DISTINGUIR MENSAJES DEL MISMO TIPO EN LOS TRACKERS ---
            messageId: Math.random().toString(), // De este atributo se encargan los nodos tracker.
            route: `/file/${hash}`,
            originIP: my_IP,
            originPort: my_port,
            body: {}
        };

        const client = udp.createSocket('udp4');
        // para especificar el puerto UDP que tendrá el nodo par (no traera conflictos con el puerto TCP, ya que son 2 protocolos distintos).
        client.bind(my_port, my_IP);
        client.send(JSON.stringify(search), port_tracker, ip_tracker);
        client.on('message', function (msg) { 
            let respuesta = JSON.parse(msg.toString()); //llega un found
            //console.log(respuesta);
            //console.log(respuesta.body.pares);
            pares = respuesta['body']['pares']; //aca tengo el arreglo de pares: [{parip, },{}]
            nombre_archivo = respuesta['body']['filename'];

            //ACA SIEMPRE ACCEDO AL PRIMERO, PODRIAMOS HACER QUE SI ESA DESCARGA ME DEVUELVE UN ERROR INTENTE CON EL SEGUNDO
            const ip_par = pares[0]['parIP'] ;
            const port_par = pares[0]['parPort'];
            descargar(hash,ip_par,port_par, nombre_archivo);

            client.close();
        });

        
    }
    

// comunicacion con otros pares
    //Solicitud de descarga de archivo (abrir un socket, consultar el archivo y empezar a pasar bytes)

    function descargar(hash, ip_par, port_par, nombre_archivo){
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
            console.log(`Archivo ${nombre_archivo} descargado!`);
            client.end();
        });
    }


    
