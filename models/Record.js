const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    batchNum: Number, // Range: [0, Infinity]
    pageNum: Number, // Range: [1, 5]
    ocrResults: [String],
    patientData: {},
    reportData: {}
});

module.exports = mongoose.model('Record', recordSchema);