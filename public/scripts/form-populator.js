fetch(`/api/ocr/${id}/${batchNum}/${pageNum}`)
    .then(response => response.json())
    .then(response => {
        console.log(response);
        let textArray = response;
        let collectDate = $('#collectionDate');
        let numeric = [$('#npi'), collectDate, $('#zip'), $('#phone'), $('#birthDate'), $('#ssn')];
        let alpha = [$('#physician'), $('#firstName'), $('#middleName'), $('#lastName'), $('#city'), $('#state'), $('#insuranceName')];

        textArray.forEach(function (line, index) {
            let match;
            if (line.match(/^(CA|AA)[0-9]+/) != null) {
                $('#barcode').val(line);
            }

            if (line.match(/Collection Date/) != null) {
                collectDate.val(collectDate.val() + line + textArray[index + 1] + textArray[index + 2] + textArray[index + 3]);
            }

            if (line.match(/CA/) != null) {
                $('#state').val('CA');
            }

            if (line.match(/^Address/) != null) {
                $('#firstName').val($('#firstName').val() + textArray[index + 1]);

                let addressLineSplit = textArray[index + 2].split(' ');
                // If seemingly no middle name
                $('#lastName').val($('#lastName').val() + " " + addressLineSplit[0] + addressLineSplit[index + 3]);
                $('#address').val($('#address').val() + textArray[index + 1] + addressLineSplit.slice(1, -2).join(' ') + textArray[index + 3] + textArray[index - 1]);
                $('#city').val($('#address').val() + addressLineSplit.slice(-2).join(' ') + textArray[index + 3]);
                $('#state').val($('#state').val() + textArray[index + 3] + textArray[index + 4]);
                $('#middleName').val($('#middleName').val() + " " + textArray[index + 2]);
            }

            if (line.match(/^Name/) != null || line.match(/First/) != null) {
                $('#firstName').val($('#firstName').val() + " " + textArray[index + 1] + textArray[index + 2]);
                $('#lastName').val($('#lastName').val() + " " + textArray[index + 1] + textArray[index + 2]);
                $('#address').val(textArray[index + 1] + textArray[index + 2]);
            }

            if (line.match(/\sName$/i) != null) {
                let physician = $('#physician');

                physician.val(physician.val() + textArray[index + 1]);
            }

            if (line.match(/@/) != null) {
                $('#email').val(line);
            }

            match = line.match(/^[0-9]{5}$/) || line.match(/^[0-9]{5}\s/) || line.match(/\s[0-9]{5}\s/)
            if (match != null && index < textArray.length - 12) {
                $('#zip').val(match);
                $('#phone').val($('#phone').val() + textArray[index + 1]);
                $('#birthDate').val($('#birthDate').val() + textArray[index + 1]);
                match = null;
            }

            if (line.match(/NPI/i) != null) {
                let npi = $('#npi');
                let physician = $('#physician');

                textArray.slice(0, 6).forEach((line) => {
                    let match = line.match(/[0-9]{10}/);

                    if (match) {
                        npi.val(match);
                    }
                })

                collectDate.val(collectDate.val() + textArray[index - 1]);
                npi.val(npi.val() + " " + textArray[index + 1].split(' ')[0] + textArray[index + 2].split(' ')[0] + textArray[index - 1]);
                physician.val(physician.val() + textArray[index + 1] + textArray[index + 2] + textArray[index + 3]);
            }

            match = line.match(/[0-9]{10}/);
            if (match != null && index < textArray.length - 12 && index > 4) {
                $('#npi').val($('#npi').val() + " " + match[0]);
                match = null;
            }

            if (line.match(/Insurance\sName/i) != null) {
                let insuranceName = $('#insuranceName');
                insuranceName.val(line + textArray[index + 1]);
                insuranceName.val(insuranceName.val().replace(/Insurance Name/i, ''));
            }

            if (line.match(/Insurance\sID/i) != null) {
                let insuranceNum = $('#insuranceNum');
                insuranceNum.val(line);
                insuranceNum.val(insuranceNum.val().replace(/Insurance ID/i, ''));
                insuranceNum.val(insuranceNum.val().replace(/Policy's number or/i, ''));
            }

            match = line.match(/[0-9]{9,10}/);
            if (match != null) {
                $('#insuranceNum').val(match[0]);
                match = null;
            }

            if (line.match(/SSN/i) != null) {
                let splitLine = line.split(' ');
                $('#ssn').val(splitLine.splice(splitLine.indexOf('SSN') + 1).join(' '));
            }

            match = line.match(/[0-9]{3}-[0-9]{2}-[0-9]{4}/) || line.match(/[0-9]{3}\s[0-9]{2}\s[0-9]{4}/);
            if (match != null) {
                $('#ssn').val(line);
                match = null;
            }

            match = line.match(/[0-9]{3}-[0-9]{3}-[0-9]{4}/) || line.match(/[0-9]{3}\s[0-9]{3}\s[0-9]{4}/);
            if (match != null) {
                $('#phone').val(line);
                match = null;
            }

            match = line.match(/[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}/) || line.match(/[0-9]{1,2}\s[0-9]{1,2}\s[0-9]{4}/);
            match = match || line.match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/) || line.match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}/);
            if (match != null) {
                $('#birthDate').val($('#birthDate').val() + line);
                match = null;
            }

            match = line.match(/[a-zA-Z][0-9]{7}/);
            if (match != null && index > 10) {
                $('#driverLicense').val(match);
                match = null;
            }
        });

        numeric.forEach((selector) => {
            if (selector.val()) {
                selector.val(selector.val().replaceAll(/[A-Za-z,']/ig, ''));
            }
        });

        alpha.forEach((selector) => {
            if (selector.val()) {
                selector.val(selector.val().replaceAll(/[0-9.']/ig, ''));
            }
        });

        $('input').each(function (index) {
            $(this).val($(this).val().trim());
            $(this).val($(this).val().replaceAll(/valid|number|address|dob|sex|no.|undefined|collection|date|phone|signature|birth|bith|day|yes|please|driver|insurance|name|license|provide|\sno\s| details|if/ig, ''));
            $(this).val($(this).val().replaceAll(/\s\s+/g, ' '));
        })
    });