const Promise   = require('bluebird');
const sharp     = require('sharp');
const User      = require('./../models/user');
const Company   = require('./../models/company');
const Lib       = require('./../lib');
const s3        = require('./../lib/s3');

exports.GetUsers = (QueryParams, CompanyID, PerPage = 10, IncludeDeleted) => {
    let page = 0;

    let query = {
        CompanyID: Lib.Utils.ObjectId(CompanyID),
        IsDeleted: false
    };

    if (true === IncludeDeleted) {
        delete query.IsDeleted;
    }

    if (QueryParams.SearchTerm) {
        let safeRegex = Lib.Utils.EscapeRegex(QueryParams.SearchTerm);
        safeRegex = safeRegex.replace(/\s/, '|');
        query.$or = [
            { FirstName: new RegExp(safeRegex, 'ig') },
            { LastName: new RegExp(safeRegex, 'ig') }
        ]
    }

    if (QueryParams.Page && 0 < parseInt(QueryParams.Page)) {
        page = QueryParams.Page - 1
    }

    return User.UserModel.GetUsers(query, page*PerPage, PerPage);
};

exports.GetCompanyUserById = function (CompanyID, UserID) {
    return User.UserModel.findOne({ _id: UserID, CompanyID: CompanyID }).lean().exec();
};

exports.GetUserByIdAndCompany = function (UserID, CompanyID) {
    return User.UserModel.findOne({ _id: UserID, CompanyID: CompanyID, IsDeleted: false }).lean().exec();
};

exports.EditUser = function (CompanyID, UserID, Query, IsAdmin) {
    return User.UserModel.EditUser(CompanyID, UserID, Query, IsAdmin);
};

exports.CreateUser = function (Phone, CompanyID, FirstName, LastName) {
    let result = {};

    if (false === /\+[0-9]{5,30}/.test(Phone)) {
        return Promise.reject(new Lib.Error(Lib.Errors.ResponseErrors.PhoneIsNotValid))
    }
    
    if (1 > FirstName.trim().length) {
        return Promise.reject(new Lib.Error(Lib.Errors.ResponseErrors.FirstNameIsNotValid))
    }

    return User.UserModel.GetUserByPhoneAndCompanyId(Phone, CompanyID).then(
        (ExistingUser) => {
            if (ExistingUser && true !== ExistingUser.IsDeleted) {
                throw new Lib.Error(Lib.Errors.ResponseErrors.UserAlreadyExists);
            }

            if (ExistingUser && true === ExistingUser.IsDeleted) {
                ExistingUser.IsDeleted = false;
                ExistingUser.FirstName = FirstName;
                ExistingUser.LastName = LastName;

                return ExistingUser.save();
            }

            return User.UserModel.CreateUser(Phone, CompanyID, FirstName, LastName);
        }
    ).then(
        (SavedUser) => {
            result = SavedUser;

            return Company.CompanyModel.UpdateCompanyDeletedUsers(CompanyID);
        }
    ).then(
        () => {
            return result;
        }
    )
};

exports.DeleteUser = function (CompanyID, UserID) {
    let deletedUser = {};

    return User.UserModel.findOneAndUpdate({
        _id: UserID,
        CompanyID: CompanyID
    },{
        $set: { IsDeleted: true }
    }).exec().then(
        (DeletedUser) => {
            deletedUser = DeletedUser;

            return Company.CompanyModel.UpdateCompanyDeletedUsers(CompanyID);
        }
    ).then(
        () => {
            return deletedUser;
        }
    )
};

exports.UpdateUserImage = (UserID, CompanyID, File) => {
    let resultUrl = null;

    return new Promise((Resolve, Reject) => {
        return sharp(File.buffer).resize(160, 160).toBuffer()
        .then(
            (ResizedImage) => {
                return Resolve(s3.UploadFile(String(CompanyID) + '/' + File.name, ResizedImage, File.type));
            }
        ).catch(Reject)
    }).then(
        (ImageURL) => {
            resultUrl = ImageURL;

            return User.UserModel.findById(UserID).exec();
        }
    ).then(
        (ResultUser) => {
            if (null === ResultUser) {
                throw new Error();
            }

            ResultUser.Thumb = File.name;

            return ResultUser.save();
        }
    ).then(
        (SavedUser) => {
            return {
                User: SavedUser,
                URL: resultUrl
            };
        }
    )
}