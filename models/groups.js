const mongoose = require("mongoose");
const { schema } = require("./user");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    name: String,
    location: String,
    description: String,
    geometry: {
        type: {
           type: String,
           enum: ['Point'],
           required: true
        }, 
        coordinates: {
            type: [Number], 
            required: true
        }
    },
    passwordTrue: Boolean,
    password: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
    


});
groupSchema.index({name: "text"});
module.exports = mongoose.model("Group", groupSchema)