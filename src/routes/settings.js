const SettingsRoutes = require('express').Router();
const sharp         = require('sharp');
const Lib           = require('./../lib');
const cache         = require('./../lib/cache');
const s3            = require('./../lib/s3');
const Company       = require('./../models/company');
const UsersHelper   = require('./../route-helpers/users');
const Logger        = require('./../lib/logger');
const parseUserThumb= Lib.Utils.ParseUserThumb;

function filterObjectIds (input) {
    return /^[a-z0-9]{24}$/.test(input);
}

SettingsRoutes.use(
    (req, res, next) => {
        let IsAdmin = (Lib.Enums.UserRoles.Admin === req.session.User.Role);

        if (!IsAdmin) {
            return res.status(403).end('Not Authorized');
        }

        return next();
    }
);

SettingsRoutes.get(
    '/',
    (Request, Response) => {
        let companyId   = Request.session.User.CompanyID;
        let employees   = [];

        return UsersHelper.GetUsers({}, companyId, 999).then(
            (ResultEmployees) => {
                employees = Lib.Utils.EscapeScriptTags(
                        parseUserThumb(ResultEmployees.Users, companyId + '/')
                    );
            }
        ).catch(
            (Error) => {
                Logger.error(Error);
            }
        ).finally(
            () => {
                return Response.render('panel/settings', {employees: employees});
            }
        );

    }
);

SettingsRoutes.post(
    '/',
    (Request, Response) => {
        let companyId       = Request.session.User.CompanyID;
        let company         = {};
        let body            = Request.body;
        let responseJson    = {
            Success: false
        };

        return Company.CompanyModel.findById(companyId).then(
            (ResultCompany) => {
                company = ResultCompany;

                if (body.Teams) {
                    company.Settings.Teams.List = (body.Teams || []).filter(team => team.trim()) // remove empty teams;
                } else {
                    company.Settings.Teams.List = [];
                }

                let lang = String(body.Lang).toLowerCase();
                if (lang && Lib.Enums.AvailableLangs.hasOwnProperty(lang)) {
                    company.Settings.Lang = lang;
                }

                if ('boolean' === typeof body.TeamsEnabled) {
                    company.Settings.Teams.Enabled = body.TeamsEnabled;
                }

                if ('boolean' === typeof body.GalleryEnabled) {
                    company.Settings.Modules.Gallery.Enabled = body.GalleryEnabled;
                }

                // if ('boolean' === typeof body.FeedEnabled) {
                //     company.Settings.Modules.Feed.Enabled = body.FeedEnabled;
                // }

                if ('boolean' === typeof body.CalendarEnabled) {
                    company.Settings.Modules.Calendar.Enabled = body.CalendarEnabled;
                }

                if ('boolean' === typeof body.TreeEnabled) {
                    company.Settings.Modules.Tree.Enabled = body.TreeEnabled;
                }

                if ('boolean' === typeof body.NotesEnabled) {
                    company.Settings.Modules.Notes.Enabled = body.NotesEnabled;
                }

                if ('boolean' === typeof body.DocumentsEnabled) {
                    company.Settings.Modules.Documents.Enabled = body.DocumentsEnabled;
                }

                if ('boolean' === typeof body.ShiftsEnabled) {
                    company.Settings.Modules.Shifts.Enabled = body.ShiftsEnabled;
                }

                if (Array.isArray(body.EmployeesEditors)) {
                    company.Settings.Modules.Employees.Editors = body.EmployeesEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.GalleryEditors)) {
                    company.Settings.Modules.Gallery.Editors = body.GalleryEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.FeedEditors)) {
                    company.Settings.Modules.Feed.Editors = body.FeedEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.CalendarEditors)) {
                    company.Settings.Modules.Calendar.Editors = body.CalendarEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.TreeEditors)) {
                    company.Settings.Modules.Tree.Editors = body.TreeEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.NotesEditors)) {
                    company.Settings.Modules.Notes.Editors = body.NotesEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.DocumentsEditors)) {
                    company.Settings.Modules.Documents.Editors = body.DocumentsEditors.filter(filterObjectIds);
                }

                if (Array.isArray(body.ShiftsEditors)) {
                    company.Settings.Modules.Shifts.Editors = body.ShiftsEditors.filter(filterObjectIds);
                }

                cache.del('company_' + companyId);
                return company.save();
            }
        ).then(
            () => {
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
        );
    }
);

SettingsRoutes.post(
    '/update-logo',
    Lib.Utils.UploadFileMiddleware(),
    async (Request, Response) => {
        let responseJson = {
            Success: false,
            Data: null
        };

        try {
            const newImageName  = Lib.Utils.ObjectId().toString() + '.png';
            const companyId     = Lib.Utils.ObjectId(Request.session.User.CompanyID);
            const resizedImage  = await sharp(Request.file.buffer).resize(100, 64).max().png().toBuffer();
            const fileName      = String(companyId) + '/' + newImageName;
            await s3.UploadFile(fileName, resizedImage, 'image/png');
            await Company.CompanyModel.findByIdAndUpdate({
                _id: companyId
            }, { $set: { 'Settings.CustomLogo': newImageName } }).exec();
            await cache.del('company_' + companyId.toString());

            responseJson.Success= true;
        } catch (Error) {
            Logger.error(Error);
            responseJson.Data = Response.__(Lib.Enums.GeneralError);
        }

        return Response.json(responseJson);
    }
);

SettingsRoutes.patch(
    '/delete-logo',
    async (Request, Response) => {
        let responseJson = {
            Success: false,
            Data: null
        };

        try {
            const companyId     = Lib.Utils.ObjectId(Request.session.User.CompanyID);
            await Company.CompanyModel.findByIdAndUpdate({
                _id: companyId
            }, { $set: { 'Settings.CustomLogo': null } }).exec();
            await cache.del('company_' + companyId.toString());

            responseJson.Success= true;
        } catch (Error) {
            Logger.error(Error);
            responseJson.Data = Response.__(Lib.Enums.GeneralError);
        }

        return Response.json(responseJson);
    }
);

module.exports = SettingsRoutes;
