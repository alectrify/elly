/* ---------- MODULES ---------- */
const _ = require('lodash');
const chalk = require('chalk');
const createDOMPurify = require('dompurify');
const express = require('express');
const fs = require('fs');
const {JSDOM} = require('jsdom');
const mongoose = require('mongoose');
const multer = require('multer');
const {PDFDocument} = require('pdf-lib');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');
const XLSX = require('xlsx');

/* ---------- INSTANCES ---------- */
const client = new vision.ImageAnnotatorClient();
const DOMPurify = createDOMPurify(new JSDOM('').window); // Use DOMPurify.sanitize(dirty) on inputs
const router = express.Router();
const PDFBatch = require('../models/PDFBatch');
const Record = require('../models/Record');

/* ---------- CONSTANTS ---------- */
const EXCEL_MIMETYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
];
const LOGGING = true;
const PDF_BATCH_CAPACITY = 5;

/* ---------- FUNCTIONS ---------- */
function logCall(route) {
    if (LOGGING) {
        console.log(chalk.yellow(`- API Call: ${route} at ${new Date().toUTCString()}`));
    }
}

/* ---------- INITIALIZATION ---------- */
/* ----- MULTER ----- */
const upload = multer({
    dest: 'temp/',
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/.(pdf|xls|xlsx)$/i)) {
            cb(undefined, true);
        } else {
            throw new Error('Invalid file format');
        }
    }
});

const uploadStandard = multer({
    dest: 'temp/',
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/.(jpeg|jpg|png)$/i)) {
            cb(undefined, true);
        } else {
            throw new Error('Invalid file format');
        }
    }
});

/* ---------- ROUTES ---------- */
router.get('/clear', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    // Delete all PDFBatch documents
    PDFBatch.deleteMany((err) => {
        if (err) throw err;
    });

    // Delete all Record documents
    Record.deleteMany((err) => {
        if (err) throw err;

        res.redirect('/records');
    });
});

// GET /api/ocr/:id/:batch/:page - Get OCR data on a requested page
router.get('/ocr/:id/:batch/:page', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batchNum = parseInt(req.params.batch);
    const pageNum = parseInt(req.params.page);

    Record.findOne({id, batchNum, pageNum}, 'ocrResults isNewForm', async (err, record) => {
        if (record && record.isNewForm && record.ocrResults.length === 2) {
            // Standardized form processing
            let textArray = [];

            for (const index in record.ocrResults) {
                const filePath = record.ocrResults[index];

                console.log('< Running Vision API');
                const [result] = await client.documentTextDetection(filePath).catch();
                console.log('> Finished Running Vision API');
                const fullTextAnnotation = result.fullTextAnnotation;

                fullTextAnnotation.pages.forEach(page => {
                    page.blocks.forEach(block => {
                        block.paragraphs.forEach(paragraph => {
                            let paraArray = [];
                            paragraph.words.forEach(word => {
                                const wordText = word.symbols.map(symbol => (symbol.confidence > 0.5) ? symbol.text : '').join('');

                                // Removing invalid characters
                                let replaced_word_text = String(wordText);
                                replaced_word_text = replaced_word_text.replace(/[^\x20-\x7E]/g, '');

                                if (word.confidence > 0.5 && replaced_word_text.length > 0) {
                                    paraArray.push(replaced_word_text);
                                }
                            });

                            const paraText = paraArray.join(' ');

                            if (paraText.length > 0) {
                                textArray.push(paraText.trim());
                            }
                        });
                    });
                });

                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                });
            }

            record.ocrResults = textArray;
            record.save();

            res.json(record);
        } else if (record && record.ocrResults) {
            res.json(record);
        } else {
            // Random form processing
            PDFBatch.findOne({id, batchNum}, 'pdf', async (err, batch) => {
                if (err) throw err;

                // Google Vision API
                const inputConfig = {
                    mimeType: 'application/pdf',
                    content: batch.pdf
                };

                const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];

                const fileRequest = {
                    inputConfig: inputConfig,
                    features: features,
                    // Annotate the current page. (max 5 pages in one request)
                    // First page starts at 1, and not 0. Last page is -1.
                    pages: [pageNum],
                };

                // Add each `AnnotateFileRequest` object to the batch request.
                const request = {
                    requests: [fileRequest],
                };

                // Make the synchronous batch request.
                console.log('< Running Vision API');
                const [result] = await client.batchAnnotateFiles(request);
                console.log('> Finished Running Vision API');

                // Process the results, just get the first result, since only one file was sent in this
                // sample.
                const responses = result.responses[0].responses;
                let textArray = [];

                responses.forEach(response => {
                    response.fullTextAnnotation.pages.forEach(page => {
                        page.blocks.forEach(block => {
                            block.paragraphs.forEach(paragraph => {
                                let paraArray = [];

                                paragraph.words.forEach(word => {
                                    const wordText = word.symbols.map(symbol => (symbol.confidence > 0.5) ? symbol.text : '').join('');

                                    //Removing unnecessary characters
                                    let replaced_word_text = String(wordText);
                                    replaced_word_text = replaced_word_text.replace(/[^\x20-\x7E]/g, '');
                                    replaced_word_text = replaced_word_text.replace(/[{}()%&!*:]/g, '');
                                    replaced_word_text = replaced_word_text.replace(/Signature/g, '');

                                    if (word.confidence > 0.5 && replaced_word_text.length > 0) {
                                        paraArray.push(replaced_word_text);
                                    }
                                });

                                let paraText = paraArray.join(' ').trim();
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
                                    'doctor'
                                ];

                                let filteredPar = paraText;
                                filteredPar = filteredPar.replace(/(\so\s)+/i, '');
                                filteredPar = filteredPar.replace(/^(o\s)+/i, '');
                                filteredPar = filteredPar.replace(new RegExp(keywords.join('|'), 'i'), '');

                                if (paraText.length > 1 && paraText === filteredPar) {
                                    textArray.push(paraText);
                                }
                            });
                        });
                    });
                });

                record = await Record.create({
                    id,
                    batchNum,
                    pageNum,
                    ocrResults: textArray,
                });

                res.json(record);
            });
        }
    });
});

