const express = require('express');
const app = express();
const IP_server = 'localhost';
const port_server = 8080;
//const bodyParser = require('body-parser');
const cors = require('cors');
//const path = require('path');
const sha1 = require('sha1'); //para el hash
const udp = require('dgram'); //para la comunicación UDP con el primer nodo tracker de la red.
// IP y PUERTO del primer nodo tracker de la "lista" de trackers.
const IP_tracker = 'localhost';
const port_tracker = 3001;

// No hace falta usar 'bodyParser.urlencoded', porque eso nos sirve para decodificar el 'body' de un POST realizado por un formulario HTML,
// y en nuestro caso vamos a usar el 'fetch' para hacer los POST, cuyo 'body' es un JSON --> entonces usamos: express.json().
//app.use(bodyParser.urlencoded({ extended: false })); //extended: false significa que parsea solo string

// https://stackoverflow.com/questions/5710358/how-to-access-post-form-fields
app.use(express.json()); // Para que el servidor sepa como decodificar el 'body' que viene en un POST en formato JSON.
app.use(cors()); // Para que el servidor pueda responder sin inconvenientes las peticiones HTTP provenientes de un 'fetch'.

// ******************************* GESTIÓN DE LAS PETICIONES HTTP *******************************

app.get('/', function(req,res){ // PAGINA DE INICIO
    mostrar_info_peticion(req);
    //res.sendFile('index.html',{root: path.join(__dirname,'./public')});
    res.sendFile('index.html', {root: 'public'});
});

app.get('/formulario', function(req,res){ // Para ir al formulario de alta de archivos
    mostrar_info_peticion(req);
    //res.sendFile('formulario-client.html',{root: path.join(__dirname,'./public')});
    res.sendFile('formulario_alta_torrentes.html', {root: 'public'});
});

app.get('/peticiones_cliente.js', function(req,res){ // Para que al entrar a la pagina del formulario, el navegador reciba el .js
    mostrar_info_peticion(req);
    res.sendFile('peticiones_cliente.js', {root: 'public'});
});

app.get('/file', function(req,res){ // LISTAR ARCHIVOS 
    mostrar_info_peticion(req);
    listar_archivos(res); // le pasamos el 'res' para que haga ahi dentro el 'res.send(respuesta)', ya que el metodo que recibe un mensaje UDP, es asíncrono.
});

app.get('/file/:hash', function(req,res){ // SOLICITUD DE DESCARGA .TORRENTE
    mostrar_info_peticion(req);
    // El formato '/file/:hash' indica que 'hash' actua como un parametro, algo variable,
    // ya que el hash de un archivo es justamente distinto al de otro, y por ende los GET tendrán rutas distintas.
    let hash_archivo = req.params.hash; // y de esta manera obtenemos el valor del parametro. https://expressjs.com/es/4x/api.html#req.params
    solicitud_descarga(hash_archivo, res);
});

app.post('/file/', function(req,res){ // ALTA DE ARCHIVOS (la peticion viene de un 'fetch' del cliente)
    
    mostrar_info_peticion(req);
    console.log(req.body); // para pruebas

    // Parseamos el JSON recibido en el 'body' del POST (son los datos del nuevo archivo
    // que que será parte de la red, y que trackeará un nodo tracker).
    //let datos_archivo = JSON.parse(req.body);
    // --> NO HACE FALTA, express ya lo convierte a un objeto javascript por nosotros [gracias al "app.use(express.json());"].
    let datos_archivo = req.body; // https://expressjs.com/es/api.html#req.body

    // Obtenemos el id para el nuevo archivo utilizando la función hash (el id de un archivo es el hash SHA-1).
    id = obtener_hash(datos_archivo.filename, datos_archivo.filesize);

    // Procesamos el alta del nuevo archivo, es decir, se cargará en algun nodo tracker, los datos para ubicar al nuevo archivo en la red.
    alta_archivo(id, datos_archivo.filename, datos_archivo.filesize, datos_archivo.nodeIP, datos_archivo.nodePort, res);

    // Nota: cuando en el HTML se toca el boton de SUBIR, queda la misma pagina por si el cliente desea subir más de un archivo.
});


