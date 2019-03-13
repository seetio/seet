const CalendarRoutes    = require('express').Router();
const Calendar          = require('./../models/calendar');
const Lib               = require('./../lib');
const Logger            = require('./../lib/logger');

CalendarRoutes.get(
    '/',
    GetCalendar
);

CalendarRoutes.use(Lib.Utils.HasEditPermission('Calendar'));

CalendarRoutes.post(
    '/add-event',
    AddEvent
);

CalendarRoutes.post(
    '/edit-event',
    EditEvent
);

CalendarRoutes.post(
    '/remove-event',
    RemoveEvent
);

function GetCalendar (Request, Response) {
    let companyId = Lib.Utils.ObjectId(Request.session.User.CompanyID);
    let calendarEvents = [];

    return Calendar.CalendarModel.GetCalendarEvents(companyId).then(
        (EventsResult) => {
            calendarEvents = Lib.Utils.EscapeScriptTags(EventsResult);
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/calendar', { calendarEvents: calendarEvents });
        }
    )
}

function AddEvent (Request, Response) {
    let companyId = Request.session.User.CompanyID;
    let responseJson = {
        Success: false,
        Data: null
    };

    return Calendar.CalendarModel.AddEvent(companyId, Request.body).then(
        (InsertedEvent) => {
            responseJson.Success = true;
            responseJson.Data = InsertedEvent._id
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

function EditEvent (Request, Response) {
    let companyId = Request.session.User.CompanyID;
    let responseJson = {
        Success: false
    };

    return Calendar.CalendarModel.UpdateEvent(companyId, Request.body).then(
        (InsertedEvent) => {
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

function RemoveEvent (Request, Response) {
    let companyId = Request.session.User.CompanyID;
    let responseJson = {
        Success: false
    };

    return Calendar.CalendarModel.RemoveEvent(companyId, Request.body._id).then(
        (InsertedEvent) => {
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

module.exports = CalendarRoutes;
