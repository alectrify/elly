const _ = require('lodash');
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    batchNum: Number, // Range: [0, Infinity]
    pageNum: Number, // Range: [1, 5]
    ocrResults: [String],
    isNewForm: Boolean,
    patientData: {
        barcode: String,
        physician: String,
        npi: String,
        collectionDate: String,
        collectionLocation: String,
        firstName: String,
        middleName: String,
        lastName: String,
        birthDate: String,
        sex: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        insuranceName: String,
        insuranceNum: String,
        ssn: String,
        driverLicense: String,
        passport: String,
        symptoms: String,
        race: String,
        ethnicity: String,
        labID: String,
        receivedDate: String,
        sampleType: String,
        result: String,
        ACI: String,
        paymentRequestDate: String,
        paymentReceivedAmount: String,
        paymentReceivedDate: String,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

/* ---------- VIRTUALS ---------- */
/* ----- Property: reportData ----- */
recordSchema.virtual('reportData').get(function () {
    return {
        patientID: this.patientData.barcode,
        clientGroup: this.patientData.collectionLocation,
        labID: this.patientData.labID,
        name: `${this.patientData.firstName} ${this.patientData.lastName}`,
        testDate: this.patientData.collectionDate,
        receivedDate: this.patientData.receivedDate,
        sampleType: this.patientData.sampleType,
        result: this.patientData.result,
        ACI: this.patientData.ACI,
        paymentRequestDate: this.patientData.paymentRequestDate,
        paymentReceivedAmount: this.patientData.paymentReceivedAmount,
        paymentReceivedDate: this.patientData.paymentReceivedDate
    }
});

recordSchema.virtual('reportData').set(function (data) {
    const firstName = data.name.substring(0, data.name.indexOf(' '));
    const lastName = data.name.substring(data.name.indexOf(' ') + 1);

    _.assign(this.patientData, {
        patientID: data.patientID,
        clientGroup: data.clientGroup,
        labID: data.labID,
        firstName,
        lastName,
        testDate: data.testDate,
        receivedDate: data.receivedDate,
        sampleType: data.sampleType,
        result: data.result,
        ACI: data.ACI,
        paymentRequestDate: data.paymentRequestDate,
        paymentReceivedAmount: data.paymentReceivedAmount,
        paymentReceivedDate: data.paymentReceivedDate
    });
});

module.exports = mongoose.model('Record', recordSchema);