// El servidor empieza a escuchar en el puerto que corresponda
app.listen(port_server, IP_server, () => {
  console.log(`Servidor escuchando en el puerto: ${port_server}...`);
});


// ******************* FUNCIONES PARA LA COMUNICACIÓN UDP CON EL NODO TRACKER *******************
//                             Y POSTERIOR RESPUESTA AL CLIENTE WEB

function listar_archivos(res){
    // Armamos el mensaje 'scan' para enviarle al primer nodo tracker de la red.
    let scan = {
        messageId: '', // En principio, solo el primer nodo tracker gestiona este atributo.
        route: '/scan',
        originIP: IP_server,
        originPort: port_server, // si falla algo, revisar este puerto.
        body: undefined // se deja 'undefined' por lo que dice la interfaz. El primer nodo tracker se encargará de armar la estructura.
    };
    // Abrimos un socket UDP cliente para comunicarnos con el nodo tracker.
    const client = udp.createSocket('udp4');
    client.send(JSON.stringify(scan), port_tracker, IP_tracker);
    // El nodo tracker nos responderá con la lista de archivos de toda la red (es el formato de un 'scan').
    client.on('message', function (msg) {
        //quizas el tener abierto varios servers udp en el mismo puerto traiga problemas si hacemos solicitudes concurrentes.
        //mientras tanto, asumimos que las solicitudes se hacen una por vez.
        
        mostrar_info_respuesta('Respuesta del Tracker ante Petición GET /file', msg);
        
        // Le respondemos al cliente web tal cual lo que nos respondió el nodo tracker, que será un string JSON (con el formato del 'scan' pero con el '.body' rellenado).
        // Luego el cliente web se encargará de hacer el JSON.parse(msg) para obtener los datos de los archivos e insertarlos adecuadamente en el HTML.
        res.send(msg);
        client.close();
    });
    // Por si hay un error con el socket en sí.
    client.on('error', (err) => {
        console.log(`Error:\n${err.stack}`);
        client.close();
    });
    // Al ejecutarse el método 'client.on('message')', como es asincrono, no nos quedaremos bloqueados
    // esperando la respuesta del tracker, sino que cuando responda, se ejecutará el callback pasado por parametro.
    // Entonces cuando el servidor llama a esta funcion 'listar_archivos()',
    // rapidamente termina de ejecutarse al llegar a esta linea de código, y le vuelve el control.
}

function solicitud_descarga(hash, res){
    // Armamos el mensaje 'search' para enviarle al primer nodo tracker de la red.
    let search = {
        messageId: '', // En principio, solo el primer nodo tracker gestiona este atributo.
        route: `/file/${hash}`,
        originIP: IP_server,
        originPort: port_server,
        body: {} // por lo que dice la interfaz, queda vacio (solo está para que el formato de mensaje sea similar a otros mensajes).
    };
    // Abrimos un socket UDP cliente para comunicarnos con el nodo tracker.
    const client = udp.createSocket('udp4');
    client.send(JSON.stringify(search), port_tracker, IP_tracker);
    // El nodo tracker nos responderá con la información necesaria del archivo solicitado para generar su .torrente (es el formato de un 'found').
    // En caso de no encontrar el archivo en la red, de igual forma recibiremos un 'found', pero con su '.body' vacío ({}).
    client.on('message', function (msg) { 
        mostrar_info_respuesta(`Respuesta del Tracker ante Petición GET /file/${hash}`, msg);
        // Convertimos el string JSON recibido a un objeto JavaScript.
        msg = JSON.parse(msg);
        // Verificamos si se encontró o no el archivo solicitado.
        let respuesta;
        if(Object.keys(msg.body).length == 0){
            // https://expressjs.com/es/api.html#res.status
            res.status(404); // seteamos el codigo de estado HTTP a 404 (Not Found), así del lado del cliente podremos comprobar si hubo un error o no.
            respuesta = JSON.stringify({error: 'ERROR: Archivo no encontrado.'});
        }
        else{
            // Preparamos el Header de la respuesta HTTP para que el navegador directamente descargue el .torrente.
            // http://expressjs.com/en/api.html#res.set
            res.set({
              'Content-Disposition': `attachment; filename="${msg.body.filename.split('.')[0]}.torrente"`,
              'Content-Type': 'text/plain'
            });
            // Preparamos el contenido del .torrente que se descargará.
            let contenido_torrente = {
                hash: msg.body.id,
                trackerIP: msg.body.trackerIP,
                trackerPort: msg.body.trackerPort
            };
            // Convertimos el contenido del .torrente a un string JSON y se lo enviamos al cliente web (navegador) para que automaticamente lo descargue.
            respuesta = JSON.stringify(contenido_torrente); // la respuesta al cliente web es el contenido del archivo .torrente que se generará.
        }

        res.send(respuesta);
        client.close();
    });
    // Por si hay un error con el socket en sí.
    client.on('error', (err) => {
        console.log(`Error:\n${err.stack}`);
        client.close();
    });
}

