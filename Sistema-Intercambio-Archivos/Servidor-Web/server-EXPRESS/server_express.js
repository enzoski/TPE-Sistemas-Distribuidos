const express = require('express');
const app = express();
const port = 8080;
//const bodyParser = require('body-parser');
const cors = require('cors');
//const path = require('path');

var id = 0; // id de los torrentes que se van subiendo.

// No hace falta usar 'bodyParser.urlencoded', porque eso nos sirve para decodificar el 'body' de un POST realizado por un formulario HTML,
// y en nuestro caso vamos a usar el 'fetch' para hacer los POST, cuyo 'body' es un JSON --> entonces usamos: express.json().
//app.use(bodyParser.urlencoded({ extended: false })); //extended: false significa que parsea solo string

// https://stackoverflow.com/questions/5710358/how-to-access-post-form-fields
app.use(express.json()); // Para que el servidor sepa como decodificar el 'body' que viene en un POST en formato JSON.
app.use(cors()); // Para que el servidor pueda responder sin inconvenientes las peticiones HTTP provenientes de un 'fetch'.

app.get('/', function(req,res){ // PAGINA DE INICIO
	mostrar_info_peticion(req);
	//res.sendFile('index.html',{root: path.join(__dirname,'./public')});
	res.sendFile('index.html', {root: 'public'});
});

app.get('/file', function(req,res){ // LISTAR ARCHIVOS 
	mostrar_info_peticion(req);
    // En principio no haría falta devolver el HTML completo del index, solo el bloque que contenga el listado.
	// res.sendFile('index.html',{root: path.join(__dirname,'./public')});
	// res.sendFile('index.html', {root: 'public'});
    listar_archivos();
    res.send('Lista nombres y tamaños de archivos'); //para probar
});

app.get('/file/hash', function(req,res){ // SOLICITUD DE DESCARGA
	mostrar_info_peticion(req);
	solicitud_descarga(); //voy a la funcion de solicitud descarga
});

app.get('/formulario', function(req,res){ // Para ir al formulario de alta de archivos
    mostrar_info_peticion(req);
    //res.sendFile('formulario-client.html',{root: path.join(__dirname,'./public')});
    res.sendFile('formulario-client.html', {root: 'public'});
});

app.get('/peticiones_cliente.js', function(req,res){ // Para que al entrar a la pagina del forumalrio, el navegador reciba el .js
    mostrar_info_peticion(req);
    res.sendFile('peticiones_cliente.js', {root: 'public'});
});

app.post('/file/', function(req,res){ // ALTA DE ARCHIVOS (la peticion viene de un 'fetch' del cliente)
	
	mostrar_info_peticion(req);
    console.log(req.body); // para pruebas

    // parseamos el JSON recibido en el 'body' del POST (son los datos del torrente a subir).
    // --> NO HACE FALTA, express ya lo convierte a un objeto javascript por nosotros [gracias al "app.use(express.json());"].
    //let datos_torrente = JSON.parse(req.body);
    let datos_torrente = req.body;

	// obtenemos el id para el nuevo torrente
    id = id + 1;

    // procesamos el alta del nuevo torrente
	alta_archivo(id, datos_torrente.filename, datos_torrente.filesize, datos_torrente.nodeIP, datos_torrente.nodePort);

    // cuando tocas el boton de SUBIR, queda la misma pagina por si el cliente desea subir más de un archivo
    // res.sendFile('formulario-client.html',{root: path.join(__dirname,'./public')});
    // En principio no haría falta volver a mandarle el HTML del formulario, luego de tocar el boton ya queda en esa pagina.

    res.send(`Torrente "${datos_torrente.filename}" subido con éxito!`); // Le respondemos al 'fetch' proveniente del cliente (navegador).
});


// El servidor empieza a escuchar en el puerto que corresponda
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto: ${port}...`);
});


function alta_archivo(id, filename, filesize, nodeIP, nodePort){
    console.log('Alta exitosa');
    console.log(id);
    console.log(filename); //muestro en la consola a ver si funciona, FUNCIONA OK!
	console.log(filesize);
	console.log(nodeIP);
	console.log(nodePort);
	//aca se tendria que comunicar con el tracker para almacenar el archivo nuevo
}

function listar_archivos(){
    console.log('Lista nombres y tamaños de archivos');
}

function solicitud_descarga(hash){ 
    console.log('Solicitud de descarga solicitada');
    /*GET /file/{hash}
Content-Disposition: attachment; filename=”nombre.torrente”
Content-Type: text/plain
*/
}


function mostrar_info_peticion(req){
    // Información sobre la petición del cliente
    // https://nodejs.org/api/http.html#http_class_http_incomingmessage
    const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
    console.log(`[${Date().split(' ')[4]}]`); // Hora actual del sistema
    console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}\n`);
}
