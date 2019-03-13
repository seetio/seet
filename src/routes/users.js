const QueryString       = require('querystring');
const Promise           = require('bluebird');
const UsersRoutes       = require('express').Router();
const UsersHelper       = require('./../route-helpers/users');
const Lib               = require('./../lib');
const Logger            = require('./../lib/logger');

UsersRoutes.get(
    '/',
    GetUsers
);

UsersRoutes.get(
    '/:UserID([a-zA-Z0-9]{24})',
    GetUser
);

UsersRoutes.use(Lib.Utils.HasEditPermission('Employees'));

UsersRoutes.post(
    '/create',
    CreateUser
);

UsersRoutes.post(
    '/create-many',
    CreateUsers
);

UsersRoutes.get(
    '/:UserID([a-zA-Z0-9]{24})/edit',
    GetEditUser
);

UsersRoutes.post(
    '/:UserID([a-zA-Z0-9]{24})/edit',
    PostEditUser
);

UsersRoutes.post(
    '/:UserID([a-zA-Z0-9]{24})/delete',
    DeleteUser
);

UsersRoutes.post(
    '/:UserID([a-zA-Z0-9]{24})/update-image',
    Lib.Utils.UploadFileMiddleware(),
    UpdateUserImage
);

const parseUserThumb = Lib.Utils.ParseUserThumb;

function GetUsers (Request, Response) {
    let data        = {};
    let companyId   = Request.session.User.CompanyID;

    return UsersHelper.GetUsers(Request.query, companyId).then(
        (Data) => {
            data = Data;
            data.Users = parseUserThumb(data.Users, companyId + '/');

            if (Request.query.Page && 0 < parseInt(Request.query.Page)) {
                data.CurrentPage = parseInt(Request.query.Page);
            } else {
                data.CurrentPage = 1;
            }

            if (Request.query.SearchTerm) {
                data.SearchTerm = Request.query.SearchTerm;
            }
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            Response.render('panel/users', { Data: data });
        }
    )
}

function GetUser (Request, Response) {
    let userId      = Request.params.UserID;
    let companyId   = Request.session.User.CompanyID;
    let user        = {};

    return UsersHelper.GetUserByIdAndCompany(userId, companyId).then(
        (ResultUser) => {
            if (userId === Request.session.User._id) {
                Response.locals.IsMe = true;
            }

            user = parseUserThumb(ResultUser, 'CompanyID');

            return true;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/edit-user', { ViewMode: true, User : user });
        }
    )
}

function CreateUser (Request, Response) {
    let companyId   = Request.session.User.CompanyID;
    let phone       = Request.body.Phone;
    let firstName   = Request.body.FirstName;
    let lastName    = Request.body.LastName;
    let responseJson = {
        Success: false
    };

    return UsersHelper.CreateUser(phone, companyId, firstName, lastName).then(
        (CreatedUser) => {
            responseJson.Success = true;
        }
    ).catch(
        (Error) => {
            if (Error instanceof Lib.Error) {
                responseJson.Data = Response.__(Error.message);
            } else {
                responseJson.Data = Response.__(Lib.Errors.ResponseErrors.PleaseVerifyAllFields);
                Logger.error(Error);
            }
        }
    ).finally(
        () => {
            Response.json(responseJson);
        }
    )
}

function CreateUsers (Request, Response) {
    let companyId   = Request.session.User.CompanyID;

    let responseJson = {
        Success: false,
        Data: []
    };

    return Promise.each(Request.body, (user) => {
        return UsersHelper.CreateUser(user.Phone, companyId, user.FirstName, user.LastName).then(
            (CreatedUser) => {
                responseJson.Data.push({
                    Success: true,
                    Phone: user.Phone
                })
            }
        ).catch(() =>{
            responseJson.Data.push({
                Success: false,
                Phone: user.Phone
            })
        })
    }).then(
        () => {
            responseJson.Success = true;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            Response.json(responseJson);
        }
    )
}

function GetEditUser (Request, Response) {
    let userId      = Request.params.UserID;
    let companyId   = Request.session.User.CompanyID;
    let user        = {};

    return UsersHelper.GetCompanyUserById(companyId, userId).then(
        (ResultUser) => {
            user = parseUserThumb(ResultUser, 'CompanyID');

            if (userId === Request.session.User._id) {
                Response.locals.IsMe = true;
            }

            return true;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/edit-user', { User : user });
        }
    )
}

function PostEditUser (Request, Response) {
    let userId          = Request.params.UserID;
    let queryString     = QueryString.parse(Request.body.Query);
    let companyId       = Request.session.User.CompanyID;
    let responseJson    = {
        Success: false
    };

    return UsersHelper.EditUser(companyId, userId, queryString, Response.locals.IsAdmin).then(
        (ResultUser) => {
            if (userId === Request.session.User._id) {
                Request.session.User = ResultUser.toObject();
            }

            responseJson.Success = true;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.json(responseJson);
        }
    )
}

async function DeleteUser (Request, Response) {
    const userId          = Request.params.UserID;
    const companyId       = Request.session.User.CompanyID;
    let responseJson = {
        Success: false
    };

    try {
        if (userId === Request.session.User._id) {
            throw new Lib.Error(Lib.Errors.EditUserErrors.CantRemoveYourSelf);
        }

        await UsersHelper.DeleteUser(companyId, userId);
        responseJson.Success = true;

    } catch (Error) {
        if (Error instanceof Lib.Error) {
            responseJson.Data = Response.__(Error.message);
        } else {
            responseJson.Data = Response.__(Lib.Errors.GeneralError);
            Logger.error(Error);
        }
    }

    return Response.json(responseJson);
}

function UpdateUserImage (Request, Response) {
    let userId          = Request.params.UserID;
    let companyId       = Request.session.User.CompanyID;
    let file            = Request.file;
    let responseJson    = {
        Success: false,
        Data: null
    };

    return UsersHelper.UpdateUserImage(userId, companyId, file).then(
        (Result) => {
            let user = Result.User.toObject();
            if (userId === Request.session.User._id) {
                Request.session.User.Thumb = user.Thumb;
            }

            responseJson.Success = true;
            responseJson.Data = Result.URL;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            Response.json(responseJson);
        }
    )
}

module.exports = UsersRoutes;
