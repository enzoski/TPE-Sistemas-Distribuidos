// let cadena= "POST C:/carpeta/file/ body: { id: estoeselid, filename: nombre.txt, filesize: 2000, nodeIP: 198.162.43.2, nodePort: 5000}"
let cadena = "GET /file";
let path = "";
let id = "";
let filesize = 0;
let filename = "";
let nodePort = 0;
let nodeIP = "";
let hash = ""; 


//SI LAS PETICIONES SON EXACTAMENTE COMO ESTA ARRIBA CON ESPACIOS ENTRE EL NOMBRE DEL ATRIBUTO Y EL VALOR:
// BUSCAR MEJOR FORMA DE HACER ESTO

const words = cadena.split(' ');
//console.log(words);

if(words[0]=='POST'){
    path = words[1].replace(',','');
    id = words[5].replace(',','');
    filename = words[7].replace(',','');
    nodePort = words[9].replace(',','');
    nodeIP = words[11].replace(',','');
    hash = words[13].replace('}','');
}

if(words[0]=='GET'){
    let atrib = words[1].split(/['{,}']/);
    console.log(atrib);
}
/**
console.log('path: ',path);
console.log('id: ',id);
console.log('filename: ',filename);
console.log('nodePort: ',nodePort);
console.log('nodeIP: ',nodeIP);
console.log('hash: ',hash);

 */
