/* ---------- MODULES ---------- */
const _ = require('lodash');
const chalk = require('chalk');
const createDOMPurify = require('dompurify');
const express = require('express');
const {JSDOM} = require('jsdom');
const mongoose = require('mongoose');
const {PDFDocument} = require('pdf-lib');

/* ---------- INSTANCES ---------- */
const DOMPurify = createDOMPurify(new JSDOM('').window); // Use DOMPurify.sanitize(dirty) on inputs
const router = express.Router();
const PDFBatch = require('../models/PDFBatch');

/* ---------- CONSTANTS ---------- */
const LOGGING = true;

/* ---------- FUNCTIONS ---------- */
function logCall(route) {
    if (LOGGING) {
        console.log(chalk.yellow(`- API Call: ${route} at ${new Date().toUTCString()}`));
    }
}

/* ---------- INITIALIZATION ---------- */

/* ---------- ROUTES ---------- */
// Get all batches.
router.get('/', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    PDFBatch.find({}, (err, batches) => {
        if (err) throw err;

        res.json(batches);
    });
});

// Create a batch.
router.post('/', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const fields = [req.body.firstName, req.body.lastName, req.body.email, req.body.password];

    const [firstName, lastName, email, password] = _.map(fields, DOMPurify.sanitize);

    const batch = new PDFBatch({
        firstName,
        lastName,
        email,
        password
    });

    batch.save((err) => {
        if (err) throw err;

        req.session.loggedIn = true;
        req.session._id = batch._id;
        req.session.name = `${batch.firstName} ${batch.lastName}`;

        res.redirect('/');
    });
});

// Delete currently logged in batch.
router.delete('/', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    if (req.session._id) {
        PDFBatch.findByIdAndDelete(req.session._id, (err) => {
            if (err) console.error(err);

            res.redirect('/logout');
        });
    } else {
        res.redirect('/');
    }
});

// Get a specific batch.
router.get('/:id', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    PDFBatch.findById(req.params.id, (err, batch) => {
        if (err) throw err;

        res.json(batch);
    });
});

// Delete a specific batch.
router.delete('/:id', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    PDFBatch.findByIdAndDelete(req.params.id, (err) => {
        if (err) throw err;

        res.redirect('/');
    });
});

// Get a specific batch.
router.get('/pageCount/:id/:batch', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batchNum = parseInt(req.params.batch);

    PDFBatch.findOne({id, batchNum}, 'pageCount', (err, batch) => {
        if (err) throw err;

        res.json(batch);
    });
});

// Get a PDF of a requested batch
router.get('/pdf/:id/:batch', (req, res) => {
    logCall(req.route.path);

    logCall(`${req.method} ${req.route.path}`);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batchNum = parseInt(req.params.batch);

    PDFBatch.findOne({id, batchNum}, 'pdf', (err, batch) => {
        if (err) throw err;

        res.set('Content-Type', 'application/pdf');
        res.send(batch.pdf);
    });
});

// Get a PDF of a requested page
router.get('/pdf/:id/:batch/:page', (req, res) => {
    logCall(`${req.method} ${req.route.path}`);

    const id = mongoose.Types.ObjectId(req.params.id);
    const batchNum = parseInt(req.params.batch);
    const pageNum = parseInt(req.params.page);

    PDFBatch.findOne({id, batchNum}, 'pdf', async (err, batch) => {
        if (err) throw err;

        const srcDoc = await PDFDocument.load(batch.pdf);
        const thisDoc = await PDFDocument.create();
        const [page] = await thisDoc.copyPages(srcDoc, [pageNum - 1]);
        thisDoc.addPage(page);

        const pdfBytes = await thisDoc.save();

        res.set({
            'Content-Disposition': `attachment; filename=record.pdf`,
            'Content-Type': 'application/pdf'
        });
        res.send(Buffer.from(pdfBytes));
    });
});

module.exports = router;