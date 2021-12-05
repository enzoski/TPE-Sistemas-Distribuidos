// La lista doblemente enlazada circular de nodos tracker, no se conforma en memoria,
// sino que es la forma de representar la comunicación que tienen entre ellos mediante UDP.

const udp = require('dgram'); // Para el socket UDP.
const fs = require('fs'); // Para leer el contenido del archivo de configuracion de los trackers.
const prompt = require('prompt-sync')(); // Para ingresar por consola el id del tracker a instanciar.
const HashTable = require('./tabla_hash.js'); // Importamos nuestra implementación de tabla hash (es una clase).
var mensajes_enviados = [];
// Clase que representa a un Nodo Tracker (podríamos llegar a hacer algo así).
const NodoTracker = function (id, ip, port, vecinos, es_primer_tracker){ //Hay que ver como vamos a distribuir la tabla hash en los nodos
    
    this.id = id; // Los nodos trackers tienen un identificador único.
    this.ip = ip; // IP para recibir mensajes de otro nodo tracker o del servidor web (UDP).
    this.port = port; // Puerto para recibir mensajes de otro nodo tracker o del servidor web (UDP).
    this.vecinos = vecinos; // Nodos trackers vecinos, es de la forma [{ip:'ip', port:'port'}, {ip:'ip', port:'port'}]
    this.es_primer_tracker = es_primer_tracker; // flag para identificar al primer nodo tracker de la "lista".

    this.tabla_hash = new HashTable(); // estructura tipo diccionario {clave:valor} donde se mantiene la informacion de los archivos disponibles para intercambio.

    this.agregar_archivo = function (hash, filename, filesize, pares){
        
        // this.tabla_hash[hash] = [filename, filesize, pares];
        this.tabla_hash.insert(hash,[filename,filesize,pares]);

        // 'pares' es una lista cuyos elementos son objetos del tipo {parIP:'ip', parPort:port}
        // que representan al socket TCP del nodo par que contiene parte del archivo en cuestión.
        // (asumo que será algo asi, hay que revisarlo..)
    }

    this.escuchar_UDP = function (){
        
        const server = udp.createSocket('udp4');

        server.on('error', (err) => {
          console.log(`Error:\n${err.stack}`);
          server.close();
        });

        // despues hay que ver bien si conviene que estas funciones esten acá o no.
        
        function scan(solicitud){
            // Esto solo lo haria el 1er tracker; todos los demas solo agregan archivos a la estructura ya hecha.
            if(solicitud.body == undefined){
                solicitud.body = {
                                    files: []
                                 }
            }

            let arreglo_archivos = this.tabla_hash.getArchivosScan();
            arreglo_archivos.forEach(element => solicitud.body.files.push(element));

        }

        function search (solicitud){
            let archivoEncontrado = this.tabla_hash.busquedaArchivo();
            if(archivoEncontrado !== 0){ //Si no se encontró es igual a cero, seguro hay una forma mejor
                solicitud.body.id = archivoEncontrado.hash;
                solicitud.body.filename = archivoEncontrado.filename;
                solicitud.body.filesize = archivoEncontrado.filesize;                 
            }
        }

        function found(solicitud,trackerIP,trackerPort){ //es para transformalo en found, no se si es correcto
            solicitud.route = solicitud.route + '/found';
            solicitud.body.trackerIP = trackerIP;
            solicitud.body.trackerPort = trackerPort;
            solicitud.body.pares = []; //Es correcto así?
        }


        function calcular_destino(messageId,trackerVecinos,esPrimerTracker){
            let destino;
            if(esPrimerTracker && mensajes_enviados.includes(messageId) ){ //Volvi al primer tracker y el messageId es igual a su mensaje original, corto el recorrido
                destino.port = 8080; //servidor
                destino.ip = 'localhost'; //servidor
                let i = mensajes_enviados.indexOf(messageId);
                mensajes_enviados.splice(i,1); //i es el indice y 1 es la cant de elementos a eliminar
             }
             else{
                if(esPrimerTracker){ //Si el mensaje está indefinido es porque todavía no comenzó el recorrido
                    mensajes_enviados.push(solicitud.messageId);
                }
                destino.port = trackerVecinos[1].port;
                destino.ip = trackerVecinos[1].ip;
             }
             return destino;
        }

        function count(solicitud,es_primer_tracker){
            if(es_primer_tracker){ //si estoy en el primer tracker, inicializo los valores
                solicitud.body = {
                                trackerCount: 1,
                                fileCount: 0                   
                                }
            }
            solicitud['body']['trackerCount']++; 
            solicitud['body']['fileCount']= this.tabla_hash.getCantArchivos();
        }

        function reformulaMessageId(solicitud,es_primer_tracker,tipo_peticion){
            if(es_primer_tracker){ //si estoy en el primer tracker, reformulo el atributo messageID
                solicitud['messageId'] = tipo_peticion;
            }
        }

       
        server.on('message', (msg,info) => {

          //const remoteAddress = info.address;
          //const remotePort = info.port;

          let destino; // objeto del tipo {ip: valor_ip, port: valor_port}
          

          console.log(`Mensaje recibido de [${remoteAddress}:${remotePort}]: ${msg}`);
            
          let solicitud = JSON.parse(msg); // Lo que hacemos es modificar esta misma variable (solicitud), en vez de hacer una nueva variable para el 'send'.
          let partes_mensaje = solicitud.route.split('/'); //me da un arreglo con cadenas entre /
          
          //Es para identificar qué tipo de petición 
          
          if(partes_mensaje.includes('scan')){ //es true si dentro del arreglo hay scan
                reformulaMessageId(solicitud,this.es_primer_tracker,'1');
                scan(solicitud);
                destino = calcular_destino(solicitud.messageId,this.vecinos,this.es_primer_tracker); 

          }
          else if(partes_mensaje.includes('store')){ //es true si dentro del arreglo hay store, store es para agregar archivo
                reformulaMessageId(solicitud,this.es_primer_tracker,'3');
                store();
                destino = calcular_destino(solicitud.messageId,this.vecinos,this.es_primer_tracker); 

          }
          else if(partes_mensaje.includes('count')){ //es true si dentro del arreglo hay count 
                reformulaMessageId(solicitud,this.es_primer_tracker,'4');
                count(solicitud,this.es_primer_tracker); 
                destino = calcular_destino(solicitud.messageId,this.vecinos,this.es_primer_tracker);
          }
          else { //eso ultimo porque la ruta de search es route:file/hash
            if(partes_mensaje.includes('file')){ //solo para controlar que nos hayan mandado un mensaje valido
                //vamos a la función search
                reformulaMessageId(solicitud,this.es_primer_tracker,'2');
                search(solicitud);
                if(solicitud.body == undefined ) //si no encontre, llamo al tracker vecino. 
                    destino = calcular_destino(solicitud.messageId,this.vecinos,this.es_primer_tracker);
                found(solicitud,this.ip,this.port);//se manda siempre al servidor
                destino.port = 8080; //el puerto del servidor
                destino.ip = 'localhost'; //el ip del servidor
            }
            // si nos mandaron cualquier cosa, descartamos el mensaje (no hacemos nada)
             
          }



          

          //console.log(`Respuesta desde tracker [${server.address().address}:${server.address().port}]: Alta del archivo confirmado!\n`);
          server.send(solicitud, destino.port, destino.ip); // For connectionless sockets, the destination port and address must be specified
        });

        server.on('listening', () => {
          const address = server.address(); // Returns an object containing the address information for a socket
          console.log(`Servidor UDP escuchando en ${address.address}:${address.port} ...\n`);
        });

        // For UDP sockets, 'bind()' causes the dgram.Socket to listen for datagram messages on a named port and optional address.
        // If address is not specified, the operating system will attempt to listen on all addresses (all network interfaces of the computer).
        server.bind(this.port, this.ip);
    }

    this.mostrar_archivos = function (){
        console.log(this.tabla_hash.toString());
    }

    this.toString = function (){
      let str = `[NodoTracker] id=${this.id} ip=${this.ip} port=${this.port}
              vecinos=${JSON.stringify(this.vecinos)} es_primer_tracker=${this.es_primer_tracker}
              tabla_hash=${this.tabla_hash.toString()}`;
      return str;
    }
    
}



