const mongoose = require('mongoose');

const pdfBatchSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    batchNum: Number,
    pageCount: Number,
    pdf: Buffer,
    newForms: Boolean,
    date: {
        type: Date,
        default: Date.now
    }
}, {collection: 'pdfbatches'});

module.exports = mongoose.model('PDFBatch', pdfBatchSchema);