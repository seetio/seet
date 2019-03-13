const path                  = require('path');
const express               = require('express');
const auth                  = require('basic-auth');
const AppRoutes             = express.Router();
const Lib                   = require('./../lib');
const LoginRoutes           = require('./login');
const RegisterRoutes        = require('./register');
const TwoFactorRoutes       = require('./two-factor');
const HomeRoutes            = require('./homepage');
const NotificationsRoutes   = require('./notifications');
const CalendarRoutes        = require('./calendar');
const GalleryRoutes         = require('./gallery');
const NotesRoutes           = require('./notes');
const DocumentsRoutes       = require('./documents');
const TreeRoutes            = require('./tree');
const UsersRoutes           = require('./users');
const SupportRoutes         = require('./support');
const SettingsRoutes        = require('./settings');
const ChatsRoutes           = require('./chats');
const Company               = require('./../models/company');

function IsBasicAuth (req, res, next) {
    return next(); // disable basic auth
    let credentials = auth(req);

    if (!credentials || credentials.name !== 'admin' || credentials.pass !== 'secret') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected zone"');
        return res.end('Access denied');
      } else {
        next();
    }
}

function checkBasicAuth (user, pass, cb) {
    if ('admin' === user && 'secret' === pass) {
        return cb(null, true);
    }
}

async function IsAuthenticated (req, res, next) {
    if (req.session.User) {
        let companyDeletedUsers = await Company.CompanyModel.GetDeletedUsers(req.session.User.CompanyID);
        if (companyDeletedUsers.includes(req.session.User._id)) {
            delete req.session.User;
            if (-1 < req.originalUrl.indexOf('chat')) {
                return res.status(403).end('Forbidden');
            }
        } else {
            return next();
        }
    }

    return res.redirect('/login');
}

// AppRoutes.use(
//     (Request, Response, Next) => {
//         let splittedHost = Request.hostname.split('.');
//         if (3 === splittedHost.length && /[a-zA-Z]{0,255}/i.test(splittedHost[0])) {
//             Response.locals.CompanyName = splittedHost[0];
//         } else {
//             Response.locals.CompanyName = '';
//         }
//         Next();
//     }
// )

AppRoutes.use(IsBasicAuth);

AppRoutes.get('/terms',
    (Request, Response) => {
        return Response.render('terms');
    }
);

AppRoutes.get('/terms-member',
    (Request, Response) => {
        return Response.render('terms-member');
    }
);

AppRoutes.use(
    '/login',
    LoginRoutes
);

AppRoutes.use(
    '/register',
    RegisterRoutes
);

AppRoutes.use(
    '/2fa',
    TwoFactorRoutes
);

// AppRoutes.use(IsAuthenticated);
AppRoutes.use(express.static(path.join(__dirname, '../../dist')));
AppRoutes.use(Lib.Utils.ParseCompanyInfo);
AppRoutes.use(Lib.Utils.ParseUserPermissions);

AppRoutes.use(
    '/notes',
    NotificationsRoutes
);

AppRoutes.use(
    '/home',
    HomeRoutes
);

AppRoutes.use(
    '/calendar',
    CalendarRoutes
);

AppRoutes.use(
    '/employees',
    UsersRoutes
);

AppRoutes.use(
    '/tree',
    TreeRoutes
);

AppRoutes.use(
    '/gallery',
    GalleryRoutes
);

AppRoutes.use(
    '/important',
    NotesRoutes
);

AppRoutes.use(
    '/documents',
    DocumentsRoutes
);

AppRoutes.use(
    '/chat',
    ChatsRoutes
);

AppRoutes.use(
    '/support',
    SupportRoutes
);

AppRoutes.use(
    '/settings',
    SettingsRoutes
);

AppRoutes.use(
    '/logout',
    (Request, Response) => {
        if (Request.session.User) {
            delete Request.session.User;
            delete Request.session.TwoFactorPhone;

            Response.redirect('/');
        }
    }
);

AppRoutes.get(
    '/',
    (Request, Response) => {
        Response.render('panel/index');
    }
);

module.exports = AppRoutes;
