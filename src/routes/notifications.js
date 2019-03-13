const NotificationsRoutes   = require('express').Router();
const User                  = require('./../models/user');
const Logger                = require('./../lib/logger');

NotificationsRoutes.post(
    '/',
    RegisterUserSubscription
);

async function RegisterUserSubscription (Request, Response) {
    let userId  = Request.session.User._id;
    let sub     = Request.body;

    try {
        if (sub.endpoint && sub.keys && sub.keys.auth && sub.keys.p256dh) {
            let user = await User.UserModel.findById(userId);
            let subs = user.NotificationSubscriptions || [];
            let existingSub = subs.find((singleSub) => sub.endpoint === singleSub.endpoint);
            if (!existingSub) {
                user.NotificationSubscriptions.push(sub);
                await user.save();
            }
        }
    } catch (e) {
        Logger.error(e);
    }

    return Response.status(201).end();
}

module.exports = NotificationsRoutes;
