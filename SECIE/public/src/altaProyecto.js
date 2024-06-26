//VALIDACION DE CAMPOS Y MUESTRA MENSAJE DE EXITO O ERROR
(() => {
    'use strict';

    const form = document.querySelector('.needs-validation');
    const inputs = form.querySelectorAll('input, select, button, textarea');
    form.addEventListener('submit', event => {
        event.preventDefault(); // Impide el envío tradicional del formulario

        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated'); // Asegura que los estilos de validación se apliquen
            document.getElementById('error-message').classList.remove('d-none');
        } else {
            // Preparar los datos del formulario para enviar
            document.getElementById('error-message').classList.add('d-none');

            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: new URLSearchParams(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }).then(response => response.text())
                .then(data => {
                    if (data === "Proyecto creado correctamente") {
                        document.getElementById('success-message').classList.remove('d-none');
                        inputs.forEach(input => {
                            input.disabled = true;
                        });
                    } else {
                        console.error('Error al insertar en la base de datos:', data);
                        alert('Hubo un al guardar el nuevo proyecto');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error de comunicación con el servidor');
                });
        }
    }, false);
})();

// JQUERY PARA DINAMISMO EN LAS TABLAS RESPONSABLES Y AUDITORES.
$(document).ready(function () {
    let rowCountResponsables = 0;
    let rowCountAuditores = 0;

    function addRowResponsables() {
        rowCountResponsables++;
        var newRow = `<tr id="row_responsable_${rowCountResponsables}">
    <td>
        <input type="text" id="rfc_responsable_${rowCountResponsables}" name="rfc_responsable_${rowCountResponsables}" class="form-control rfc-input-responsable" required placeholder="Ingrese RFC">
    </td>
    <td>
        <select id="responsable_${rowCountResponsables}" name="responsable_${rowCountResponsables}" class="form-select" required>
            <option value="" selected disabled></option>
            <option value="ADMINISTRADOR MONDAINAI">Mondainai</option>
            <option value="CLIENTE">Cliente (Emprendedor/Empresario)</option>
            <option value="ESPECIALISTA">Especialista</option>
            <option value="AUDITOR">Auditor</option>
            <option value="DESPACHO">Despacho</option>
        </select>
    </td>
    <td>
        <input type="text" id="nombre_responsable_${rowCountResponsables}" name="nombre_responsable_${rowCountResponsables}" class="form-control" required readonly>
    </td>
</tr>`;
        $("#tbodyResponsables").append(newRow);
    }

    function addRowAuditores() {
        rowCountAuditores++;
        var newRow = `<tr id="row_auditor_${rowCountAuditores}">
    <td>
        <input type="text" id="rfc_auditor_${rowCountAuditores}" name="rfc_auditor_${rowCountAuditores}" class="form-control rfc-input-auditor" required placeholder="Ingrese RFC">
    </td>
    <td>
        <select id="auditor_${rowCountAuditores}" name="auditor_${rowCountAuditores}" class="form-select" required>
            <option value="" selected disabled></option>
            <option value="ADMINISTRADOR MONDAINAI">Mondainai</option>
            <option value="CLIENTE">Cliente (Emprendedor/Empresario)</option>
            <option value="ESPECIALISTA">Especialista</option>
            <option value="AUDITOR">Auditor</option>
            <option value="DESPACHO">Despacho</option>
        </select>
    </td>
    <td>
        <input type="text" id="nombre_auditor_${rowCountAuditores}" name="nombre_auditor_${rowCountAuditores}" class="form-control" required readonly>
    </td>
</tr>`;
        $("#tbodyAuditores").append(newRow);
    }

    // Crear una fila inicial automáticamente al cargar la página para cada tabla
    addRowResponsables();
    addRowAuditores();

    // Agregar más filas al hacer clic en los respectivos botones
    $("#addRowResponsables").click(function () {
        addRowResponsables();
    });
    $("#addRowAuditores").click(function () {
        addRowAuditores();
    });

    // Eliminar la última fila
    $("#removeLastResponsable").click(function () {
        if (rowCountResponsables > 1) { //La primera fila no se puede eliminar
            $("#tbodyResponsables tr:last").remove();
            rowCountResponsables--;
        }
    });
    $("#removeLastAuditor").click(function () {
        if (rowCountAuditores > 1) {
            $("#tbodyAuditores tr:last").remove();
            rowCountAuditores--;
        }
    });

    // Evento para el RFC del responsable
    $("#tbodyResponsables").on('input', '.rfc-input-responsable', function () {
        const perfilToOptionValue = {
            'A': 'AUDITOR',
            'AM': 'ADMINISTRADOR MONDAINAI',
            'C': 'CLIENTE',
            'D': 'DESPACHO',
            'E': 'ESPECIALISTA'
        };

        var rfc = this.value;
        var rowId = $(this).attr('id').match(/(\d+)$/)[0]; // Extrae el número al final del ID
        if (rfc.length === 13) {
            fetch(`/secie/get-nombre-responsable?rfc=${rfc}`)
                .then(response => response.json())
                .then(data => {
                    if (data.nombre && data.idPerfil) {
                        $(`#nombre_responsable_${rowId}`).val(data.nombre);
                        const perfilValue = perfilToOptionValue[data.idPerfil];
                        if (perfilValue) {
                            $(`#responsable_${rowId}`).val(perfilValue);
                        } else {
                            $(`#responsable_${rowId}`).val(''); // Limpia si no hay un mapeo
                        }
                    } else {
                        $(`#nombre_responsable_${rowId}`).val('');
                        $(`#responsable_${rowId}`).val('');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    $(`#nombre_responsable_${rowId}`).val('');
                    $(`#responsable_${rowId}`).val('');
                });
        } else {
            $(`#nombre_responsable_${rowId}`).val('');
            $(`#responsable_${rowId}`).val('');
        }
    });

    // Evento para el RFC del auditor
    $("#tbodyAuditores").on('input', '.rfc-input-auditor', function () {
        const perfilToOptionValue = {
            'A': 'AUDITOR',
            'AM': 'ADMINISTRADOR MONDAINAI',
            'C': 'CLIENTE',
            'D': 'DESPACHO',
            'E': 'ESPECIALISTA'
        };

        var rfc = this.value;
        var rowId = $(this).attr('id').match(/(\d+)$/)[0]; // Extrae el número al final del ID
        if (rfc.length === 13) {
            fetch(`/secie/get-nombre-auditor?rfc=${rfc}`)
                .then(response => response.json())
                .then(data => {
                    if (data.nombre && data.idPerfil) {
                        $(`#nombre_auditor_${rowId}`).val(data.nombre);
                        const perfilValue = perfilToOptionValue[data.idPerfil];
                        if (perfilValue) {
                            $(`#auditor_${rowId}`).val(perfilValue);
                        } else {
                            $(`#auditor_${rowId}`).val(''); // Limpia si no hay un mapeo
                        }
                    } else {
                        $(`#nombre_auditor_${rowId}`).val('');
                        $(`#auditor_${rowId}`).val('');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    $(`#nombre_auditor_${rowId}`).val('');
                    $(`#auditor_${rowId}`).val('');
                });
        } else {
            $(`#nombre_auditor_${rowId}`).val('');
            $(`#auditor_${rowId}`).val('');
        }
    });

});
//RFC del cliente 
document.getElementById('rfc').addEventListener('input', function () {
    var rfc = this.value;
    if (rfc.length === 13) {
        fetch(`/secie/get-nombre?rfc=${rfc}`)
            .then(response => response.json())
            .then(data => {
                if (data.nombre) {
                    document.getElementById('nombre').value = data.nombre;
                } else {
                    document.getElementById('nombre').value = '';
                }
            })
            .catch(error => console.error('Error:', error));
    }
});