router.post('/upload', upload.single('uploadFile'), async (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    // If excel file upload
    if (EXCEL_MIMETYPES.includes(req.file.mimetype)) {
        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, {defval: ''});

        let patientIds = [];

        data.forEach((record) => {
            record.receivedDate = new Date().toISOString().substring(0, 10);

            // Do not add duplicate
            if (patientIds.includes(record.barcode)) {
                return;
            }
            if (record.barcode !== '') {
                patientIds.push(record.barcode);
            }

            // Populate reportData
            if (record.collectionDate !== '') {
                const testDate = XLSX.SSF.parse_date_code(parseInt(record.collectionDate));
                record.collectionDate = new Date(testDate.y, testDate.m - 1, testDate.d).toISOString().substring(0, 10);
            }

            const newRecord = new Record({
                patientData: record
            });

            newRecord.save((err) => {
                if (err) throw err;
            });
        });

        fs.unlink(req.file.path, (err) => {
            if (err) throw err;
        });

        res.redirect('/records');

    } else if (req.file.mimetype === 'application/pdf') {
        const pdf = fs.readFileSync(req.file.path);
        const srcDoc = await PDFDocument.load(pdf);

        const pageCount = srcDoc.getPageCount();
        const pageNumArray = srcDoc.getPageIndices();
        const chunkSize = PDF_BATCH_CAPACITY;
        const modelID = new mongoose.Types.ObjectId();

        for (let i = 0; i < pageCount; i += chunkSize) {
            const pagesLeft = pageCount - i;
            const thisChunkSize = Math.min(chunkSize, pagesLeft); // This chunk's size = # of pages left if there are less than chunkSize
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

// POST /api/upload-standard - Uploading a new file (standard form)
router.post('/upload-standard', uploadStandard.array('forms', 2), async (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    if (req.files[0].mimetype.includes('image')) {
        let paths = [];

        const modelID = new mongoose.Types.ObjectId();
        const pdfDoc = await PDFDocument.create();

        for (const index in [0, 1]) {
            const file = req.files[index];

            if (!file) {
                return;
            }

            paths.push(file.path);

            const page = pdfDoc.addPage();

            const originalImg = fs.readFileSync(file.path);
            const pngImg = await sharp(originalImg).jpeg().greyscale().rotate().toBuffer();
            const embed = await pdfDoc.embedJpg(pngImg);
            const scaled = embed.scaleToFit(page.getWidth(), page.getHeight());

            page.drawImage(embed, {
                width: scaled.width,
                height: scaled.height
            });

            await pdfDoc.save();
        }

        const pdfBytes = await pdfDoc.save();

        await PDFBatch.create({
            id: modelID,
            batchNum: 0,
            pageCount: 2,
            pdf: Buffer.from(pdfBytes)
        });

        await Record.create({
            id: modelID,
            batchNum: 0,
            pageNum: 1,
            isNewForm: true,
            ocrResults: paths
        });

        res.redirect(`/edit/${modelID}/0/1`);

    } else {
        res.redirect('/');
    }
});

module.exports = router;