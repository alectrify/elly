$(document).ready(() => {
    fetch('/api/records')
        .then((response) => response.json())
        .then((records) => {
            let pageCount = Math.ceil(records.length / MAX_ROWS);

            // Pagination
            $('.paginationNav').prepend(`<p>Total record count: ${records.length}<br>Max records per page: ${MAX_ROWS} </p>`)

            for (let i = 1; i <= pageCount; i++) {
                $(`<li class="page-item ${(i === pageNum) ? 'active' : ''}"><a class="page-link" href="/records/${i}">${i}</a></li>\n`).insertBefore('.next');
            }

            let clientIdCounts = {};

            records.forEach((record, index) => {
                // If record is not in range for current page, do not display.
                if (index < RANGE_MIN || index > RANGE_MAX) {
                    return;
                }

                if (record.hasOwnProperty('reportData')) {
                    let newRow = $('#scanTable').append('<tr></tr>').children().last();

                    /* Add Report Data */
                    let reportData = record.reportData;

                    for (const [key, value] of Object.entries(reportData)) {
                        if (key === 'patientID') {
                            if (reportData.patientID === '') {
                                newRow.append(`<td class="text-warning"><i class="bi bi-patch-question-fill" title="No patient ID specified"></i></td>`);
                            } else {
                                clientIdCounts[reportData.patientID] = (clientIdCounts.hasOwnProperty(reportData.patientID)) ? clientIdCounts[reportData.patientID] + 1 : 1;
                                newRow.append(`<td>${value}</td>`);
                            }
                        } else if (key === 'paymentReceivedAmount' && value !== '') {
                            newRow.append(`<td>\$${value}</td>`);
                        }
                        else {
                            newRow.append(`<td>${value}</td>`);
                        }
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

                    if (record.hasOwnProperty('pageNum')) {
                        dropdownMenu.append(`<li><a class="dropdown-item text-info" href="/api/pdf/${record.id}/${record.batchNum}/${record.pageNum}">
                            <i class="bi bi-file-richtext"></i> Download PDF</a></li>`);
                    }

                    dropdownMenu.append(`<li><a class="dropdown-item text-danger" href="/api/delete/${record._id}">
                        <i class="bi bi-trash"></i> Delete</a></li>`);
                }
            });

            for (const [key, value] of Object.entries(clientIdCounts)) {
                if (value > 1) {
                    $(`td:contains('${key}')`).append(' <i class="bi bi-exclamation-triangle-fill text-danger" title="Duplicate ID exists"></i>');
                }
            }

        });
});