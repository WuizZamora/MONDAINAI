document.addEventListener("DOMContentLoaded", function () {
    var tipoGarantiaSelect = document.getElementById("TipoGarantia");
    var campoOtros = document.getElementById("campoOtros");

    tipoGarantiaSelect.addEventListener("change", function () {
        if (tipoGarantiaSelect.value === "Otros") {
            campoOtros.style.display = "flex";
            // Asegurarse de que el campo sea requerido si es visible
            document.getElementById("InputOtros").required = true;
        } else {
            campoOtros.style.display = "none";
            // Limpiar el valor y hacer que el campo no sea requerido
            document.getElementById("InputOtros").value = "";
            document.getElementById("InputOtros").required = false;
        }
    });
});

function mostrarCampoTipoGarantia() {
    var seleccionTipoDeuda = document.getElementById("TipoDeuda").value;
    var campoAdicionalTipoGarantia = document.getElementById("CampoTipoGarantia");

    if (seleccionTipoDeuda === "Garantizada") {
        campoAdicionalTipoGarantia.style.display = "flex";
        // Hacer todos los inputs dentro de este campo requeridos
        Array.from(campoAdicionalTipoGarantia.querySelectorAll("input, select")).forEach(el => el.required = true);
    } else {
        campoAdicionalTipoGarantia.style.display = "none";
        // Limpiar y hacer no requeridos todos los inputs
        Array.from(campoAdicionalTipoGarantia.querySelectorAll("input, select")).forEach(el => { el.value = ""; el.required = false; });
    }
}

function mostrarCampoEstadoDeCuenta() {
    var seleccionEstadoDeCuenta = document.getElementById("EstadoDeCuenta").value;
    var campoAdicionalEstadoDeCuenta = document.getElementById("CampoEstadoDeCuenta");

    if (seleccionEstadoDeCuenta === "Si") {
        campoAdicionalEstadoDeCuenta.style.display = "flex";
        // Hacer todos los inputs dentro de este campo requeridos
        Array.from(campoAdicionalEstadoDeCuenta.querySelectorAll("input, select")).forEach(el => el.required = true);
    } else {
        campoAdicionalEstadoDeCuenta.style.display = "none";
        // Limpiar y hacer no requeridos todos los inputs
        Array.from(campoAdicionalEstadoDeCuenta.querySelectorAll("input, select")).forEach(el => { el.value = ""; el.required = false; });
    }
}

// Función para validar y limitar la entrada a números y 10 dígitos
function validarNumerosDiezDigitos(input, avisoId) {
    input.value = input.value.replace(/[^\d]/g, ""); // Remover caracteres no numéricos
    const aviso = document.getElementById(avisoId);
    if (input.value.length < 10 && input.value.length > 0) {
        // Cambio aquí
        aviso.textContent = "El número debe tener 10 dígitos";
    } else {
        aviso.textContent = "";
    }
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10); // Limitar la longitud a 10 dígitos
    }
}

// Agregar listeners para los eventos "input" en los campos
document.getElementById("CelularContacto1").addEventListener("input", function () {
    validarNumerosDiezDigitos(this, "avisoCelular1");
});

document.getElementById("TelefonoContacto1").addEventListener("input", function () {
    validarNumerosDiezDigitos(this, "avisoTelefono1");
});

function validateEmail(input, errorId) {
    const email = input.value;
    const emailError = input.parentNode.querySelector(
        ".form-text.text-danger"
    );

    if (!email) {
        input.setCustomValidity("");
        emailError.textContent = "";
    } else if (!isValidEmail(email)) {
        input.setCustomValidity("Correo electrónico no válido");
        emailError.textContent =
            "Por favor, introduzca un correo electrónico válido.";
    } else {
        input.setCustomValidity("");
        emailError.textContent = "";
    }
}

function isValidEmail(email) {
    // Expresión regular para validar correo electrónico
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Agregar la validación a los campos originales de correo electrónico
document.getElementById("EmailContacto1").addEventListener("input", function () {
    validateEmail(this, "emailError1");
});
document.getElementById("EmailContactoAdicional1").addEventListener("input", function () {
    validateEmail(this, "emailError2");
});

function verificarInput(input) {
    // Elimina cualquier carácter que no sea un dígito
    input.value = input.value.replace(/\D/g, '');
}

var contadorContactos = 1; // Contador para identificar los contactos

// Función para validar y limitar la entrada a números y 10 dígitos en contactos duplicados
function validarNumerosDiezDigitosDuplicados(input, avisoId) {
    input.value = input.value.replace(/[^\d]/g, ""); // Remover caracteres no numéricos
    const aviso = document.getElementById(avisoId);
    if (input.value.length < 10 && input.value.length > 0) {
        // Cambio aquí
        aviso.textContent = "El número debe tener 10 dígitos";
    } else {
        aviso.textContent = "";
    }
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10); // Limitar la longitud a 10 dígitos
    }
}

