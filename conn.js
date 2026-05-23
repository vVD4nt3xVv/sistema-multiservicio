// CONFIGURACIÓN CENTRAL: Pega aquí tu URL de Google Apps Script COMPLETA
const GOOGLE_APPS_SCRIPT_URL = "TU_URL_DE_EXEC_COMPLETA_AQUÍ";

/**
 * Función global para enviar peticiones de manera segura al servidor de Google
 * @param {Object} datos - El objeto con la acción y variables (ej: {accion: "login", usuario: "...", contrasena: "..."})
 * @returns {Promise<Object>} - La respuesta del servidor
 */
async function enviarPeticion(datos) {
    try {
        // Ejecutar la llamada usando FETCH y pasándola por el proxy de Google
        const respuesta = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) {
            throw new Error(`Error en el servidor: ${respuesta.status}`);
        }

        // Leer la respuesta en formato JSON
        const resultado = await respuesta.json();
        return resultado;

    } catch (error) {
        console.error("Error en la conexión con Core:", error);
        // Retornamos un objeto de error idéntico al que espera el Login para no congelar el botón
        return {
            exito: false,
            tipoError: "conexion",
            mensaje: "Error de conexión con el servidor. Inténtalo de nuevo."
        };
    }
}
