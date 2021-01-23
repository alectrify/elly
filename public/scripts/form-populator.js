let junkWords = [
    'valid',
    'number',
    'address',
    'dob',
    'sex',
    'no.',
    'undefined',
    'collection',
    'date',
    'phone',
    'signature',
    'birth',
    'bith',
    'day',
    'yes',
    'please',
    'driver',
    'insurance',
    'name',
    'last',
    'first',
    'initial',
    'license',
    'provide',
    '\\sno\\s',
    'your',
    'ssn',
    'details',
    'if',
    `policy's`,
    'npi'
]

const junkRegExp = new RegExp(junkWords.join('|'), 'ig');

fetch(`/api/ocr/${id}/${batchNum}/${pageNum}`)
    .then(response => response.json())
    .then(response => {
        let barcode = $('#barcode');
        let physician = $('#physician');
        let npi = $('#npi');
        let collectDate = $('#collectionDate');
        let firstName = $('#firstName');
        let middleName = $('#middleName');
        let lastName = $('#lastName');
        let address = $('#address');
        let city = $('#city');
        let state = $('#state');
        let zip = $('#zip');
        let email = $('#email');
        let phone = $('#phone');
        let birthDate = $('#birthDate');
        let insuranceName = $('#insuranceName');
        let insuranceNum = $('#insuranceNum');
        let ssn = $('#ssn');
        let driverLicense = $('#driverLicense');

        let numeric = [npi, collectDate, zip, phone, birthDate, ssn];
        let alpha = [physician, firstName, middleName, lastName, city, state, insuranceName];
        let shorterFields = [middleName, physician, address, city, state];
        // let allFields = numeric.concat(barcode, address, email, insuranceNum, driverLicense, alpha);

        let textArray = response;

        function addSuggestion(element, text) {
            text = text.replaceAll(junkRegExp, '');
            text = text.replaceAll(/[,']/g, '');

            if (numeric.includes(element)) {
                text = text.replaceAll(/[A-Za-z]/g, '');
                text = text.trim();
                if (text.match(/[0-9]/g) == null) {
                    return;
                }
            }

            if (alpha.includes(element)) {
                text = text.replaceAll(/[0-9.]/g, '');
                text = text.trim();
                if (text.match(/[A-Za-z]/g) == null) {
                    return;
                }
            }

            if (!shorterFields.includes(element)) {
                if (text.length < 3) {
                    return;
                }
            }

            if (element === state) {
                if (text.length > 2) {
                    return;
                }
            }

            if (text.length < 2) {
                return;
            }

            let exists = false;

            element.next().children().slice(1).each(function () {
                if ($(this).text() === text) {
                    exists = true;
                }
            })

            if (!exists) {
                let button = $(`<button type="button" class="btn btn-sm btn-info rounded-pill mx-1 my-2"><i class="bi bi-plus"></i>${text}</button>`);

                button.click(function () {
                    element.val(element.val() + text + ' ');
                    $(`button:contains('${text}')`).hide();
                });

                element.next().append(button);
            }
        }

        function addSuggestions(element, line) {
            line.split(' ').forEach(function (text) {
                addSuggestion(element, text);
            });
        }

        function changeValIfMatch(element, lineArray, regex) {
            lineArray.forEach(function (line) {
                const match = line.match(regex);
                if (match != null) {
                    element.val(match[0]);
                }
            })
        }

        textArray.forEach(function (line, index) {
            let line01 = textArray[index - 2];
            let line0 = textArray[index - 1];
            let line2 = textArray[index + 1];
            let line3 = textArray[index + 2];
            let line4 = textArray[index + 3];

            let match;

            match = line.match(/^(CA|AA)[0-9]+/g);
            if (match != null) {
                barcode.val(match);
                addSuggestions(physician, line2);
                addSuggestions(npi, line2);
                return;
            }

            if (line.match(/Collection Date/) != null) {
                addSuggestions(collectDate, line01);
                addSuggestions(collectDate, line0);
                addSuggestions(collectDate, line);
                addSuggestions(collectDate, line2);
                changeValIfMatch(collectDate, [line01, line0, line, line2], /[0-9]{1,2}[-\s.\/][0-9]{1,2}[-\s.\/][0-9]{2,4}/g);
            }

            if (line.match(/CA/) != null) {
                addSuggestions(state, 'CA');
            }

            if (line.match(/^Address/) != null) {
                addSuggestions(firstName, line2);

                // If seemingly no middle name
                addSuggestions(lastName, line3);
                addSuggestions(lastName, line4);
                addSuggestions(address, line0);
                addSuggestions(address, line2);
                addSuggestions(address, line3);
                addSuggestions(address, line4);
                addSuggestions(city, line2);
                addSuggestions(city, line3);
                addSuggestions(city, line4);
                addSuggestions(state, line2);
                addSuggestions(state, line3);
                addSuggestions(state, line4);
                addSuggestions(middleName, line3);
            }

            if (line.match(/^city/i) != null) {
                addSuggestions(city, line2);
            }

            if (line.match(/^Name/) != null || line.match(/First/) != null) {
                addSuggestions(firstName, line);
                addSuggestions(firstName, line2);
                addSuggestions(firstName, line3);
                addSuggestions(middleName, line2);
                addSuggestions(middleName, line3);
                addSuggestions(lastName, line2);
                addSuggestions(lastName, line3);
                addSuggestions(address, line2);
                addSuggestions(address, line3);
            }

            if (line.match(/\sName$/i) != null && index < 13) {
                addSuggestions(physician, line2);
            }

            if (line.match(/@/) != null) {
                addSuggestions(email, line);
            }

            match = line.match(/^[0-9]{5}$/) || line.match(/^[0-9]{5}\s/) || line.match(/\s[0-9]{5}\s/)
            if (match != null && index < textArray.length - 12) {
                zip.val(match[0]);
                addSuggestions(zip, match[0]);
                addSuggestions(birthDate, match[0]);
            }

            if (line.match(/NPI/i) != null) {
                addSuggestions(npi, line);
                addSuggestions(npi, line2);
                addSuggestions(npi, line3);

                changeValIfMatch(npi, [line, line2, line3], /[0-9]{10}/);

                addSuggestions(collectDate, line0);
                addSuggestions(physician, line2);
                addSuggestions(physician, line3);
            }

            match = line.match(/[0-9]{10}/);
            if (match != null && index < 12 && index > 4) {
                addSuggestions(npi, match[0]);
            }

            if (line.match(/Insurance\sName/i) != null || line.match(/Carrier's\sName/i)) {
                addSuggestions(insuranceName, line);
                addSuggestions(insuranceName, line2);
            }

            if (line.match(/Insurance\sID/i) != null) {
                addSuggestions(insuranceNum, line);
                addSuggestions(insuranceNum, line2);
                changeValIfMatch(insuranceNum, [line, line2], /[0-9]{10}/);
            }

            match = line.match(/[0-9]{9,10}/);
            if (match != null) {
                addSuggestions(insuranceNum, match[0]);
            }

            if (line.match(/SSN/i) != null) {
                addSuggestions(ssn, line);
            }

            match = line.match(/[0-9]{3}(-|\s|.)[0-9]{2}(-|\s|.)[0-9]{4}/g);
            if (match != null) {
                addSuggestions(ssn, line);
                ssn.val(match[0]);
            }

            match = line.match(/[0-9]{3}(-|\s|.)[0-9]{3}(-|\s|.)[0-9]{4}/g);
            if (match != null) {
                addSuggestions(phone, line);
                phone.val(match[0]);
            }

            match = line.match(/\s+[0-9]{1,2}\s*[-\s.\/1]\s*[0-9]{1,2}\s*[-\s.\/1]\s*[0-9]{2,4}$/g);
            match2 = line.match(/\s+[0-9]{4}\s*[-\s.\/1]\s*[0-9]{1,2}\s*[-\s.\/1]\s*[0-9]{1,2}$/g);
            if ((match != null || match2 != null)) {
                addSuggestions(birthDate, line);
                birthDate.val(match2 ? match2 : match);
            }

            match = line.match(/[a-zA-Z]\s*[0-9]{7}/);
            if (match != null && index > 10) {
                addSuggestions(driverLicense, match[0]);
                driverLicense.val(match[0]);
            }
        });

        $("input[type=text]").filter(function () {
            return $(this).val() !== '';
        }).each(function() {
            let text = $(this).val();
            let textArray = text.split(' ');
            textArray.forEach(function (str) {
                $('button').filter(function() {
                    return $(this).text() === str;
                }).hide();
            });
        });
    });