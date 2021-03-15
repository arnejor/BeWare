// This is the Notifications template
const mongoose = require("mongoose");
const Response = require('./response');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    type: String,
    message: String,
    room: String,
    date: {
        type: Date,

    },
    anonymous: Boolean,
    
    groups: [
        {
            type: Schema.Types.ObjectId,
            ref: "Group"
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    
    response: [
        {
            type: Schema.Types.ObjectId,
            ref: "Response"
        }
    ]
});

notificationSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Response.deleteMany({
            _id: {
                $in: doc.response
            }
        })
    }
})



module.exports = mongoose.model("Notification", notificationSchema)