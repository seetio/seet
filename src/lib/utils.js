const path      = require('path');
const fs        = require('fs');
const sm        = require('sitemap');
const mongoose  = require('mongoose');
const Promise   = require('bluebird');
const multiparty= require('multiparty');
const crypto    = require('crypto');
const cache     = require('./cache');
const Company   = require('./../models/company');
const User      = require('./../models/user');
const Enums     = require('./enums');
const s3        = require('./s3');

const objectId  = exports.ObjectId = mongoose.Types.ObjectId;

exports.IsValidObjectId = (ObjectId) => {
    return objectId.isValid(ObjectId);
};

exports.IsStrongPassword = (Password) => {
    if ('string' !== typeof Password) return false;

    if (6 > Password.replace(/\r|\n/g, '').length) {
        return false;
    }

    return true;
};

exports.EscapeScriptTags = (Unescaped) => {
    if ('object' === typeof Unescaped) {
        return JSON.parse(
            JSON.stringify(Unescaped).replace(/\<script\>?/gi, "").replace(/\<\/script\>?/gi, "")
        );

    } else if ('string' === typeof Unescaped) {
        return Unescaped.replace(/\<script\>?/gi, "").replace(/\<\/script\>?/gi, "");
    }

    return Unescaped;
};

exports.RandomSixDigits = function () {
    return Math.floor(Math.random() * 900000) + 100000;
};

exports.RandomTenDigits = function () {
    return Math.floor(Math.random() * 9000000000) + 1000000000;
};

exports.ParseUnauthorizedCompanyInfo = async (req, res, next) => {
    let companyResult = await Company.CompanyModel.GetCompanyByHostname(req.hostname);
    if (null === companyResult) {
        return res.status(404).end('not found');
        return res.redirect('/404');
    }

    let locale              = companyResult.Settings.Lang || Enums.AvailableLangs.en;
    res.setLocale(locale);
    res.locals.company      = companyResult;
    res.locals.countryCode  = companyResult.CountryCode || 'us';
    res.locals.IsRtl        = (-1 < [Enums.AvailableLangs.he].indexOf(locale));

    return next();
};

exports.ParseCompanyInfo = async (req, res, next) => {
    req.session.User = await User.UserModel.findOne().lean().exec();

    cache.getAsync('company_' + req.session.User.CompanyID).then(
        (companyFromCache) => {
            return (companyFromCache ? Promise.resolve(JSON.parse(companyFromCache)) : updateCompanyCache()).then(
                (ResultCompany) => {
                    res.locals.Company      = ResultCompany;
                    let lang                = ResultCompany.Settings.Lang || Enums.AvailableLangs.en;
                    res.locals.locale       = lang;
                    res.locals.countryCode  = ResultCompany.CountryCode || 'us';
                    res.locals.IsRtl        = (-1 < [Enums.AvailableLangs.he].indexOf(lang));
                    res.locals.s3           = s3.endpoint;
                    res.locals.url          = (req.protocol + '://' + req.get('Host') + req.url);
                    res.setLocale(lang);

                    next();
                }
            );
        }
    );

    function updateCompanyCache () {
        return Company.CompanyModel.findById(req.session.User.CompanyID).lean().exec().then(
            (ResultCompany) => {
                cache.set('company_' + req.session.User.CompanyID, JSON.stringify(ResultCompany));
                // cache.del('company_' + req.session.User.CompanyID);

                return ResultCompany;
            }
        )
    }
};

exports.ParseUserPermissions = (req, res, next) => {
    let user                    = req.session.User;
    let company                 = res.locals.Company;

    let IsAdmin                 = res.locals.IsAdmin = (Enums.UserRoles.Admin === user.Role);
    res.locals.User             = req.session.User;
    res.locals.CanEditFeed      = (IsAdmin || -1 < company.Settings.Modules.Feed.Editors.indexOf(user._id));
    res.locals.CanEditGallery   = (IsAdmin || -1 < company.Settings.Modules.Gallery.Editors.indexOf(user._id));
    res.locals.CanEditCalendar  = (IsAdmin || -1 < company.Settings.Modules.Calendar.Editors.indexOf(user._id));
    res.locals.CanEditUsers     = (IsAdmin || -1 < company.Settings.Modules.Employees.Editors.indexOf(user._id));
    res.locals.CanEditTree      = (IsAdmin || -1 < company.Settings.Modules.Tree.Editors.indexOf(user._id));
    res.locals.CanEditPoll      = (IsAdmin || -1 < company.Settings.Modules.Poll.Editors.indexOf(user._id));
    res.locals.CanEditNotes     = (IsAdmin || -1 < company.Settings.Modules.Notes.Editors.indexOf(user._id));
    res.locals.CanEditDocuments = (IsAdmin || -1 < company.Settings.Modules.Documents.Editors.indexOf(user._id));
    res.locals.CanEditShifts    = (IsAdmin || -1 < company.Settings.Modules.Shifts.Editors.indexOf(user._id));

    next();
};

