'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment    = require('moment');

const CalendarSchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    start: {
        type: Date,
        required: false
    },
    title: {
        type: String,
        required: false,
    },
    Date: {
        type: Date,
        required: false,
        default: Date.now
    }
},
{ collection: 'Calendar' });

CalendarSchema.index({ CompanyID: 1 });

CalendarSchema.statics.GetCalendarEvents = function(CompanyID) {
    return this.aggregate([
        {
            $match: {
                CompanyID: CompanyID
            }
        },
        { $limit: 500 },
        {
            $project: {
                _id: 1,
                title: 1,
                start: 1
            }
        }
    ]).exec();
};

CalendarSchema.statics.RemoveEvent = function(CompanyID, EventID) {
    return CalendarModel.findOneAndRemove(
        {
            CompanyID: CompanyID,
            _id: EventID
        }
    ).exec();
};

CalendarSchema.statics.UpdateEvent = function(CompanyID, CalendarEvent) {
    return CalendarModel.findOneAndUpdate(
        {
            CompanyID: CompanyID,
            _id: CalendarEvent._id
        },
        {
            $set: {
                title: CalendarEvent.title,
                start: CalendarEvent.start
            }
        }
    ).exec();
};

CalendarSchema.statics.GetUpcomingCompanysAgenda = function(CompanyID) {
    return CalendarModel.find(
        {
            CompanyID: CompanyID,
            start: {
                $gt: moment.utc().toDate(),
                $lt: moment.utc().endOf('day').toDate()
            }
        }
    ).sort({ Date: 1 }).lean().exec();
};

CalendarSchema.statics.AddEvent = function(CompanyID, CalendarEvent) {
    let newCalEvent = new CalendarModel({
        CompanyID: CompanyID,
        start: CalendarEvent.start,
        title: CalendarEvent.title
    });

    return newCalEvent.save();
};

const CalendarModel = exports.CalendarModel = mongoose.model('Calendar', CalendarSchema);