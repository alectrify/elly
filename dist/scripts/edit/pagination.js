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

                if (batch.newForms) {
                    fetch(`/records/${id}/${newBatchNum}`)
                        .then((response) => response.json())
                        .then((records) => {
                            if (newBatchNum % 2 == 0) {
                                for (let i = 1; i <= pageCount / 2; i++) {
                                    const record = records[i - 1];
                                    let tooltip = 'Not Completed';
                                    let color = i === parseInt(pageNum) ? 'info' : 'primary';

                                    console.log(record);

                                    if (record && record.hasOwnProperty('patientData')) {
                                        const patientData = record.patientData;
                                        tooltip = `${patientData.barcode}: ${patientData.firstName} ${patientData.lastName}`;

                                        color = i === parseInt(pageNum) ? 'info' : 'success';
                                    }

                                    const isCurrentForm = newBatchNum === parseInt(batchNum) && i === parseInt(pageNum);
                                    let dest1 = (isCurrentForm) ? `onclick="renderPDF(1)"` : `href="/edit/${id}/${newBatchNum}/${i}"`;
                                    let dest2 = (isCurrentForm) ? `onclick="renderPDF(2)"` : `href="/edit/${id}/${newBatchNum}/${i}"`;

                                    pagination.append(`<a class="btn btn-${color} mt-2 me-2" 
                                    ${dest1}>Form ${i} - ${tooltip}</a>`);

                                    pagination.append(`<a class="btn btn-${color} mt-2 me-2" 
                                    ${dest2}>Form ${i} - ${tooltip} (2)</a>`);
                                }
                            }
                        });
                } else {
                    for (let i = 1; i <= pageCount; i++) {
                        await fetch(`/records/${id}/${newBatchNum}/${i}`)
                            .then((response) => response.json())
                            .then((record) => {
                                let tooltip = 'Not Completed';
                                let color = i === parseInt(pageNum) ? 'info' : 'primary';
                                if (record && record.hasOwnProperty('patientData')) {
                                    const patientData = record.patientData;
                                    tooltip = `${patientData.barcode}: ${patientData.firstName} ${patientData.lastName}`;

                                    color = i === parseInt(pageNum) ? 'info' : 'success';
                                }

                                pagination.append(`<a class="btn btn-${color} mt-2 me-2" 
                                    href="/edit/${id}/${newBatchNum}/${i}">Page ${i} - ${tooltip}</a>`);
                            });
                    }
                }
            });
    });

    $('#next').trigger('click');
});