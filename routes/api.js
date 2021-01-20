/* ---------- PACKAGES ---------- */
const DOTENV_RESULT = require('dotenv').config();
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const PDFDocument = require('pdf-lib').PDFDocument;
const vision = require('@google-cloud/vision');
const XLSX = require('xlsx');

/* ---------- CONSTANTS ---------- */
const client = new vision.ImageAnnotatorClient();
const EXCEL_MIMETYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
];
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:1234elly@cluster0.81swg.mongodb.net/<dbname>?retryWrites=true&w=majority';
const PDF_BATCH_CAPACITY = 5;
const PDF_MIMETYPE = 'application/pdf';
const router = express.Router();

/* ---------- FUNCTIONS ---------- */
function logCall(route) {
    console.log(`API Call: /api${route} at ${new Date().toUTCString()}`);
}

/* ---------- INITIALIZATION ---------- */
/* ----- DOTENV ----- */
if (DOTENV_RESULT.error) {
    console.log(DOTENV_RESULT.error);
}

/* ----- EXPRESS ----- */


/* ----- MONGOOSE ----- */
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).catch((err) => console.log(err));
const Record = require('../models/Record');
const PDFBatch = require('../models/PDFBatch');

/* ----- MULTER ----- */
const upload = multer({
    dest: 'temp/',
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/.(pdf|xls|xlsx)$/)) {
            cb(undefined, true);
        } else {
            throw new Error('Invalid file format: must be .pdf, .xls, or .xlsx');
        }
    }
});