function alta_archivo(id, filename, filesize, nodeIP, nodePort, res){
    // Armamos el mensaje 'store' para enviarle al primer nodo tracker de la red.
    let store = {
        messageId: '', // En principio, solo el primer nodo tracker gestiona este atributo.
        route: `/file/${id}/store`, // El id es el hash del archivo.
        originIP: IP_server,
        originPort: port_server,
        body: {
            id: id,
            filename: filename,
            filesize: filesize,
            pares: [{
                parIP: nodeIP, // Por tema de compatibilidad, se puso los datos del par en un arreglo, pero siempre habrá un solo par.
                parPort: nodePort
            }]
        }
    };
    // Abrimos un socket UDP cliente para comunicarnos con el nodo tracker.
    const client = udp.createSocket('udp4');
    client.send(JSON.stringify(store), port_tracker, IP_tracker);
    // El nodo tracker nos responderá con un mensaje informando el éxito o no de la carga del nuevo archivo (es un objeto con 3 atributos).
    client.on('message', function (msg) { 
        mostrar_info_respuesta('Respuesta del Tracker ante Petición POST /file/', msg);
        // Le respondemos al cliente web tal cual lo que nos respondió el nodo tracker, que será un string JSON.
        // Luego el cliente web se encargará de hacer el JSON.parse(msg) para obtener la confirmacion de la carga y mostrar un mensaje en el HTML.
        res.send(msg); // Le respondemos al 'fetch' proveniente del cliente (navegador).
        client.close();
    });
    // Por si hay un error con el socket en sí.
    client.on('error', (err) => {
        console.log(`Error:\n${err.stack}`);
        client.close();
    });
}

// ********************************* FUNCIONES COMPLEMENTARIAS **********************************

function mostrar_info_peticion(req){
    // Información sobre la petición del cliente
    // https://nodejs.org/api/http.html#http_class_http_incomingmessage
    const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
    console.log(`\n[${Date().split(' ')[4]}]`); // Hora actual del sistema
    console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
}

function mostrar_info_respuesta(texto, respuesta){
    // Información sobre la respuesta del nodo tracker
    console.log(`\n[${Date().split(' ')[4]}]`); // Hora actual del sistema
    console.log(texto);
    console.log(JSON.parse(respuesta)); // la respuesta viene en crudo (string JSON)
}

function obtener_hash(filename,filesize){ //PRODUCE HASH PERO HAY QUE VER COMO HACER PARA EVITAR COLISIONES
    
    //hacer un arreglo o lista doblemente enlazada? de 255 indices
    //buscar si hay una funcion booleana para ver si existe tal elemento
    //si existe tal elemento, entonces se debe generar otro hash
    
    filesize=filesize.toString(); //al tamaño del archivo lo parseo al string
    const hash = sha1(filename+filesize); //sin espacio entre medio (NombreTamaño)
    
    //hash=Number.parseInt(hash,16); numero del hash, o sea, seria el indice, por ejemplo '3a' entonces el indice en decimal es 58
    //es para analizar que no haya colisiones!!!!!!!!! 
   
    return hash; 
}