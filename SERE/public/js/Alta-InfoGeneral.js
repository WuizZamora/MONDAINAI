document.addEventListener('DOMContentLoaded', function () {
    const regimenDeudorSelect = document.getElementById('RegimenDeudor');
    const divDireccionComercial = document.getElementById('DivDireccionComercial');
    const divPoderNotarial = document.getElementById('DivPoderNotarial');
    const divCampoDetalle = document.getElementById('campoDetalle');
    const divDomicilioFiscal = document.getElementById('DivDomicilioFiscal');
    const divDomicilioPersonal = document.getElementById('DivDomicilioPersonal');
    const divDomicilioLaboral = document.getElementById('DivDomicilioLaboral');

    updateFields();  // Inicializa la visibilidad de campos al cargar

    regimenDeudorSelect.addEventListener('change', updateFields);

    function updateFields() {
        const tipoDeudor = regimenDeudorSelect.value;

        // Reset visibility and required status
        hideAndUnrequire([divDireccionComercial, divPoderNotarial, divDomicilioFiscal, divDomicilioPersonal, divDomicilioLaboral, divCampoDetalle]);

        switch (tipoDeudor) {
            case "Persona Moral":
                showAndRequire([divDireccionComercial, divPoderNotarial, divDomicilioFiscal]);
                break;
            case "Persona Fisica":
                showAndRequire([divDomicilioPersonal, divDomicilioLaboral]);
                break;
            case "Persona Fisica con Actividad Empresarial":
                showAndRequire([divDomicilioFiscal, divDomicilioPersonal, divDomicilioLaboral]);
                break;
        }
    }

    function showAndRequire(elements) {
        elements.forEach(element => {
            element.style.display = ''; // Muestra el div
            const inputs = element.querySelectorAll('input, select'); // Selecciona todos los inputs y selects dentro del div
            inputs.forEach(input => {
                input.required = true; // Hace los inputs/selects requeridos
                if (input.type === 'text' || input.tagName.toLowerCase() === 'select') {
                    input.value = ''; // Restablece o establece un valor inicial si es necesario
                }
            });
        });
    }

    function hideAndUnrequire(elements) {
        elements.forEach(element => {
            element.style.display = 'none'; // Oculta el div
            const inputs = element.querySelectorAll('input, select'); // Selecciona todos los inputs y selects dentro del div
            inputs.forEach(input => {
                input.required = false; // Hace los inputs/selects no requeridos
                input.value = ''; // Limpia los valores cuando el campo es ocultado
            });
        });
    }


});

// Obtenemos el elemento de entrada de fecha por su ID
var fechaInput = document.getElementById("FechaDeAsignacion");
// Creamos un nuevo objeto de fecha con la fecha actual
var fechaActual = new Date();
// Formateamos la fecha actual como YYYY-MM-DD (que es el formato aceptado para <input type="date">)
var formatoFecha =
    fechaActual.getFullYear() + "-" + ("0" + (fechaActual.getMonth() + 1)).slice(-2) + "-" + ("0" + fechaActual.getDate()).slice(-2);
// Establecemos el valor del campo de entrada de fecha al formato de fecha actual
fechaInput.value = formatoFecha;

// Agregamos un listener para el evento "input" en los campos de entrada
document.getElementById("NoClientePadre").addEventListener("input", function () {
    // Removemos cualquier caracter que no sea un número
    this.value = this.value.replace(/[^\d]/, "");
});

document.getElementById("NoClienteHijo").addEventListener("input", function () {
    // Removemos cualquier caracter que no sea un número
    this.value = this.value.replace(/[^\d]/, "");
});

// Función para validar y limitar la entrada a números y 10 dígitos
function validarNumerosDiezDigitos(input, avisoId) {
    input.value = input.value.replace(/[^\d]/, ""); // Remover caracteres no numéricos
    const aviso = document.getElementById(avisoId);
    if (input.value.length < 10 && input.value.length > 0) {
        aviso.textContent = "El número debe tener 10 dígitos";
    } else {
        aviso.textContent = "";
    }
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10); // Limitar la longitud a 10 dígitos
    }
}
// Agregar listeners para los eventos "input" en los campos
document.getElementById("NumeroCelular").addEventListener("input", function () {
    validarNumerosDiezDigitos(this, "avisoCelular");
});

document.getElementById("TelefonoFijoUno").addEventListener("input", function () {
    validarNumerosDiezDigitos(this, "avisoFijoUno");
});

document.getElementById("TelefonoFijoDos").addEventListener("input", function () {
    validarNumerosDiezDigitos(this, "avisoFijoDos");
});

//VALIDAR EMAIL
document.getElementById("correo").addEventListener("input", function () {
    if (this.value.trim() !== "") {
        // Solo validar si hay una entrada
        validarCorreoElectronico();
    } else {
        clearEmailValidation();
    }
});

function validarCorreoElectronico() {
    var email = document.getElementById("correo").value;
    var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    let resultado = document.getElementById("resultado");
    if (regex.test(email)) {
        document.getElementById("correo").classList.remove("is-invalid");
        resultado.textContent = "";
    } else {
        document.getElementById("correo").classList.add("is-invalid");
        resultado.textContent =
            "El correo electrónico ingresado no es válido. Verifica el formato.";
    }
}

function clearEmailValidation() {
    document.getElementById("correo").classList.remove("is-invalid");
    document.getElementById("resultado").textContent = "";
}

function mostrarCampoDetalle() {
    var seleccion = document.getElementById("PoderNotarial").value;
    var campoAdicional = document.getElementById("campoDetalle");
    var inputDetalle = document.getElementById("PoderNotarialDetalle");

    if (seleccion === "Si") {
        campoAdicional.style.display = "flex";
        inputDetalle.required = true;
        inputDetalle.value = ""; // Limpiar el valor del campo de texto
    } else {
        campoAdicional.style.display = "none";
        inputDetalle.required = false;
        inputDetalle.value = "No Aplica por la seleccion"; // Asignar el valor predeterminado
    }
}
function mostrarCampoFechaValidacion() {
    var DomicilioVerificado = document.getElementById(
        "DomicilioConfirmado"
    ).value;
    var campoFecha = document.getElementById("campoFechaValidacion");
    var inputFecha = document.getElementById("FechaValidacion");

    if (DomicilioVerificado === "Si") {
        campoFecha.style.display = "flex";
        inputFecha.required = true;
        inputFecha.value = ""; // Limpiar el valor del campo de fecha
    } else {
        campoFecha.style.display = "none";
        inputFecha.required = false;
    }
}