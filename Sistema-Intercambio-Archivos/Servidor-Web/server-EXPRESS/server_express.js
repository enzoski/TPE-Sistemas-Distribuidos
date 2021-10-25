var express = require('express');
var path = require('path');
var app = express();
const bodyParser = require('body-parser');
const port = 8080;
var id=0;
app.use(bodyParser.urlencoded({ extended: false })); //extended: false significa que parsea solo string

app.get('/', function(req,res){ //PAGINA DE INICIO
	
	const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
	console.log(`[${Date().split(' ')[4]}]`);
	console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
	res.sendFile('index.html',{root: path.join(__dirname,'./public')});
});


app.get('/file/', function(req,res){ //Para ir al formulario
	const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
	console.log(`[${Date().split(' ')[4]}]`);
	console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
	res.sendFile('formulario-client.html',{root: path.join(__dirname,'./public')}); //cuando tocas el boton de SUBIR, queda la misma pagina por si el cliente desea subir más de un archivo

});



app.get('/file', function(req,res){ //LISTAR ARCHIVOS,vuelvo a la misma pagina pero con lista actualizada, //anda mal
	const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
	console.log(`[${Date().split(' ')[4]}]`);
	console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
	res.sendFile('index.html',{root: path.join(__dirname,'./public')}); 

});




app.get('/file/hash', function(req,res){ //SOLICITUD DE DESCARGA
	
	const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
	console.log(`[${Date().split(' ')[4]}]`);
	console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
	
	solicitud_descarga(); //voy a la funcion de solicitud descarga
});


app.post('/file/', function(req,res){ //ALTA DE ARCHIVOS

	//aca en realidad vienen los datos en un JSON del post que mando cliente, no se deberian tomar del formulatio HTML
	
	const metodo_peticion_cliente = req.method;
    const path_peticion_cliente = req.url;
	console.log(`[${Date().split(' ')[4]}]`);
	console.log(`Petición entrante: ${metodo_peticion_cliente} ${path_peticion_cliente}`);
	
	res.sendFile('formulario-client.html',{root: path.join(__dirname,'./public')}); //cuando tocas el boton de SUBIR, queda la misma pagina por si el cliente desea subir más de un archivo
	
	let nombre=req.body.Archivo; //agarro los datos desde el formualario HTML
	let tamaño=req.body.Tamaño;
	let nodeIP=req.body.NodeIP;
	let nodePORT=req.body.NodePORT;

	//los parseo a enteros
	tamaño=parseInt(tamaño);
	nodePORT=parseInt(nodePORT);

	//Qué datos le asigno a id?
	id=id+1;
	alta_archivo(id,nombre,tamaño,nodeIP,nodePORT); //voy a la funcion de alta_archivos
});


// El servidor empieza a escuchar en el puerto que corresponda
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto: ${port}`);
});

function alta_archivo(id, filename, filesize, nodeIP,nodePort){
    console.log('Alta exitosa');
    console.log(id);
    console.log(filename); //muestro en la consola a ver si funciona, FUNCIONA OK!
	console.log(filesize);
	console.log(nodeIP);
	console.log(nodePort);
}


function listar_archivos(){
    console.log('Lista nombres y tamaños de archivo');
}


function solicitud_descarga(hash){ 
    console.log('Solicitud de descarga solicitada');
    /*GET /file/{hash}
Content-Disposition: attachment; filename=”nombre.torrente”
Content-Type: text/plain
*/
}
