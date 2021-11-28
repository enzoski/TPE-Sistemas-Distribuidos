
    

// terminal par: descargar archivo.torrente
const file = prompt("archivo torrente:");
// abro archivo paso a JSON y extraigo hash, ip y puerto del tracker
var reader = new FileReader();
reader.readAsText(file);
reader.onload = function() {
    const torrente = JSON.parse(reader.result);
    
    let nombre = torrente['name']; //esto no se si es asi? no se si seria interoperable si los otros grupos no lo hicieron asi
    let tamaño = torrente['size'];
    let ip_tracker = torrente['ip_tracker'];
    let port_tracker = torrente['port_tracker'];
    let hash; //calcular?
    solicitar_descarga(hash, ip_tracker, port_tracker);
  };
reader.onerror = function() {
    console.log(reader.error);
  };




// comunicacion con trackers
    // Solicitud archivo torrente (rehusa search found)
    function solicitar_descarga(hash, ip_tracker, port_tracker){ 
        //busca pares (search found)
        const ip_par;
        const port_par;
        descargar(hash,ip_par,port_par);
    }
    
    // Agregar par a archivo existente  (el mensaje lo envía un par que tiene el archivo al tracker que registra dicho archivo)
        //basicamente el aviso del par al tracker de que tiene el archivo


// comunicacion con otros pares
    //Solicitud de descarga de archivo (abrir un socket, consultar el archivo y empezar a pasar bytes)

    function descargar(hash, ip_par, port_par){
        let solicitud = JSON.stringify({
            type: 'GET FILE',
            hash: hash
        })
        
    }