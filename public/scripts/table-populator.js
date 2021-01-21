$(document).ready(() => {
    fetch('/api/records')
        .then((response) => response.json())
        .then((records) => {
            records.forEach(record => {
                let newRow = $('#scanTable').append('<tr></tr>').children().last();
                let sheetJSON = record.sheetJSON;

                if (!sheetJSON.barcode) {
                    return;
                }

                newRow.append(`<td>${sheetJSON.barcode}</td>`);
                newRow.append(`<td>${sheetJSON.firstName} ${sheetJSON.lastName}</td>`);

                // Create download button
                newRow.append(`<td><a class="btn btn-info" href="/api/xlsx/${record._id}">
                    <i class="bi bi-file-earmark-spreadsheet"></i> Download</a></td>`);

                // Create delete button
                newRow.append(`<td><a class="btn btn-danger" href="/api/delete/${record._id}">
                    <i class="bi bi-trash"></i> Delete</a></td>`);
            });
        });
});