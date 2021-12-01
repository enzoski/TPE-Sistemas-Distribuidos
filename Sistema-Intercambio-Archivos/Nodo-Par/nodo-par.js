const my_IP = 'localhost'; // IP y PUERTO del primer nodo tracker de la "lista".
const my_port = 4001;  // deberiamos tener un archivo de configuracion como en los trackers porque sino se van a pisar los puertos
    

// terminal par: descargar archivo.torrente
const file = prompt("archivo torrente:");
// abro archivo paso a JSON y extraigo hash, ip y puerto del tracker
var reader = new FileReader();
reader.readAsText(file);
reader.onload = function() {
    const torrente = JSON.parse(reader.result);
    let hash = torrente['hash'];
    let ip_tracker = torrente['ip_tracker'];
    let port_tracker = torrente['port_tracker'];
    solicitar_descarga(hash, ip_tracker, port_tracker);
  };
reader.onerror = function() {
    console.log(reader.error);
  };

// comunicacion con trackers
    // Solicitud archivo torrente
    function solicitar_descarga(hash, ip_tracker, port_tracker){ 
        let search = {
            messageId: '123', 
            route: `/file/{${hash}}`,
            originIP: my_IP,
            originPort: my_port
        } ;

        const client = udp.createSocket('udp4');
        client.send(JSON.stringify(search), port_tracker, ip_tracker);
        client.on('message', function (msg) { 
            let respuesta = JSON.parse(msg.toString());
            const pares = respuesta['body']['pares']; //aca tengo el arreglo de {}
            client.close();
        });
 
        const ip_par =pares[0]['parIP'] ; // esto no anda no se como acceder al elemento!!!
        const port_par = pares[0]['parPort'];
        descargar(hash,ip_par,port_par);
    }
    

// comunicacion con otros pares
    //Solicitud de descarga de archivo (abrir un socket, consultar el archivo y empezar a pasar bytes)

    function descargar(hash, ip_par, port_par){
        let solicitud = JSON.stringify({
            type: 'GET FILE',
            hash: hash
        });
        const net = require('net');
        const client = new net.Socket();

        client.connect(port_par, ip_par, function() {
            client.write(solicitud);
        });

        client.on('data', function(data) {
            console.log('Received: ' + data); // se recibio el stream de bytes
            // convertir el stream de bytes a un file??
            client.end();
        });
    }

// TCP server
// server.js

const net = require('net');
const server = net.createServer(conexionEntrante);

server.listen(my_port, function () { // no se si escucha en ese puerto
  console.log('Server started');
});

function conexionEntrante (socket) {

	socket.on('data', function(data) {
		let solicitud = JSON.parse(data.toString());
        let hash = solicitud['hash'];
        //busco mi archivo que tenga ese mismo hash.
		socket.write('archivo');
	});

    server.close();

}

// Respondo al tracker si tengo un archivo
const udp = require('dgram');
const server = udp.createSocket('udp4');

server.on('error', (err) => {
    console.log(`Error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg,info) => {

    const remoteAddress = info.address;
    const remotePort = info.port;

    console.log(`Mensaje recibido de [${remoteAddress}:${remotePort}]: ${msg}`);
    
    let solicitud = JSON.parse(msg.toString()); 

    server.send('respuesta', remotePort, remoteAddress); 
});

server.on('listening', () => {
    const address = server.address(); // Returns an object containing the address information for a socket
    console.log(`Servidor UDP escuchando en ${address.address}:${address.port} ...\n`);
});

// For UDP sockets, 'bind()' causes the dgram.Socket to listen for datagram messages on a named port and optional address.
// If address is not specified, the operating system will attempt to listen on all addresses (all network interfaces of the computer).
server.bind(this.port, this.ip);