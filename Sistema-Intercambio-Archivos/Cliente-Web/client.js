import fetch from "node-fetch";
const URL_server = 'http://localhost:8080/';

//esto se llena con el contenido que pone el usuario en la interfaz
//<form onsubmit="miFuncion(); return false"> 

let path = "C:/ejemplo"; 
let id = "id"; //??
let filesize = 200;
let filename = "archivo.txt";
let nodePort = 1000; // no se de donde sale esto
let nodeIP = "1234"; //esto tampoco se de donde sale
let hash = ""; // ??? tadavia no entiendo si lo tenemos que calcular aca y mandarlo o que 

/**EL CODIGO PARA EL USO DE FETCH SUE SACADO DE LA DOCUMENTACION 
 * https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch */
const alta_archivo = fetch(URL_server,{
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
      },
    body: JSON.stringify(data)}
)
//.then(data => { console.log(data);})
.then(res => res.json())
.catch(error => console.error('Error:', error))
.then(response => console.log('Success:', response));


const listar_archivos = fetch(URL_server)
.then(response => response.json())
.then(data => console.log(data));
//aca viene un JSON {{nombre: nombre.txt, tamaño:200},...}??

alta_archivo();
