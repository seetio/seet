const TwoFactroRoutes   = require('express').Router();
const moment            = require('moment');
const Lib               = require('./../lib');
const User              = require('./../models/user');
const Logger            = require('./../lib/logger');

TwoFactroRoutes.use(Lib.Utils.ParseUnauthorizedCompanyInfo);

TwoFactroRoutes.get(
    '/',
    (Request, Response) => {
        let phone = Request.session.TwoFactorPhone;

        if (!phone) {
            return Response.redirect('/login');
        }

        let company = Response.locals.company;

        return User.UserModel.GetUserByPhoneAndCompanyId(phone, company._id).then(
            (ResultUser) => {
                if (null === ResultUser) {
                    return Response.redirect('/404');
                }

                if (moment() > ResultUser.TwoFactor.Expires) {
                    return Response.redirect('/login');
                }

                return Response.render('panel/two-factor');
            }
        );
    }
);

TwoFactroRoutes.post(
    '/',
    (Request, Response) => {
        let responseJson = {
            Success: false,
            Data: null
        };

        let company     = Response.locals.company;
        let phone       = Request.session.TwoFactorPhone;
        let code        = Request.body.Code;
        let ipAddress   = Request.headers['x-forwarded-for'] || Request.connection.remoteAddress;
        let user        = {};

        if (!phone) {
            responseJson.Data = Response.__(Lib.Errors.LoginErrors.SessionTimeout);

            return Response.json(responseJson);
        }

        return User.UserModel.GetUserByPhoneAndCompanyId(phone, company._id).then(
            (ResultUser) => {
                if (!ResultUser || !ResultUser.TwoFactor.Expires || new Date() > ResultUser.TwoFactor.Expires) {
                    responseJson.Data = 503;
                    throw new Lib.Error('Code expired');
                }

                user = ResultUser;

                if (code !== ResultUser.TwoFactor.Code) {
                    responseJson.Data = Lib.Errors.LoginErrors.WrongCode;
                    throw new Lib.Error('Wrong code entered');
                }

                ResultUser.IpAddress = ipAddress;
                ResultUser.TwoFactor.Expires = new Date();

                return ResultUser.save();
            }
        ).then(
            () => {
                delete Request.session.TwoFactorPhone;
                Request.session.User = user;
                responseJson.Success = true;
            }
        ).catch(
            (Error) => {
                if (Error instanceof Lib.Error) {
                    if (503 !== responseJson.Data) {
                        responseJson.Data = Response.__(Error.message);
                    }
                    Logger.info(Error);
                } else {
                    Logger.error(Error);
                }
            }
        ).finally(
            () => {
                return Response.json(responseJson);
            }
        );
    }
);

module.exports = TwoFactroRoutes;
