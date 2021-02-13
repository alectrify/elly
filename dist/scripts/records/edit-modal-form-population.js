const editModal = document.getElementById('editModal');
editModal.addEventListener('show.bs.modal', function (event) {
    let editButton = event.relatedTarget;
    let recordID = editButton.getAttribute('data-id');
    let form = $('#editForm');

    form.empty();
    form.attr('action', `/records/${recordID}`);

    function addSingleInput(fieldName, fieldTitle, value, type='text') {
        form.append(`<div class="mb-3">
                <label for="${fieldName}" class="form-label">${fieldTitle}</label>
                <input type="${type}" class="form-control" id="${fieldName}" name="${fieldName}" value="${value}">
            </div>`);
    }

    function addMultiInput(colArray, typeArray = new Array(colArray.length).fill('text')) {
        const row = $('<div class="row mb-3"></div>');
        colArray.forEach((col, index) => {
            const [fieldName, fieldTitle, value] = col;
            row.append(`<div class="col">
                <label for="${fieldName}" class="form-label">${fieldTitle}</label>
                <input type="${typeArray[index]}" class="form-control" id="${fieldName}" name="${fieldName}" value="${value}">
            </div>`)
        })

        form.append(row);
    }

    fetch(`/records/${recordID}`)
        .then((response) => response.json())
        .then((record) => {
            let reportData = record.reportData;

            addMultiInput([
                ['patientID', 'Patient ID', reportData.patientID],
                ['clientGroup', 'Client Group', reportData.clientGroup]
            ]);
            addSingleInput('labID', 'Lab ID', reportData.labID);
            addSingleInput('name', 'Name', reportData.name);
            addMultiInput([
                ['testDate', 'Test Date', reportData.testDate],
                ['receivedDate', 'Submitted', reportData.receivedDate]
            ], ['date', 'date']);
            addMultiInput([
                ['sampleType', 'Sample Type', reportData.sampleType],
                ['result', 'N/P/In-V/Re-test', reportData.result]
            ]);
            addMultiInput([
                ['ACI', 'A/C/I', reportData.ACI],
                ['paymentRequestDate', 'Payment Request Date', reportData.paymentRequestDate]
            ], ['text', 'date']);
            addMultiInput([
                ['paymentReceivedAmount', 'Payment Received Amount', reportData.paymentReceivedAmount],
                ['paymentReceivedDate', 'Payment Received Date', reportData.paymentReceivedDate]
            ], ['number', 'date']);

            $('input').css('background-color', '#fff3cd');
        });
});