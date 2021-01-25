$(document).ready(() => {
    $('#controls').children().click(function() {
        let currentBatch = parseInt($('#batchDisplay').text()) - 1;
        let newBatchNum = currentBatch + ($(this).attr('id') === 'next' ? 1 : -1);

        fetch(`/api/batch/${id}/${newBatchNum}`)
            .then((response) => response.json())
            .then(async (batch) => {
                if (!batch) {
                    return;
                }

                $('#batchDisplay').text(newBatchNum + 1);

                const pageCount = batch.pageCount;
                const pagination = $('#pagination');
                pagination.empty();

                for (let i = 1; i <= pageCount; i++) {
                    await fetch(`/api/record/${id}/${newBatchNum}/${i}`)
                        .then((response) => response.json())
                        .then((batch) => {
                            let tooltip = '';
                            let color = i === parseInt(pageNum) ? 'info' : 'primary';
                            if (batch && batch.hasOwnProperty('patientData')) {
                                const patientData = batch.patientData;
                                tooltip = ` - ${patientData.barcode}: ${patientData.firstName} ${patientData.lastName}`;

                                color = i === parseInt(pageNum) ? 'info' : 'success';
                            }

                            pagination.append(`<a class="btn btn-${color} mt-2 me-2" 
                                    href="/edit/${id}/${newBatchNum}/${i}">Page ${i}${tooltip}</a>`);
                        });
                }
            });
    });

    $('#next').trigger('click');
});