/* ---------- ROUTES ---------- */
// GET /api/clear - Clear the database
router.get('/clear', (req, res) => {
    logCall(req.route.path);

    // Delete all PDFBatch documents
    PDFBatch.deleteMany()
        .catch((err) => res.status(400).json('Error: ' + err));

    // Delete all Record documents
    Record.deleteMany()
        .then(() => {
            res.redirect('/records');
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

// GET /api/delete/:id - Deleting a record by id
router.get('/delete/:id', (req, res) => {
    logCall(req.route.path);

    Record.findByIdAndRemove(req.params.id)
        .then(() => {
            res.redirect('/records');
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

// GET /api/ocr/:id/:batch/:page - Get OCR data on a requested page
router.get('/ocr/:id/:batch/:page', (req, res) => {
    logCall(req.route.path);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batch = parseInt(req.params.batch);
    const page = parseInt(req.params.page);

    Record.findOne({
        id: id,
        batchNum: batch,
        pageNum: page
    }, 'ocrResults')
        .then((record) => {
            if (record && record.ocrResults) {
                res.json(record.ocrResults);
            } else {
                PDFBatch.findOne({
                    id: id,
                    batchNum: batch
                }, 'pdf')
                    .then(async (doc) => {
                        // Vision API
                        // First Specify the input config with the file's path and its type.
                        // Supported mime_type: application/pdf, image/tiff, image/gif
                        // https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#inputconfig
                        const inputConfig = {
                            mimeType: 'application/pdf',
                            content: doc.pdf
                        };

                        // Set the type of annotation you want to perform on the file
                        // https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.Feature.Type
                        const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];

                        // Build the request object for that one file. Note: for additional files you have to create
                        // additional file request objects and store them in a list to be used below.
                        // Since we are sending a file of type `application/pdf`, we can use the `pages` field to
                        // specify which pages to process. The service can process up to 5 pages per document file.
                        // https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.AnnotateFileRequest

                        //for (let i = 0; i < pageCount; i++) {
                        const fileRequest = {
                            inputConfig: inputConfig,
                            features: features,
                            // Annotate the current page. (max 5 pages in one request)
                            // First page starts at 1, and not 0. Last page is -1.
                            pages: [page],
                        };

                        // Add each `AnnotateFileRequest` object to the batch request.
                        const request = {
                            requests: [fileRequest],
                        };

                        // Make the synchronous batch request.
                        console.log('< Running Vision API');
                        const [result] = await client.batchAnnotateFiles(request);

                        // Process the results, just get the first result, since only one file was sent in this
                        // sample.
                        const responses = result.responses[0].responses;
                        let textArray = [];
                        let tempText = "";
                        let rawText = "";

                        for (const response of responses) {
                            // console.log(`Full text: ${response.fullTextAnnotation.text}`);
                            // rawText = response.fullTextAnnotation.text;
                            for (const page of response.fullTextAnnotation.pages) {
                                for (const block of page.blocks) {
                                    // console.log(`Block confidence: ${block.confidence}`);
                                    for (const paragraph of block.paragraphs) {
                                        // console.log(` Paragraph confidence: ${paragraph.confidence}`);
                                        for (const word of paragraph.words) {
                                            const symbol_texts = word.symbols.map(symbol => symbol.text);
                                            const word_text = symbol_texts.join('');

                                            //Removing unnecessary characters
                                            let replaced_word_text = String(word_text);
                                            replaced_word_text = replaced_word_text.replace(/[^\x20-\x7E]/g, '');
                                            replaced_word_text = replaced_word_text.replace(/[{}%&!*:]/g, '');
                                            replaced_word_text = replaced_word_text.replace(/Signature/g, '');

                                            if (word.confidence > 0.5 /*&& word_text === replaced_word_text*/) {
                                                tempText += replaced_word_text + " ";
                                            }
                                        }

                                        tempText = tempText.trim();
                                        const keywords = [
                                            'symptoms',
                                            'result',
                                            'language',
                                            'other',
                                            'office',
                                            'travel',
                                            'fatigue',
                                            'vomiting',
                                            'facility',
                                            'patient',
                                            'doctor',
                                            'group'
                                        ];

                                        let filteredPar = tempText;
                                        /*filteredPar = filteredPar.replace(/[\[{()}\]%&!:]/g, '');*/
                                        filteredPar = filteredPar.replace(/(\so\s)+/i, '');
                                        filteredPar = filteredPar.replace(/^(o\s)+/i, '');
                                        filteredPar = filteredPar.replace(/[()]/g, '');
                                        filteredPar = filteredPar.replace(new RegExp(keywords.join('|'), 'i'), '');

                                        if (tempText.length > 1 && tempText === filteredPar) {
                                            textArray.push(tempText);
                                        }
                                        tempText = "";
                                    }
                                }
                            }
                        }
                        console.log('> Finished Running Vision API');

                        await Record.create({
                            id: id,
                            batchNum: batch,
                            ocrResults: textArray,
                            pageNum: page
                        });

                        res.json(textArray);
                    })
                    .catch((err) => res.status(400).json('Error: ' + err));
            }
        })
});

// GET /api/pdf/:id/:batch/ - Get a PDF of a requested batch
router.get('/pdf/:id/:batch', (req, res) => {
    logCall(req.route.path);

    PDFBatch.findOne({
        id: req.params.id,
        batchNum: parseInt(req.params.batch)
    }, 'pdf')
        .then((batch) => {
            res.set('Content-Type', 'application/pdf');
            res.send(batch.pdf);
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

// GET /api/records - Send JSON response of sheetJSON's for records
router.get('/records', (req, res) => {
    logCall(req.route.path);

    Record.find({}, 'sheetJSON')
        .then((records) => res.json(records))
        .catch((err) => res.status(400).json('Error: ' + err));
});

// POST /api/submit/:id/:batch/:page - Submit a record after editing
router.post('/submit/:id/:batch/:page', (req, res) => {
    logCall(req.route.path);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batch = parseInt(req.params.batch);
    const page = parseInt(req.params.page);

    // Update record with editing info
    Record.findOne({
        id: id,
        batchNum: batch,
        pageNum: page
    }, 'sheetJSON')
        .then((record) => {
            record.sheetJSON = req.body;
            record.save();
        })
        .catch((err) => res.status(400).json('Error: ' + err));

    // Check whether to redirect to records table or next page to edit
    const nextPageNum = (page === PDF_BATCH_CAPACITY) ? 1 : page + 1;
    const nextBatchNum = (page === PDF_BATCH_CAPACITY) ? batch + 1 : batch;

    PDFBatch.findOne({
        id: id,
        batchNum: nextBatchNum
    }, 'pageCount').then((batch) => {
        if (batch) {
            if (nextPageNum <= batch.pageCount) {
                res.redirect(`/edit/${id}/${nextBatchNum}/${nextPageNum}`);
            } else {
                res.redirect('/records');
            }
        } else {
            res.redirect('/records');
        }
    }).catch((err) => res.status(400).json('Error: ' + err));
});

// POST /api/upload - Uploading a new file
router.post('/upload', upload.single('uploadFile'), async (req, res) => {
    logCall(req.route.path);

    // If excel file upload
    if (EXCEL_MIMETYPES.includes(req.file.mimetype)) {
        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetJSON = XLSX.utils.sheet_to_json(worksheet);

        Record.create({
            sheetJSON: sheetJSON[0]
        }).then(() => {
            fs.unlink(req.file.path, (err) => {
                if (err) throw err;
            });

            res.redirect('/records');
        }).catch((err) => res.status(400).json('Error: ' + err));

    } else if (req.file.mimetype === PDF_MIMETYPE) {
        const pdf = fs.readFileSync(req.file.path);
        const srcDoc = await PDFDocument.load(pdf);

        const pageCount = srcDoc.getPageCount();
        const pageNumArray = srcDoc.getPageIndices();
        const chunkSize = PDF_BATCH_CAPACITY;
        const modelID = new mongoose.Types.ObjectId();

        for (let i = 0; i < pageCount; i += chunkSize) {
            const pagesLeft = pageCount - i;
            // This chunk's size = # of pages left if there are less than chunkSize
            const thisChunkSize = Math.min(chunkSize, pagesLeft);
            const pageNums = pageNumArray.slice(i, i + thisChunkSize);
            const thisDoc = await PDFDocument.create();

            const copiedPages = await thisDoc.copyPages(srcDoc, pageNums);

            copiedPages.forEach((page) => {
                thisDoc.addPage(page);
            });

            const pdfBytes = await thisDoc.save();

            await PDFBatch.create({
                id: modelID,
                batchNum: i / chunkSize,
                pageCount: thisChunkSize,
                pdf: Buffer.from(pdfBytes)
            });
        }

        fs.unlink(req.file.path, (err) => {
            if (err) throw err;
        });

        res.redirect(`/edit/${modelID}/0/1`);
    } else {
        res.redirect('/');
    }
});

// GET /api/xlsx/:id/ - Send a spreadsheet for a record
router.get('/xlsx/:id', (req, res) => {
    logCall(req.route.path);

    Record.findById(req.params.id, 'sheetJSON')
        .then((record) => {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet([record.sheetJSON]);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Result');

            const workbookBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});
            const barcode = record.sheetJSON.barcode;

            res.set({
                'Content-Disposition': `attachment; filename=${barcode}.xlsx`
            });
            res.send(workbookBuffer);
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

/* ---------- EXPORT ---------- */
module.exports = router;