// Función para agregar un nuevo contacto
function agregarContacto() {
    // Verifica si se ha alcanzado el límite de contactos
    if (contadorContactos < 3) {
        // Clona el primer elemento con la clase "contactoContainer"
        var nuevoContacto = document
            .querySelector(".contactoContainer")
            .cloneNode(true);

        // Incrementa el contador de contactos
        contadorContactos++;

        // Actualiza el texto del título del nuevo contacto
        nuevoContacto.querySelector("h4").textContent =
            "DEL CONTACTO ADICIONAL " + contadorContactos + ":";

        // Recorre los elementos de entrada y textarea en el nuevo contacto y actualiza sus IDs y Names
        nuevoContacto
            .querySelectorAll(
                'input[type="text"], input[type="email"], textarea'
            )
            .forEach(function (input) {
                var fieldName = input.getAttribute("name");
                var fieldID = input.getAttribute("id");

                // Extrae el número de contacto del ID actual
                var currentContactNumber = fieldID.match(/\d+/);

                // Reemplaza el número de contacto anterior por el nuevo
                var newFieldID = fieldID.replace(
                    currentContactNumber,
                    contadorContactos
                );
                var newFieldName = fieldName.replace(
                    currentContactNumber,
                    contadorContactos
                );

                // Actualiza el ID y el Name del campo
                input.setAttribute("id", newFieldID);
                input.setAttribute("name", newFieldName);
                input.value = ""; // Limpia el valor
                input.classList.remove("is-invalid");

                // Elimina la validación del campo
                input.removeAttribute("oninput");

                // Asocia la validación al campo de correo electrónico clonado
                if (input.type === "email") {
                    input.setAttribute(
                        "oninput",
                        "validateEmail(this, 'emailError" + contadorContactos + "')"
                    );
                }

                // Agrega un listener de evento "input" para la validación de números en el campo de número de teléfono celular
                if (input.id.startsWith("CelularContacto")) {
                    input.addEventListener("input", function () {
                        validarNumerosDiezDigitosDuplicados(
                            this,
                            "avisoCelular" + contadorContactos
                        );
                    });
                }

                // Agrega un listener de evento "input" para la validación de números en el campo de número de teléfono fijo
                if (input.id.startsWith("TelefonoContacto")) {
                    input.addEventListener("input", function () {
                        validarNumerosDiezDigitosDuplicados(
                            this,
                            "avisoTelefono" + contadorContactos
                        );
                    });
                }
            });

        // Actualiza los IDs únicos de los elementos small para los avisos
        nuevoContacto.querySelectorAll('small[id^="avisoCelular"]').forEach(function (small) {
            var currentContactNumber = small.id.match(/\d+/);
            var newAvisoId = "avisoCelular" + contadorContactos;
            small.setAttribute("id", newAvisoId);
            small.textContent = ""; // Limpia el contenido del aviso
        });

        nuevoContacto.querySelectorAll('small[id^="avisoTelefono"]').forEach(function (small) {
            var currentContactNumber = small.id.match(/\d+/);
            var newAvisoId = "avisoTelefono" + contadorContactos;
            small.setAttribute("id", newAvisoId);
            small.textContent = ""; // Limpia el contenido del aviso
        });

        // Agrega el nuevo contacto al contenedor
        document.getElementById("contactosContainer").appendChild(nuevoContacto);
        // Deshabilita el botón si se alcanza el límite de contactos
        if (contadorContactos === 3) {
            document.getElementById("btnAgregarContacto").disabled = true;
        }
    }
}

function eliminarUltimoContacto() {
    // Verifica si hay más de un contacto para eliminar
    if (contadorContactos > 1) {
        // Obtiene el último contacto creado y lo elimina
        var ultimoContacto = document.querySelector(
            "#contactosContainer .contactoContainer:last-child"
        );
        ultimoContacto.parentNode.removeChild(ultimoContacto);

        // Decrementa el contador de contactos
        contadorContactos--;

        // Habilita el botón de agregar si se deshabilitó previamente
        document.getElementById("btnAgregarContacto").disabled = false;
    }
}

var contador = 1;

function agregarFila() {
    if (contador < 10) {
        contador++;

        var nuevaFila = `
<tr>
    <th scope="row">${contador}</th>
    <td><input type="text" class="form-control text-center" placeholder="ADEUDO ${contador}" name="descripcionAdeudo${contador}" required></td>
    <td><input type="number" class="form-control text-center montoInput" placeholder="MONTO ${contador}" name="adeudoMonto${contador}" onkeyup="calcularTotal()" required></td>
</tr>
<input type="hidden" name="contador" value="${contador}">
    `;

        // Agregar la nueva fila al final de la tabla
        $("#dataTable tbody").append(nuevaFila);

        // Calcular y mostrar el total
        calcularTotal();

        // Habilitar el botón de agregar si se deshabilitó previamente
        document.getElementById("agregarBtn").disabled = false;
    } else {
        alert("Solo se permiten hasta 10 filas.");
        document.getElementById("agregarBtn").disabled = true;
    }
}

function eliminarUltimaFila() {
    if (contador > 1) {
        // Eliminar la última fila de la tabla
        $("#dataTable tbody tr:last").remove();
        contador--;

        // Calcular y mostrar el total actualizado
        calcularTotal();

        // Habilitar el botón de agregar si se deshabilitó previamente
        document.getElementById("agregarBtn").disabled = false;
    }
}

function calcularTotal() {
    var total = 0;

    // Recorre todas las filas de la tabla
    $("#dataTable tbody tr").each(function () {
        // Obtén el valor del monto de la fila actual y sumalo al total
        var monto = parseFloat($(this).find('.montoInput').val()) || 0;
        total += monto;
    });

    // Muestra el total actualizado
    $("#total").text(total.toFixed(2));
}