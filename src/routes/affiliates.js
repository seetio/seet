const express           = require('express');
const Mail              = require('./../lib/mail');
const Affiliate         = require('./../models/affiliate');
const Company           = require('./../models/company');
const Payment           = require('./../models/payment');
const Logger            = require('./../lib/logger');
const AffiliatesRoutes  = express.Router();

AffiliatesRoutes.get(
    '/:AffiliateID([a-zA-Z0-9]{64})',
    GetAffiliate
);

AffiliatesRoutes.post(
    '/addNewAffToSys',
    AddAffiliate
);

async function GetAffiliate (Request, Response) {
    const affiliateId   = Request.params.AffiliateID;
    let affiliate       = null;
    let companies       = [];

    try {
        affiliate       = await Affiliate.AffiliateModel.findOne({ AffiliateID: affiliateId }).exec();
        companies       = await Company.CompanyModel.find({ Referer: affiliate.RefID }).lean().exec();
        let payments    = {};
        await Payment.PaymentModel.aggregate([
            {
                $match: {}
            },
            {
                $group: {
                    _id: "$CompanyID",
                    Amount: { $push: "$payment_gross" }
                }
            }
        ]).exec().map(
            (payment) => {
                payments[payment._id.toString()] = {
                    IsPaid: true,
                    Amount: payment.Amount.reduce((prev, curr) => (parseFloat(prev) || 0) + (parseFloat(curr) || 0)) * 0.15
                }
            }
        );

        for (let company of companies) {
            if (payments[company._id.toString()]) {
                company.Payments = payments[company._id.toString()];
            } else {
                company.Payments = {
                    IsPaid: false,
                    Amount: 0
                }
            }
        }

    } catch (Error) {
        Logger.Error(Error);
    }

    return Response.render('affiliate', { Affiliate: affiliate, Companies: companies });
}

async function AddAffiliate (Request, Response) {
    try {
        const result    = await new Affiliate.AffiliateModel(Request.body).save();
        const to        = `${result.FirstName} ${result.LastName} <${result.Email}>`;

        sendAffiliateWelcomeMail(to, result.AffiliateID, result.RefID);

        return Response.json(result);
    } catch (Error) {
        return Response.send(Error.stack);
    }

    function sendAffiliateWelcomeMail (To, AffiliateID, RefID) {
        const from = 'seet team <team@seet.io>';
        const subject = 'Welcome to seet - affiliates';
        const context = {
            AffiliateID : AffiliateID,
            RefID       : RefID
        };

        Response.render('mails/welcome-affiliate.html', context,
            (error, html) => {
                Mail.SendParsedMail(from, To, subject, html);
            }
        );
    }
}



module.exports = AffiliatesRoutes;
