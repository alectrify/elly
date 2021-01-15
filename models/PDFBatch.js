const mongoose = require('mongoose');

const pdfBatchSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    batchNum: Number,
    pageCount: Number,
    pdf: Buffer
});

module.exports = mongoose.model('PDFBatch', pdfBatchSchema);