/* ---------- MODULES ---------- */
const _ = require('lodash');
const chalk = require('chalk');
const createDOMPurify = require('dompurify');
const express = require('express');
const {JSDOM} = require('jsdom');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

/* ---------- INSTANCES ---------- */
const DOMPurify = createDOMPurify(new JSDOM('').window); // Use DOMPurify.sanitize(dirty) on inputs
const router = express.Router();
const PDFBatch = require('../models/PDFBatch');
const Record = require('../models/Record');

/* ---------- CONSTANTS ---------- */
const LOGGING = true;
const PDF_BATCH_CAPACITY = 5;

/* ---------- FUNCTIONS ---------- */
function logCall(route) {
    if (LOGGING) {
        console.log(chalk.yellow(`- API Call: ${route} at ${new Date().toUTCString()}`));
    }
}

/* ---------- INITIALIZATION ---------- */

/* ---------- ROUTES ---------- */
// Delete currently logged in record.
router.delete('/', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    if (req.session._id) {
        Record.findByIdAndDelete(req.session._id, (err) => {
            if (err) console.error(err);

            res.redirect('/logout');
        });
    } else {
        res.redirect('/');
    }
});

// Get all records.
router.get('/all', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    Record.find({}, (err, records) => {
        if (err) throw err;

        res.json(records);
    });
});

// Get all records.
router.get('/xlsx', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    Record.find({}, (err, records) => {
        if (err) throw err;

        const workbook = XLSX.utils.book_new();
        let worksheet = XLSX.utils.json_to_sheet(records.map(record => JSON.parse(JSON.stringify(record.patientData))));

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

        const workbookBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});

        res.set({
            'Content-Disposition': `attachment; filename=records.xlsx`,
            'Content-Type': 'application/octet-stream'
        });
        res.send(workbookBuffer);
    });
});

// Get all records.
router.get('/xlsx/:id', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    Record.findById(req.params.id, (err, record) => {
        if (err) throw err;

        const workbook = XLSX.utils.book_new();
        let worksheet = XLSX.utils.json_to_sheet([JSON.parse(JSON.stringify(record.patientData))]);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

        const workbookBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});

        res.set({
            'Content-Disposition': `attachment; filename=${record.patientData.barcode}.xlsx`,
            'Content-Type': 'application/octet-stream'
        });
        res.send(workbookBuffer);
    });
});

router.post('/xlsx-range', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const date1 = req.body.date1.split("-");
    const date2 = req.body.date2.split("-");

    //Improve algorithm later (finding specific date)
    const numDays1 = (parseInt(date1[1]) * 30) + parseInt(date1[2]);
    const numDays2 = (parseInt(date2[1]) * 30) + parseInt(date2[2]);
    console.log(numDays1);
    console.log(numDays2);

    Record.find({}, (err, records) => {
        if (err) throw err;

        records = records.filter((record) => {
            //Two different arrays to for different formatting
            const recordDaysArr1 = record.reportData.testDate.split("/");
            const recordDaysArr2 = record.reportData.testDate.split('-');
            const recordDays1 = parseInt(recordDaysArr1[0]) * 30 + parseInt(recordDaysArr1[1]);
            const recordDays2 = parseInt(recordDaysArr2[1]) * 30 + parseInt(recordDaysArr2[2]);

            if (!isNaN(recordDays1)) {

                if (recordDays1 >= numDays1 && recordDays1 <= numDays2) {
                    return record;
                }
            }

            if (!isNaN(recordDays2)) {
                if (recordDays2 >= numDays1 && recordDays2 <= numDays2) {
                    return record;
                }
            }
        });

        const copies = records.map(record => JSON.parse(JSON.stringify(record.patientData)));
        const copy = records[0].patientData;
        console.log(copies[0]);

        const workbook = XLSX.utils.book_new();
        let worksheet = XLSX.utils.json_to_sheet(copies);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

        const workbookBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});

        res.set({
            'Content-Disposition': `attachment; filename=records-in-range.xlsx`,
            'Content-Type': 'application/octet-stream'
        });
        res.send(workbookBuffer);
    });
});

// Create a record.
router.post('/:id/:batch/:page', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batchNum = parseInt(req.params.batch);
    const pageNum = parseInt(req.params.page);
    let isNewForm = false;

    Record.findOne({id, batchNum, pageNum}, (err, record) => {
        if (err) throw error;

        const today = new Date();
        today.toISOString().substring(0, 10);

        if (Array.isArray(req.body.symptoms)) {
            req.body.symptoms = req.body.symptoms.join(',');
        }

        record.patientData = {
            barcode: req.body.barcode,
            physician: req.body.physician,
            npi: req.body.npi,
            collectionDate: req.body.collectionDate,
            collectionLocation: req.body.collectionLocation,
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            birthDate: req.body.birthDate,
            sex: req.body.sex,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            insuranceName: req.body.insuranceName,
            insuranceNum: req.body.insuranceNum,
            ssn: req.body.ssn,
            driverLicense: req.body.driverLicense,
            passport: req.body.passport,
            symptoms: req.body.symptoms,
            race: req.body.race,
            ethnicity: req.body.ethnicity,
            labID: '',
            receivedDate: new Date().toISOString().substring(0, 10),
            sampleType: '',
            result: '',
            ACI: '',
            paymentRequestDate: '',
            paymentReceivedAmount: '',
            paymentReceivedDate: ''
        };

        record.save();

        if (record.isNewForm) {
            isNewForm = true;
        }
    });

    // Check whether to redirect to records table or next page to edit
    const nextPageNum = (pageNum === PDF_BATCH_CAPACITY) ? 1 : pageNum + 1;
    const nextBatchNum = (pageNum === PDF_BATCH_CAPACITY) ? batchNum + 1 : batchNum;

    PDFBatch.findOne({id, batchNum: nextBatchNum}, 'pageCount', (err, batch) => {
        if (err) throw err;

        if (batch) {
            if (nextPageNum <= batch.pageCount && !isNewForm) {
                res.redirect(`/edit/${id}/${nextBatchNum}/${nextPageNum}`);
            } else {
                res.redirect('/records');
            }
        } else {
            res.redirect('/records');
        }
    });
});

// Get a specific record.
router.get('/:id', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    Record.findById(req.params.id, (err, record) => {
        if (err) throw err;

        res.json(record);
    });
});

// Edit a specific record.
router.put('/:id', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    Record.findById(req.params.id, (err, record) => {
        if (err) throw err;
        record.reportData = req.body;
        record.save();

        res.redirect('/records');
    });
});

// Delete a specific record.
router.delete('/:id', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    Record.findByIdAndDelete(req.params.id, (err) => {
        if (err) throw err;

        res.redirect('/records');
    });
});

// Get a specific record
router.get('/:id/:batch/:page', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batchNum = parseInt(req.params.batch);
    const pageNum = parseInt(req.params.page);

    Record.findOne({id, batchNum, pageNum}, (err, record) => {
        if (err) throw err;

        res.json(record);
    });
});

module.exports = router;