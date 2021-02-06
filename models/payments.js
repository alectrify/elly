const mongoose = require("mongoose");

let paymentSchema = new mongoose.Schema({
    firstName: String, 
    lastName: String, 
    middleName: String, 
    sex: String, 
    birthDate: String, 
    passport: String, 
    nationality: String
});

module.exports = mongoose.model("Payment", paymentSchema);