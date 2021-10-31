import fetch from "node-fetch";
const URL_server = 'http://localhost:8080/';

//esto se llena con el contenido que pone el usuario en la interfaz
//<form onsubmit="miFuncion(); return false"> 

// sacar datos del html

let datos ={ 
  filesize : 200,
  filename : "archivo.txt",
  nodePort : 1000,
  nodeIP : "1234", 
  hash : "",
} 

/**EL CODIGO PARA EL USO DE FETCH SUE SACADO DE LA DOCUMENTACION 
 * https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch */
const alta_archivo = fetch(URL_server,{
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
      },
    body: JSON.stringify(datos)}
)
.then(res => res.text()) //ACA VIENE UN OK (STRING)
.then(data => console.log(data));
.catch(error => console.error('Error:', error))
.then(response => console.log('Success:', response));


const listar_archivos = fetch(URL_server)
.then(response => response.json()) //aca viene un HTML
.then(data => console.log(data));


 

alta_archivo();

