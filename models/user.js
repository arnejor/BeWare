const { boolean, string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");


const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    groups: [
        {
            type: Schema.Types.ObjectId,
            ref: "Group"
    }  

    ],
    pushSubscription: {
        stype: String
    }

});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);

