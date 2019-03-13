const mongoose = require('mongoose');

const SMSSchema = new mongoose.Schema({
    ServerResponse: mongoose.Schema.Types.Mixed,
    To: String,
    Message: String,
    Date: {
        type: Date,
        default: Date.now
    }
},{ collection: 'SMS' });

SMSSchema.statics.AddLog = function (To, Message, ServerResponse) {
    let newSMSLog = new this({
        ServerResponse: ServerResponse,
        To: To,
        Message: Message
    });

    return newSMSLog.save();
};

const sms = mongoose.model('SMS', SMSSchema);

module.exports = sms;