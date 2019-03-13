const RegisterRoutes    = require('express').Router();
const RegisterHelper    = require('./../route-helpers/register');
const Company           = require('./../models/company');
const Logger            = require('./../lib/logger');
const Lib               = require('./../lib');

RegisterRoutes.get(
    '/:Token',
    (Request, Response) => {
        let company = {};
        return Company.CompanyModel.GetCompanyByName(Response.locals.CompanyName).then(
            (Company) => {
                company = Company;
            }
        ).finally(
            () => {
                Response.render('panel/register', { company: company });
            }
        )
    }
);

RegisterRoutes.post(
    '/:Token',
    (Request, Response) => {
        let responseJson = {
            Success: false,
            Data: null
        };

        return RegisterHelper.RegisterUser(Request.params.Token, Request.body).then(
            (RegisteredUser) => {
                responseJson.Success = true;
                responseJson.Data = RegisteredUser;
            }
        ).catch(
            (Error) => {
                if (Error instanceof Lib.Error) {
                    responseJson.Data = Response.__(Error.message);
                } else {
                    Logger.error(Error);
                }
            }
        ).finally(
            () => {
                Response.json(responseJson);
            }
        )
    }
);

module.exports = RegisterRoutes;
