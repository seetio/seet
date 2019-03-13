const Promise       = require('bluebird');
const twilio        = require('twilio');
const Logger        = require('./../lib/logger');
const env           = process.env;
const accountSid    = env.TWILIO_ACCOUNT_SID;
const authToken     = env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

exports.SendSMS = function (Number, Message) {
    if ('production' !== process.env.NODE_ENV) {
        return Promise.resolve({
            MockSMS: true,
            Data: 'Not production server'
        });
    }

    return client.messages.create({
        body: Message,
        to: Number,
        from: env.TWILIO_NUMBER
    })
    .catch((twilioError) => {
        Logger.error(JSON.stringify(twilioError));

        throw new Error(twilioError.message);
    })
};
