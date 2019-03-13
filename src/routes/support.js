const SupportRoute  = require('express').Router();
const Lib           = require('./../lib');

SupportRoute.use(
    (req, res, next) => {
        let IsAdmin = (Lib.Enums.UserRoles.Admin === req.session.User.Role);

        if (!IsAdmin) {
            return res.status(403).end('Not Authorized');
        }

        return next();
    }
);

SupportRoute.get(
    '/',
    (Request, Response) => {
        return Response.render('panel/support');
    }
);

module.exports = SupportRoute;