/* ---------- PACKAGES ---------- */
const bodyParser = require('body-parser');
const DOTENV_RESULT = require('dotenv').config();
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');

/* ---------- CONSTANTS ---------- */
const app = express();
const EXCEL_MIMETYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
];
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:1234elly@cluster0.81swg.mongodb.net/<dbname>?retryWrites=true&w=majority';
const PDF_MIMETYPE = 'application/pdf';
const router = express.Router();

/* ---------- FUNCTIONS ---------- */
function logCall(route) {
    console.log(`API Call: /api${route} at ${new Date().toUTCString()}`);
}

/* ---------- INITIALIZATION ---------- */
/* ----- EXPRESS ----- */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

/* ----- MONGOOSE ----- */
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});
const Record = require('../models/Record');

/* ----- MULTER ----- */
const upload = multer({
    dest: 'temp/',
    fileFilter(req, file, cb) {
        if (file.originalname.match(/.(pdf|xls|xlsx)$/)) {
            cb(undefined, true);
        } else {
            throw new Error('Invalid file format: must be .pdf, .xls, or .xlsx');
        }
    }
});

/* ---------- ROUTES ---------- */
router.get('/clear', (req, res) => {
    logCall(req.route.path);

    Record.deleteMany()
        .then(() => {
            res.redirect('/records');
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

router.post('/upload', upload.single('uploadFile'), (req, res) => {
    logCall(req.route.path);

    if (EXCEL_MIMETYPES.includes(req.file.mimetype)) {
        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetJSON = XLSX.utils.sheet_to_json(worksheet);

        Record.create({
            sheetJSON: sheetJSON
        }).then(() => {
            fs.unlink(req.file.path, (err) => {
                if (err) throw err;
            });
            res.redirect('/records');
        }).catch((err) => res.status(400).json('Error: ' + err));

    } else if (req.file.mimetype === PDF_MIMETYPE) {

    } else {
        res.redirect('/');
    }
});

// Delete record
router.get('/delete/:id', (req, res) => {
    logCall(req.route.path);

    Record.findByIdAndRemove(req.params.id)
        .then(() => {
            res.redirect('/records');
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

router.get('/records', (req, res) => {
    logCall(req.route.path);

    Record.find({}, 'sheetJSON')
        .then((users) => res.json(users))
        .catch((err) => res.status(400).json('Error: ' + err));
});

router.get('/download/:id', (req, res) => {
    logCall(req.route.path);

    Record.findById(req.params.id, 'sheetJSON')
        .then((record) => {
            let workbook = XLSX.utils.book_new();
            let worksheet = XLSX.utils.json_to_sheet(record.sheetJSON);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Result');

            let workbookBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});
            let barcode = record.sheetJSON[0].barcode;

            res.set({
                'Content-Disposition': `attachment; filename=${barcode}.xlsx`
            });
            res.send(workbookBuffer);
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

/* ---------- EXPORT ---------- */
module.exports = router;
