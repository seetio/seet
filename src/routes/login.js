const LoginRoutes   = require('express').Router();
const moment        = require('moment');
const Lib           = require('./../lib');
const User          = require('./../models/user');
const Logger        = require('./../lib/logger');
const SMSHelper     = require('./../lib/twilio');
const SMSLog        = require('./../models/sms');

// LoginRoutes.use(Lib.Utils.ParseUnauthorizedCompanyInfo);

LoginRoutes.get(
    '/',
    (Request, Response) => {
        if (Request.session.User) {
            return Response.redirect('/');
        }

        return Response.render('panel/login');
    }
);

LoginRoutes.post(
    '/',
    (Request, Response) => {
        let phone = Request.body.Phone;
        let company = Response.locals.company;
        let responseJson = {
            Success: false,
            Data: null
        };

        function saveUserAndSendSMS (userToUpdate) {
            let smsContent = Response.__(Lib.Enums.YourSMSCodeIs) + userToUpdate.TwoFactor.Code;

            return userToUpdate.save().then(
                () => {
                    return SMSHelper.SendSMS(phone, smsContent);
                }
            ).then(
                (SMSData) => {
                    let parsedData = {};
                    Object.keys(SMSData).map((key) => {
                       if (!key.startsWith('_')) {
                           parsedData[key] = SMSData[key];
                       }
                    });

                    SMSLog.AddLog(phone, smsContent, parsedData);
                    Request.session.TwoFactorPhone = phone;

                    responseJson.Success = true;

                    return true;
                }
            )
        }

        return User.UserModel.GetUserByPhoneAndCompanyId(phone, company._id).then(
            (ResultUser) => {
                if (null === ResultUser || true === ResultUser.IsDeleted) {
                    throw new Lib.Error(Lib.Errors.LoginErrors.UserNotExists);
                }

                if (new Date() < ResultUser.TwoFactor.Expires && Request.session.TwoFactorPhone) {
                    responseJson.Success = true;

                    return ResultUser;
                }

                ResultUser.TwoFactor.Expires = moment().add(5, 'minute').toDate();
                ResultUser.TwoFactor.Code = Lib.Utils.RandomSixDigits();

                return saveUserAndSendSMS(ResultUser);
            }
        ).catch(
            (Error) => {
                if (Error instanceof Lib.Error) {
                    responseJson.Data = Response.__(Error.message);
                } else {
                    Logger.error(Error);
                    responseJson.Data = Response.__(Lib.Errors.GeneralError);
                }

                return;
            }
        ).finally(
            () => {
                Response.json(responseJson);
            }
        );
    }
);

module.exports = LoginRoutes;