// ******************************* MAIN *******************************

// Leemos y parseamos la configuración inicial de los nodos trackers (archivo JSON)
const contenido_config = fs.readFileSync('config.json');
const config_trackers = JSON.parse(contenido_config);
//console.log(config_trackers);

// Solicitamos ingresar por consola el número de tracker a instanciar (cada nodo tracker se ejecutará en una consola distinta)
let id_tracker;
do{
  id_tracker = prompt("Ingrese el N° de tracker a instanciar [1-4]: "); // definimos que en total el sistema tendrá 4 nodos tracker.
  id_tracker = Number(id_tracker); // parseamos el input a numero, ya que es un string.
}
while(id_tracker < 1 || id_tracker > 4);

// Obtenemos la config específica del tracker a instanciar (el JSON es un arreglo de objetos)
const t = config_trackers[id_tracker-1];

// Instanciamos el nodo tracker
const nodo_tracker = new NodoTracker(t.id, t.ip, t.port, t.vecinos, t.es_primer_tracker);
console.log(nodo_tracker.toString());

// El nodo tracker comienza a escuchar en su puerto UDP
nodo_tracker.escuchar_UDP();



// ---------pruebas-instancias-nodos-tracker-con-tabla-hash-------------
/*
nodo_tracker.mostrar_archivos();

nodo_tracker.agregar_archivo('1f4b', 'matrix', 999, [{parIP: 'localhost', parPort: 4001},
                                                     {parIP: 'localhost', parPort: 4002}
                                                    ]);
nodo_tracker.agregar_archivo('3a1b', 'harry_potter_1', 888, [{parIP: 'localhost', parPort: 4001},
                                                             {parIP: 'localhost', parPort: 4002}
                                                            ]);
// prueba de colisión.
nodo_tracker.agregar_archivo('3a8c', 'los_sims', 60, [{parIP: 'localhost', parPort: 4003},
                                                      {parIP: 'localhost', parPort: 4004}
                                                     ]);

nodo_tracker.mostrar_archivos();

if(nodo_tracker.tabla_hash.search('3a8c')) //para ver si esta el key '3a8c'.
    console.log('True. "Los Sims" está en la tabla hash.\n');
else
    console.log('False. "Los Sims" NO está en la tabla hash.\n');

console.log(nodo_tracker.tabla_hash.search('1f4b')[2][0]); //muestro la referencia al primer nodo par del primer archivo.
*/

