const Promise   = require('bluebird');
const env       = process.env;
const mailgun   = require('mailgun-js')({apiKey: env.MAILGUN_API_KEY, domain: env.MAILGUN_DOMAIN});

const SendParsedMail = exports.SendParsedMail = function(From, To, Subject, HtmlBody) {
    return sendMail({
        from: From,
        subject: Subject,
        to: To,
        html: HtmlBody
    });
};

function sendMail(Data) {
    return new Promise(function (Resolve, Reject) {
        mailgun.messages().send(Data, function (error, body) {
            if (error) {
                return Reject(error);
            }
            return Resolve();
        });
    }).timeout(30000);
}
