$(document).ready(() => {
    fetch('/records/all')
        .then((response) => response.json())
        .then((records) => {
            let pageCount = Math.ceil(records.length / MAX_ROWS);
            let validRecordCount = records.length;

            records.forEach((record, index) => {
                // If record is not in range for current page, do not display.
                if (index < RANGE_MIN || index > RANGE_MAX) {
                    return;
                }

                if (record.hasOwnProperty('reportData')) {
                    let newRow = $('#scanTable').append('<tr></tr>').children().last();

                    /* Add Report Data */
                    let reportData = record.reportData;

                    if (reportData.name === 'undefined undefined') {
                        validRecordCount--;
                        return;
                    }

                    for (const [key, value] of Object.entries(reportData)) {
                        if (key === 'patientID') {
                            if (reportData.patientID === '') {
                                newRow.append(`<td class="text-warning"><i class="bi bi-patch-question-fill" title="No patient ID specified"></i></td>`);
                            } else {
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
                        <i class="fa fa-edit"></i> Edit</a></li>`);

                    dropdownMenu.append(`<li><a class="dropdown-item text-info" href="/records/xlsx/${record._id}">
                            <i class="fa fa-file-excel"></i> Download XLSX</a></li>`);

                    if (record.hasOwnProperty('pageNum')) {
                        dropdownMenu.append(`<li><a class="dropdown-item text-info" href="/batches/pdf/${record.id}/${record.batchNum}/${record.pageNum}" download>
                            <i class="fa fa-file-pdf"></i> Download PDF</a></li>`);
                    }

                    dropdownMenu.append(`<form id="deleteForm${record._id}" action="/records/${record._id}?_method=DELETE" method="post" hidden></form>`);
                    dropdownMenu.append(`<li><button type="submit" class="dropdown-item text-danger" form="deleteForm${record._id}">
                        <i class="fa fa-trash"></i> Delete</button></li>`);
                }
            });

            // Pagination
            $('.paginationNav').prepend(`<p>Total record count: ${validRecordCount}<br>Max records per page: ${MAX_ROWS}</p>`);

            for (let i = 1; i <= pageCount; i++) {
                $(`<li class="page-item ${(i === pageNum) ? 'active' : ''}"><a class="page-link" href="/records/page/${i}">${i}</a></li>\n`).insertBefore('.next');
            }
        });
});