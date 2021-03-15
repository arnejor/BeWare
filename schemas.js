const Joi = require("joi");
const { number } = require('joi');

module.exports.notificationSchema = Joi.object({
    notification: Joi.object({
        type: Joi.string().required(),
        message: Joi.string().required(),
        date: Joi.number().optional(),
        groups: Joi.required()


    }).required()
});
// THis file is for validation schemas with JOI. See episeode 445


