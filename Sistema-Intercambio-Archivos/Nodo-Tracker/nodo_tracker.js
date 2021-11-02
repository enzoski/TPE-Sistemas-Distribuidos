// La lista doblemente enlazada circular de nodos tracker, no se conforma en memoria,
// sino que es la forma de representar la comunicación que tienen entre ellos mediante UDP.

const fs = require('fs');

// Clase que representa a un Nodo Tracker (podríamos llegar a hacer algo así).
const NodoTracker = function (id, ip, port, vecinos, es_primer_tracker){
    
    this.id = id; // Los nodos trackers tienen un identificador único.
    this.ip = ip; // IP para recibir mensajes de otro nodo tracker o del servidor web (UDP).
    this.port = port; // Puerto para recibir mensajes de otro nodo tracker o del servidor web (UDP).
    this.vecinos = vecinos; // Nodos trackers vecinos, es de la forma [{ip:'ip', port:'port'}, {ip:'ip', port:'port'}]
    this.es_primer_tracker = es_primer_tracker; // flag para identificar al primer nodo tracker de la "lista".

    this.tabla_hash = {}; // estructura tipo diccionario {clave:valor}

    this.agregar_archivo = function (hash, filename, filesize, pair_nodes){
        this.tabla_hash[hash] = [filename, filesize, pair_nodes];
        // 'pair_nodes' es una lista cuyos elementos son objetos del tipo {pairIP:'ip', pairPort:port}
        // que representan al socket TCP del nodo par que contiene parte del archivo en cuestión.
        // (asumo que será algo asi, hay que revisarlo..)
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
