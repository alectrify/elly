const editModal = document.getElementById('editModal');
editModal.addEventListener('show.bs.modal', function (event) {
    let editButton = event.relatedTarget;
    let recordID = editButton.getAttribute('data-id');
    let form = $('#editForm');

    form.empty();
    form.attr('action', `/api/edit/${recordID}`);

    function addSingleInput(fieldName, fieldTitle, value) {
        form.append(`<div class="mb-3">
                <label for="${fieldName}" class="form-label">${fieldTitle}</label>
                <input type="text" class="form-control" id="${fieldName}" name="${fieldName}" value="${value}">
            </div>`);
    }

    function addMultiInput(colArray) {
        const row = $('<div class="row mb-3"></div>');
        colArray.forEach((col) => {
            const [fieldName, fieldTitle, value] = col;
            row.append(`<div class="col">
                <label for="${fieldName}" class="form-label">${fieldTitle}</label>
                <input type="text" class="form-control" id="${fieldName}" name="${fieldName}" value="${value}">
            </div>`)
        })

        form.append(row);
    }

    fetch(`/api/record/${recordID}`)
        .then((response) => response.json())
        .then((record) => {
            let reportData = record.reportData;

            addMultiInput([
                ['patientID', 'Patient ID', reportData.patientID],
                ['clientGroup', 'Client Group', reportData.clientGroup]
            ]);
            addSingleInput('labID', 'Lab ID', reportData.labID);
            addSingleInput('name', 'Name', reportData.name);
            addSingleInput('receivedDate', 'Submitted', reportData.receivedDate);
            addMultiInput([
                ['result', 'N/P/In-V/Re-test', reportData.result],
                ['testDate', 'Test Date', reportData.testDate]
            ]);
            addMultiInput([
                ['ACI', 'A/C/I', reportData.ACI],
                ['paymentRequestDate', 'Payment Request Date', reportData.paymentRequestDate]
            ]);
            addMultiInput([
                ['paymentReceivedAmount', 'Payment Received Amount', reportData.paymentReceivedAmount],
                ['paymentReceivedDate', 'Payment Received Date', reportData.paymentReceivedDate]
            ]);

            $('input').css('background-color', '#fff3cd');
        });
});