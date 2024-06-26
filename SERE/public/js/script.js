function agregarFilaPagares() {
  var table = document.getElementById("dataTablePagares");
  var rowCount = table.rows.length;

  var row = table.insertRow(rowCount);
  var cell1 = row.insertCell(0);
  var cell2 = row.insertCell(1);
  var cell3 = row.insertCell(2);
  var cell4 = row.insertCell(3);
  var cell5 = row.insertCell(4);
  var cell6 = row.insertCell(5);

  cell1.innerHTML = rowCount;
  cell2.innerHTML =
    '<input type="date" class="form-control text-center" id="FechaVencimientoPagares' + rowCount + '" required>';
  cell3.innerHTML =
    '<input type="date" class="form-control text-center " id="FechaPrescripcionPagares' + rowCount + '" required>';
  cell4.innerHTML =
    '<input type="number" class="form-control text-center" id="MontoPagares' + rowCount + '" required>';
  cell5.innerHTML =
    '<input type="text" class="form-control text-center" id="Moneda' + rowCount + '" maxlength="10" required>';
  cell6.innerHTML =
    '<input type="number" class="form-control text-center" id="MontoPesosAproximado' + rowCount + '" maxlength="10" required>';
}

