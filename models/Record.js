const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    batchNum: Number,
    pageNum: Number,
    ocrResults: [String],
    sheetJSON: {}
});

module.exports = mongoose.model('Record', recordSchema);