exports.UploadFileMiddleware = (ForceUploadAsFile, SaveFile) => {
    return (req, res, next) => {
        let gotFile     = false; // flag to make sure upload only 1 file per request
        let form        = new multiparty.Form();
        let chunks      = [];
        let file        = {};

        form.on('part', (part) => {
            if (true === gotFile || part.filename === null) return part.resume(); // continue if its not a file
            let token = crypto.randomBytes(64).toString('hex');

            let fileExtention   = path.extname(String(part.filename).toLocaleLowerCase());
            file.name           = token + fileExtention;
            file.size           = part.byteCount;
            file.type           = part.headers['content-type'];

            if (true === SaveFile && (ForceUploadAsFile || /(mp4|webm|avi|mpeg)$/i.test(fileExtention))) {
                part.on('data', (data) => {
                    chunks.push(data);
                });

                part.on('end', () => {
                    let buffer = Buffer.concat(chunks);

                    s3.UploadFile(req.session.User.CompanyID + '/' + file.name, buffer, file.type).then(
                        (FileURL) => {
                            file.url = FileURL;
                            req.file = file;
                            fs.writeFileSync(path.join(__dirname, './../../tmp_files/', file.name), buffer);
                            next();
                        }
                    ).catch(
                        (err) => {
                            res.json({
                                Success: false
                            })
                        }
                    )
                });
            } else if (true === ForceUploadAsFile || /(mp4|webm|avi|mpeg)$/i.test(fileExtention)) {
                s3.UploadStream(req.session.User.CompanyID + '/' + file.name, part, part.filename).then(
                    (FileURL) => {
                        file.url = FileURL;
                        req.file = file;
                        next();
                    }
                ).catch(
                    (err) => {
                        res.json({
                            Success: false
                        })
                    }
                )
            } else if (/(jpg|jpeg|png|gif)$/i.test(fileExtention)) {
                part.on('data', (data) => {
                    chunks.push(data);
                });

                part.on('end', () => {
                    file.buffer = Buffer.concat(chunks);
                    req.file = file;
                    next();
                });
            } else {
                res.json({ // file not supported
                    Success: false
                });
                part.resume();
            }
        });

        form.on('error', (ee) => {
            return res.json({
                Success: false
            })
        });

        form.parse(req);
    }
};

exports.HasEditPermission = (ModuleName) => {
    return (req, res, next) => {
        let user                    = req.session.User;
        let company                 = res.locals.Company;

        let IsAdmin                 = (Enums.UserRoles.Admin === user.Role);

        if (IsAdmin || -1 < company.Settings.Modules[ModuleName].Editors.indexOf(user._id)) {
            return next();
        } else if ('Employees' === ModuleName && req.originalUrl.split('/')[2] === user._id) {
            return next();
        } else {
            return res.status(403).end('Not Authorized');
        }
    }
};

exports.EscapeRegex = (Unescaped) => {
    return Unescaped.replace(/(\.|\|\-|\_|\(\|\)|\[|\]|\\|\*|\#|\$|\^|\&|\?|\!)/g, "\\$1");
};

exports.ParseUserThumb = (UnparsedUser, Prefix) => {

    if (Array.isArray(UnparsedUser)) {
        return UnparsedUser.map(parseSingleUser);
    } else {
        return parseSingleUser(UnparsedUser);
    }

    function parseSingleUser (singleUser) {
        if ('CompanyID' === Prefix) {
            Prefix = singleUser.CompanyID + '/';
        }

        singleUser.Thumb = singleUser.Thumb ?
            s3.endpoint + (Prefix || '') + singleUser.Thumb :
            'https://static.seet.io/49c2e00452aa68891073bcfe/066a819cc86575b080d6c57309acd0c5c597539150de8ac7e01de60faf48a1cdbcbae6672b2ed3ddfb4c9fcc4a72646e74ecb7bf64eabdd2d029e03c6f3a9d9d.jpg'

        return singleUser;
    }
};

exports.Linkify = function (input) {
        let urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
        let pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        let emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

        return input
            .replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
            .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
            .replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
};

exports.Sitemap = function () {
    return sm.createSitemap ({
        hostname: process.env.SITE_URL,
        cacheTime: 600000,  // 600 sec cache period
        urls: [
            { url: '/',  changefreq: 'weekly', priority: 1 },
            // { url: '/page-2/',  changefreq: 'monthly',  priority: 0.7 },
            // { url: '/page-3/' } // changefreq: 'weekly',  priority: 0.5
        ]
    })
};

exports.ParseArrayToObjectIds = function (arr) {
    if (!Array.isArray(arr)) {
        return;
    }

    return arr.map(uid => objectId(uid));
};
