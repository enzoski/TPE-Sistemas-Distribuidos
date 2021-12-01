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

    this.tabla_hash = new HashTable(); // estructura tipo diccionario {clave:valor} donde se mantiene la informacion de los archivos disponibles para intercambio.

    this.agregar_archivo = function (hash, filename, filesize, pair_nodes){
        
        // this.tabla_hash[hash] = [filename, filesize, pair_nodes];
        this.tabla_hash.insert(hash,[filename,filesize,pair_nodes]);

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

        function search (){

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
                scan(solicitud);
                destino = calcular_destino(solicitud.messageId,this.id); //podriamos verificar que el body este vacio, si esta vacio, voy a seguir recorriendo

          }
          else if(partes_mensaje.includes('store')){ //es true si dentro del arreglo hay store
                store();
          }
          else if(partes_mensaje.includes('count')){ //es true si dentro del arreglo hay count 
                count();
          }
          else { //eos ultimo porque la ruta de search es route:file/hash
            if(partes_mensaje.includes('file'){ //solo para controlar que nos hayan mandado un mensaje valido
                //vamos a la función search
                search();
                // ATENCION!!!!!!!!!!!!! HAY QUE VERIFICAR SI EL IDMESSANGE COINCIDE CON EL PRIMERO PARA CORTAR LA VUELTA O NO, SI ENCONTRO, SE ARMA EL MENSAJE DE FOUND
                found();//found
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

//Clase que representa a la estructura de tabla hash
const HashTable = function (){

    this.buckets = []; // arreglo dinamico (aunque máximo tendrá 255 indices, y podría haber información de más de un archivo en el mismo indice debido a colisiones)

    // En vez de que directamente la tabla hash sea un objeto javascript {clave:valor},
    // vamos a implementar la tabla hash como un arreglo de objetos Map (son de la forma {k1:v1, k2:v2, ...}),
    // donde los indices son los 2 primeros chars (bytes) del hash, y dentro de cada Map se guardarán los pares {clave:valor}
    // de la forma {hash:[filename, filesize, pair_nodes]}. O sea, dentro del Map se busca por el hash completo.
    // Hacemos esto para gestionar posibles colisiones: todos los archivos que colisionen debido a los 2 primeros chars de su hash,
    // estarán juntos en el mismo Map.
    // (seguramente la mayor parte de los Maps tendrán un solo elemento {k:v}, y estariamos manteniendo una clave 'redundante',
    // pero conviene igualmente tener que hacer estos 2 accesos, uno para el arreglo, y otro para el Map, por si llega a haber colisiones)

    // Las 'key' son el hash completo, el tema de los 2 primeros chars es solo para los indices del arreglo.
    // Es como si le hicieramos un hash al hash original SHA-1, para obtener así el indice del arreglo (los 2 primeros chars del hash SHA-1).
    // Entonces cuando en el server obtenemos el hash, retornamos el hash completo, y luego acá extraemos los 2 chars.
    this.insert = function (key,value){
        // Parseamos los 2 primeros chars del hash (que representan un numero en hexadecimal) a decimal, para el indice.
        let i = Number.parseInt(key[0]+key[1], 16);
        // Si la posicion donde se va a guardar la informacion del nuevo archivo aun no tiene un Map, se lo instancia.
        if(!this.buckets[i])
          this.buckets[i] = new Map(); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
        // Agregamos al Map el nuevo par {clave:valor}
        this.buckets[i].set(key,value); // vec[hash[0]+hash[1]] = {hash1: valor1, hash2: valor2, ...}
    }

    this.remove = function (key){
        let i = Number.parseInt(key[0]+key[1], 16);
        let deleted = this.buckets[i].get(key); // antes de eliminarlo efectivamente, lo resguardamos para luego retornarlo.
        this.buckets[i].delete(key);
        return deleted;
    }

    this.search = function(key){
        // Por mas de que varios archivos puedan caer en el mismo indice, al hacer .get(key) se busca por el hash completo,
        // el cual tiene infimas posibilidades de colisionar (esta chance no la gestionaremos, asumimos que no hay colisiones
        // en la cadena de hash completa; solo estamos gestionando las colisiones provocadas por los 2 primeros chars del hash).
        let i = Number.parseInt(key[0]+key[1], 16); // obtenemos el indice en el cual estará el hash del archivo buscado.
        return this.buckets[i].get(key); // devolvemos el valor del par {clave:valor} cuya clave sea el hash completo del archivo buscado.
    }

    this.toString = function(){
        let str = '';
        // Recorremos cada elemento del arreglo, que son objetos Map, y formamos un string.
        this.buckets.forEach((element, index) => str += `indice=${index} # ${JSON.stringify(Array.from(element))}\n`);
        if(str == '')
          str = '[]';
        return str;
    }

    this.getArchivosScan(){

        let arreglo_archivos = [];
        this.buckets.forEach(element => {
            element.forEach(function(value, key) {
              let objeto_archivo = {
                id: key,
                filename: value[0],
                filesize: value[1]
              }
              arreglo_archivos.push(objeto_archivo);
            });
        });

        return arreglo_archivos;

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

// Cada nodo tracker comienza a escuchar en su puerto UDP
nodo_tracker_1.escuchar_UDP();
nodo_tracker_2.escuchar_UDP();
nodo_tracker_3.escuchar_UDP();
nodo_tracker_4.escuchar_UDP();
// [esto de que los 4 trackers escuchen a la vez (en distintos puertos) sin quedarnos bloqueados en el primero,
// es posible gracias a que los métodos de UDP son asincronicos (actuan como hilos de ejecucion distintos al 'main')
// igual hay que preguntar si para el tp podemos hacerlo así, o si hay que abrir cada tracker en una consola distinta].

*/

// ---------pruebas-instancias-nodos-tracker-con-tabla-hash-------------

nodo_tracker_1.mostrar_archivos();
nodo_tracker_1.agregar_archivo('1f4b', 'matrix', 999, [{pairIP: '192.168.0.2', pairPort: 8080},
                                                       {pairIP: '192.168.0.3', pairPort: 8080}
                                                      ]);
nodo_tracker_1.agregar_archivo('3a1b', 'harry_potter_1', 888, [{pairIP: '192.168.0.4', pairPort: 8080},
                                                               {pairIP: '192.168.0.5', pairPort: 8080}
                                                              ]);
// prueba de colisión.
nodo_tracker_1.agregar_archivo('3a8c', 'sims', 60, [{pairIP: '192.168.0.6', pairPort: 8080},
                                                    {pairIP: '192.168.0.7', pairPort: 8080}
                                                   ]);

if(nodo_tracker_1.tabla_hash.search('3a8c')) //para ver si esta el key '3a8c'.
    console.log('True. "Los Sims" está en la tabla hash');
else
    console.log('False. "Los Sims" NO está en la tabla hash');

nodo_tracker_1.mostrar_archivos();
console.log(nodo_tracker_1.tabla_hash.search('1f4b')[2][0]); //muestro la referencia al primer nodo par del primer archivo.
console.log();

nodo_tracker_2.agregar_archivo('abcd1', 'la_isla_del_tesoro', 222, [{pairIP: '192.168.0.8', pairPort: 8080},
                                                                    {pairIP: '192.168.0.9', pairPort: 8080}
                                                                   ]);
nodo_tracker_2.mostrar_archivos();
