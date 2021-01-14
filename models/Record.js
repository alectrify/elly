const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PDF'
    },
    pageNum: Number,
    sheetJSON: {}
});

module.exports = mongoose.model('Record', recordSchema);