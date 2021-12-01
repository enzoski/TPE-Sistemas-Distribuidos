// Módulo que contiene la clase que representa a la estructura de tabla hash de un nodo tracker.

const HashTable = function (){

    this.buckets = []; // arreglo dinamico (aunque máximo tendrá 255 indices, y podría haber información de más de un archivo en el mismo indice debido a colisiones)

    // En vez de que directamente la tabla hash sea un objeto javascript {clave:valor},
    // vamos a implementar la tabla hash como un arreglo de objetos Map (son de la forma {k1:v1, k2:v2, ...}),
    // donde los indices son los 2 primeros chars (bytes) del hash, y dentro de cada Map se guardarán los pares {clave:valor}
    // de la forma {hash:[filename, filesize, pares]}. O sea, dentro del Map se busca por el hash completo.
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

    this.getArchivosScan = function(){

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


module.exports = HashTable; // exportamos la clase HashTable.
