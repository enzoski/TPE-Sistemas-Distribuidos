// Podríamos usar este módulo que implementa una lista doblemente enlazada, y modificarla para que además sea circular.
// https://www.npmjs.com/package/dbly-linked-list
const LinkedList = require("dbly-linked-list");

// Clase que representa a un Nodo Tracker (podríamos llegar a hacer algo así).
const NodoTracker = function (id){
    this.id = id; //El enunciado del TP dice que: 'Los nodos tienen identificadores únicos'. Hay que ver cómo y donde gestionar ese 'id'.
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
}


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

// ---------pruebas-lista-doblemente-enlazada-------------
// (igual por ahora no sé exactamente dónde estaría esta lista, si en el servidor, o cada nodo tracker tiene una copia)
const list = new LinkedList();

list.insert(nodo_tracker_1);
list.insert(nodo_tracker_2);

list.forEach((node) => {
    let tracker = node.data;
    console.log(`Tabla hash del nodo tracker ${tracker.id}:`);
    tracker.mostrar_archivos();
})