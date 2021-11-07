// La lista doblemente enlazada circular de nodos tracker, no se conforma en memoria,
// sino que es la forma de representar la comunicación que tienen entre ellos mediante UDP.

const udp = require('dgram');
const fs = require('fs');

// Clase que representa a un Nodo Tracker (podríamos llegar a hacer algo así).
const NodoTracker = function (id, ip, port, vecinos, es_primer_tracker){ //Hay que ver como vamos a distribuir la tabla hash en los nodos
    
    this.id = id; // Los nodos trackers tienen un identificador único.
    this.ip = ip; // IP para recibir mensajes de otro nodo tracker o del servidor web (UDP).
    this.port = port; // Puerto para recibir mensajes de otro nodo tracker o del servidor web (UDP).
    this.vecinos = vecinos; // Nodos trackers vecinos, es de la forma [{ip:'ip', port:'port'}, {ip:'ip', port:'port'}]
    this.es_primer_tracker = es_primer_tracker; // flag para identificar al primer nodo tracker de la "lista".

    this.tabla_hash = new HashTable(255); // estructura tipo diccionario {clave:valor}; puse 255 para probar


    this.agregar_archivo = function (hash, filename, filesize, pair_nodes){
        
        this.tabla_hash.insert(hash,[filename,filesize,pair_nodes]);

        //this.tabla_hash[hash] = [filename, filesize, pair_nodes];

        // 'pair_nodes' es una lista cuyos elementos son objetos del tipo {pairIP:'ip', pairPort:port}
        // que representan al socket TCP del nodo par que contiene parte del archivo en cuestión.
        // (asumo que será algo asi, hay que revisarlo..)
    }

    this.escuchar_UDP = function (){
        
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

          //console.log(`Respuesta desde tracker [${server.address().address}:${server.address().port}]: Alta del archivo confirmado!\n`);
          server.send('respuesta', remotePort, remoteAddress); // For connectionless sockets, the destination port and address must be specified
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
        console.log(this.tabla_hash);
    }

    this.toString = function (){
      let str = `[NodoTracker] id=${this.id} ip=${this.ip} port=${this.port}
              vecinos=${JSON.stringify(this.vecinos)} es_primer_tracker=${this.es_primer_tracker}`;
      return str;
    }
    
}

//Clase que representa a la estructura de tabla hash
const HashTable = function (size_nodo){ //size es para especificar el tamaño en cada nodo. 
    this.size = size_nodo;
    this.buckets = Array(this.size);

    for(let i=0; i < this.buckets.length ;i++){ //para instanciar Map[key,value]
        this.buckets[i] = new Map(); 
    } 

    this.insert = function (key,value){
        let i=Number.parseInt(key,16); //al hash lo parseo a decimal para el indice
        this.buckets[i].set(key,value);
    }

    this.remove = function (key){
        let i=Number.parseInt(key,16);
        let deleted = this.buckets[i].get(key);
        this.buckets[i].delete(key);
        return deleted;
    }

    this.search = function(key){
        let i=Number.parseInt(key,16);
        return this.buckets[i].get(key);
    }

    this.toString = function(){ //Debe haber una mejor manera de iterar 
        for(let i=0;i<this.buckets.length;i++){
            console.log(this.buckets[i]);
        }
    }
} 

// Leemos y parseamos la configuración inicial de los nodos trackers (archivo JSON)
let contenido_config = fs.readFileSync('config.json');
let config_trackers = JSON.parse(contenido_config);
console.log(config_trackers);

// Obtenemos la config de cada tracker (el JSON es un arreglo de objetos)
t1 = config_trackers[0];
t2 = config_trackers[1];
t3 = config_trackers[2];
t4 = config_trackers[3];

// Instanciamos los nodos trackers (definimos que serán 4)
const nodo_tracker_1 = new NodoTracker(t1.id, t1.ip, t1.port, t1.vecinos, t1.es_primer_tracker); 
const nodo_tracker_2 = new NodoTracker(t2.id, t2.ip, t2.port, t2.vecinos, t2.es_primer_tracker); 
const nodo_tracker_3 = new NodoTracker(t3.id, t3.ip, t3.port, t3.vecinos, t3.es_primer_tracker); 
const nodo_tracker_4 = new NodoTracker(t4.id, t4.ip, t4.port, t4.vecinos, t4.es_primer_tracker); 

console.log(nodo_tracker_1.toString());
console.log(nodo_tracker_2.toString());
console.log(nodo_tracker_3.toString());
console.log(nodo_tracker_4.toString());

//PROBANDO LA IMPPLEMENTACION HASH

nodo_tracker_1.agregar_archivo('3a','Sims',60,['1',20]); //probando, funciona, ok
if(nodo_tracker_1.tabla_hash.search('3a')){ //para ver si esta el key '3a', funciona ok
    console.log('True');
}
nodo_tracker_1.tabla_hash.toString();

// Cada nodo tracker comienza a escuchar en su puerto UDP
nodo_tracker_1.escuchar_UDP();
nodo_tracker_2.escuchar_UDP();
nodo_tracker_3.escuchar_UDP();
nodo_tracker_4.escuchar_UDP();
// [esto de que los 4 trackers escuchen a la vez (en distintos puertos) sin quedarnos bloqueados en el primero,
// es posible gracias a que los métodos de UDP son asincronicos (actuan como hilos de ejecucion distintos al 'main')
// igual hay que preguntar si para el tp podemos hacerlo así, o si hay que abrir cada tracker en una consola distinta].



/*
// ---------pruebas-instancias-nodos-tracker-------------
const nodo_tracker_1 = new NodoTracker(1); //instancio un nodo tracker
nodo_tracker_1.mostrar_archivos();
nodo_tracker_1.agregar_archivo(123, 'matrix.torrente', 999, [{pairIP: '192.168.0.2', pairPort: 8080},
                                                             {pairIP: '192.168.0.3', pairPort: 8080}
                                                             ]);
nodo_tracker_1.agregar_archivo(200, 'hp1.torrente', 888, [{pairIP: '192.168.0.4', pairPort: 8080},
                                                          {pairIP: '192.168.0.5', pairPort: 8080}
                                                         ]);
nodo_tracker_1.mostrar_archivos();
console.log(nodo_tracker_1.tabla_hash[123][2][0]); //muestro la referencia al primer nodo par del primer archivo.
console.log();

const nodo_tracker_2 = new NodoTracker(2);
nodo_tracker_2.agregar_archivo(250, 'la_isla_del_tesoro.torrente', 222, [{pairIP: '192.168.0.6', pairPort: 8080},
                                                                         {pairIP: '192.168.0.7', pairPort: 8080}
                                                                        ]);
*/
