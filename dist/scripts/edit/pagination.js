$(document).ready(() => {
    // Load new batch upon clicking 'previous' or 'next' batch buttons
    $('#controls').children().click(function () {
        let currentBatch = parseInt($('#batchDisplay').text()) - 1;
        let newBatchNum = currentBatch + ($(this).attr('id') === 'next' ? 1 : -1);

        fetch(`/batches/pageCount/${id}/${newBatchNum}`)
            .then((response) => response.json())
            .then(async (batch) => {
                if (!batch) {
                    return;
                }

                $('#batchDisplay').text(newBatchNum + 1);

                const pageCount = batch.pageCount;
                const pagination = $('#pagination');
                pagination.empty();

                // Add navigation button for each page
                for (let i = 1; i <= pageCount; i++) {
                    await fetch(`/records/${id}/${newBatchNum}/${i}`)
                        .then((response) => response.json())
                        .then((batch) => {
                            let tooltip = 'Not Completed';
                            let color = i === parseInt(pageNum) ? 'info' : 'primary';
                            if (batch && batch.hasOwnProperty('patientData') && batch.patientData.hasOwnProperty('barcode')) {
                                const patientData = batch.patientData;
                                tooltip = `${patientData.barcode}: ${patientData.firstName} ${patientData.lastName}`;

                                color = i === parseInt(pageNum) ? 'info' : 'success';
                            }

                            // If standardized form, simply render page and do not redirect
                            if (!batch || batch.hasOwnProperty('isNewForm') || !batch.hasOwnProperty('patientData')) {
                                pagination.append(`<button id="pg${i}" class="btn btn-${color} mt-2 me-2" 
                                    onclick="renderPDF(${i})"">Page ${i} - ${tooltip}</button>`);
                            } else {
                                pagination.append(`<a id="pg${i}" class="btn btn-${color} mt-2 me-2" 
                                    href="/edit/${id}/${newBatchNum}/${i}">Page ${i} - ${tooltip}</a>`);
                            }
                        });
                }
            });
    });

    $('#next').trigger('click');
});