const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const responseSchema = new Schema({
    agree: Boolean,
    perceived: Boolean
});




module.exports = mongoose.model("Respose", responseSchema)