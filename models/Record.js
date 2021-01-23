const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    batchNum: Number,
    pageNum: Number,
    ocrResults: [String],
    patientData: {},
    reportData: {}
});

module.exports = mongoose.model('Record', recordSchema);