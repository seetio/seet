const Promise   = require('bluebird');
const Validator = require('validator');
const User      = require('./../models/user');
const Company   = require('./../models/company');
const Lib       = require('../lib');

exports.RegisterUser = function (Token, UserDetails) {
    let company = null;

    if (false === Lib.Utils.IsStrongPassword(UserDetails.Password)) {
        return Promise.reject(new Lib.Error(Lib.Errors.RegisterErrors.PasswordMustContainAtLeast6CharactersOrDigits));
    }
    
    if (false === Validator.isEmail(UserDetails.Email)) {
        return Promise.reject(new Lib.Error(Lib.Errors.RegisterErrors.EmailIsInvalid));
    }

    UserDetails.CompanyID = Lib.Utils.ObjectId('59c2e00452aa68891073bcfe');

    return Company.CompanyModel.findById(UserDetails.CompanyID).then(
        (ResultCompany) => {
            if (null === ResultCompany) {
                throw new Lib.Error(Lib.Errors.RegisterErrors.CantRegisterAtTheMoment); // stash info about missing companies
            }
            company = ResultCompany;

            if (true !== company.Settings.Registration.Enabled || !company.Settings.Registration.Token ||
                (Token !== company.Settings.Registration.Token)) {
                    throw new Lib.Error(Lib.Errors.RegisterErrors.CantRegisterAtTheMoment);
            }


            return User.UserModel.RegisterUser(UserDetails).catch(
                () => {
                    throw new Lib.Error(Lib.Errors.RegisterErrors.UserAlreadyExists);
                }
            )
        }
    )

}