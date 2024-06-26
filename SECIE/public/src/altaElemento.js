//VALIDACION DE CAMPOS Y MUESTRA MENSAJE DE EXITO O ERROR
(() => {
    "use strict";

    const form = document.querySelector(".needs-validation");
    const inputs = form.querySelectorAll("input, select, button, textarea");
    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault(); // Impide el envío tradicional del formulario

            if (!form.checkValidity()) {
                event.stopPropagation();
                form.classList.add("was-validated"); // Asegura que los estilos de validación se apliquen
                document.getElementById("error-message").classList.remove("d-none");
            } else {
                // Preparar los datos del formulario para enviar
                document.getElementById("error-message").classList.add("d-none");

                const formData = new FormData(form);

                fetch(form.action, {
                    method: "POST",
                    body: new URLSearchParams(formData),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                })
                    .then((response) => response.text())
                    .then((data) => {
                        if (data === "DATOS DEL ELEMENTO RECIBIDOS Y GUARDADOS") {
                            document
                                .getElementById("success-message")
                                .classList.remove("d-none");
                            inputs.forEach((input) => {
                                input.disabled = true;
                            });
                            setTimeout(() => {
                                window.location.reload();
                            }, 3000); // 5000 milisegundos = 5 segundos
                        } else {
                            console.error("Error al insertar en la base de datos:", data);
                            alert("Hubo un error al guardar el nuevo proyecto");
                        }
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                        alert("Error de comunicación con el servidor");
                    });
            }
        },
        false
    );
})();

document.addEventListener("DOMContentLoaded", function () {
    ocultarCampos(); // Llamar al inicio para ocultar todos los campos
    establecerIDProyecto(); // Función para establecer el ID del proyecto
});

document.getElementById("tipo_elemento").addEventListener("change", function () {
    actualizarElemento();
    ocultarCampos();
    resetearValores(); // Resetear los valores al cambiar la selección
    mostrarCamposSegunSeleccion(this.value);
});

function establecerIDProyecto() {
    function getQueryParam(param) {
        var searchParams = new URLSearchParams(window.location.search);
        return searchParams.get(param);
    }

    var idProyecto = getQueryParam("IDProyecto");
    if (idProyecto) {
        var inputIdProyecto = document.getElementById("id_proyecto");
        if (inputIdProyecto) {
            inputIdProyecto.value = idProyecto;
        }
    }
}

function ocultarCampos() {
    var todosLosCampos = document.querySelectorAll(".tipoCampo");
    todosLosCampos.forEach(function (campo) {
        campo.style.display = "none";
        campo
            .querySelectorAll("input, textarea, select")
            .forEach(function (element) {
                element.required = false; // Elimina el atributo required
                element.removeAttribute("name"); // Elimina el atributo name para no enviar datos
            });
    });
}

function mostrarCamposSegunSeleccion(tipo) {
    // Lista de campos y sus requisitos asociados
    const campos = [
        { tipo: "subproyecto", campos: ["CampoSubproyecto"] },
        { tipo: "hito", campos: ["camposHito-Actividad-Accion", "camposHito-Actividad", "CampoSubproyecto", "CampoHito"] },
        { tipo: "actividad", campos: ["camposHito-Actividad-Accion", "camposHito-Actividad", "camposActividad", "CampoSubproyecto", "CampoHito", "CampoActividad"] },
        { tipo: "accion", campos: ["camposHito-Actividad-Accion", "camposAccion", "CampoSubproyecto", "CampoHito", "CampoActividad", "CampoAccion"] }
    ];

    // Ocultar todos los campos primero
    campos.forEach(({ campos }) => {
        campos.forEach(campoId => {
            var campo = document.getElementById(campoId);
            if (campo) {
                campo.style.display = "none";
            }
        });
    });

    // Luego mostrar y establecer los requeridos según la selección
    const campoSeleccionado = campos.find(c => c.tipo === tipo);
    if (campoSeleccionado) {
        mostrarYRequerir(campoSeleccionado.campos);
    }
}

function mostrarYRequerir(ids) {
    ids.forEach(function (id) {
        var elemento = document.getElementById(id);
        elemento.style.display = "block";
        establecerRequerido(elemento);
    });
}

function establecerRequerido(element) {
    element.querySelectorAll("input, textarea, select").forEach(function (input) {
        if (input.dataset.required === "true") {
            input.required = true;
        }
        // Restablece el atributo name para asegurar que el campo se envíe si es visible
        input.setAttribute("name", input.id);
    });
}

function resetearValores() {
    var inputs = document.querySelectorAll(".tipoCampo input");
    var textareas = document.querySelectorAll(".tipoCampo textarea");
    var selects = document.querySelectorAll(".tipoCampo select");

    inputs.forEach(function (input) {
        input.value = "";
    });
    textareas.forEach(function (textarea) {
        textarea.value = "";
    });
    selects.forEach(function (select) {
        select.value = "";
    });
}

function agregarCampo(containerId, campoPrefix, label) {
    const container = document.getElementById(containerId);
    const count =
        container.querySelectorAll("." + campoPrefix + "-group").length + 1;

    const newGroup = document.createElement("div");
    newGroup.classList.add(campoPrefix + "-group");

    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.id = campoPrefix + "-" + count;
    newInput.name = campoPrefix + "-" + count;
    newInput.classList.add("form-control");
    newInput.maxLength = 100;
    newInput.required = true;

    newGroup.appendChild(newInput);
    container.appendChild(newGroup);
}

document.getElementById("tipo_elemento").addEventListener("change", function () {
    mostrarCamposSegunSeleccion(this.value);
    actualizarElemento();
});

function actualizarElemento() {
    var idProyecto = document.getElementById("id_proyecto").value;
    var tipoElemento = document.getElementById("tipo_elemento").value;

    fetch(`/secie/get-idElemento?principal=${encodeURIComponent(idProyecto)}&tipoElemento=${encodeURIComponent(tipoElemento)}`)
        .then((response) => response.json())
        .then((data) => {
            // Actualizar todos los campos con los valores retornados
            document.getElementById("id_subproyecto").value = data.subproyecto || 0;
            document.getElementById("id_hito").value = data.hito || 0;
            document.getElementById("id_actividad").value = data.actividad || 0;
            document.getElementById("id_accion").value = data.accion || 0;
        })
        .catch((error) => console.error("Error:", error));
}