$(document).ready(() => {
    fetch('/api/records')
        .then((response) => response.json())
        .then((records) => {
            records.forEach((record) => {
                if (record.hasOwnProperty('reportData')) {
                    let newRow = $('#scanTable').append('<tr></tr>').children().last();

                    /* Add Report Data */
                    let reportData = record.reportData;

                    for (const [key, value] of Object.entries(reportData)) {
                        newRow.append(`<td>${value}</td>`);
                    }

                    /* Add Action Buttons */
                    newRow.append(`<td><div class="dropdown">
                          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                            Actions
                          </button>
                          <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                          </ul>
                        </div></td>`);

                    let dropdownMenu = newRow.find('.dropdown-menu');

                    dropdownMenu.append(`<li>
                        <a class="dropdown-item text-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-id="${record._id}" href="#">
                        <i class="bi bi-pencil"></i> Edit</a></li>`);

                    dropdownMenu.append(`<li><a class="dropdown-item text-info" href="/api/xlsx/${record._id}">
                            <i class="bi bi-file-excel"></i> Download XLSX</a></li>`);

                    dropdownMenu.append(`<li><a class="dropdown-item text-info" href="/api/pdf/${record.id}/${record.batchNum}/${record.pageNum}">
                            <i class="bi bi-file-richtext"></i> Download PDF</a></li>`);

                    dropdownMenu.append(`<li><a class="dropdown-item text-danger" href="/api/delete/${record._id}">
                        <i class="bi bi-trash"></i> Delete</a></li>`);
                } else {
                    let newRow = $('#scanTable').append('<tr></tr>').children().last();
                    let patientData = record.patientData;

                    if (typeof patientData !== 'object' || patientData === null || !patientData.hasOwnProperty('barcode')) {
                        return;
                    }

                    newRow.append(`<td>${patientData.barcode}</td>`);
                    newRow.append(`<td>${patientData.firstName} ${patientData.lastName}</td>`);

                    // Create download button
                    newRow.append(`<td><a class="btn btn-info" href="/api/xlsx/${record._id}">
                    <i class="bi bi-file-earmark-spreadsheet"></i> Download</a></td>`);

                    // Create delete button
                    newRow.append(`<td><a class="btn btn-danger" href="/api/delete/${record._id}">
                    <i class="bi bi-trash"></i> Delete</a></td>`);
                }
            });
        });
});