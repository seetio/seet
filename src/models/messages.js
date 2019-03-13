'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const MessagesSchema = new Schema({
    ConversationID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Sender: {
        type: Schema.Types.ObjectId,
        required: true
    },
    ReadBy: {
        type: [Schema.Types.ObjectId],
        required: false
    },
    Message: {
        type: String,
        required: true,
        trim: true
    },
    Date: {
        type: Date,
        default: Date.now
    },
},
{ collection: 'Messages' });

MessagesSchema.index({ CompanyID: 1 });

MessagesSchema.statics.GetUnreadMessagesCountForConversations = function (UserID, ConversationIds) {
    return this.aggregate([
        {
            $match: {
                "ReadBy": { $ne: UserID },
                "ConversationID": { $in: ConversationIds }
            }
        },
        {
            $group: {
                _id: "$ConversationID",
                Count: { $sum: 1 }
            }
        }
    ]).then(
        (Result) => {
            let result = {};

            Result.map((r) => {
                result[r._id.toString()] = r.Count;
            });

            return result;
        }
    )
};

MessagesSchema.statics.GetUnreadMessagesForConversations = function (UserID, ConversationIds) {
    return this.aggregate([
        {
            $match: {
                "ReadBy": { $ne: UserID },
                "ConversationID": { $in: ConversationIds }
            }
        },
        {
            $group: {
                _id: "$ConversationID",
                Count: { $sum: 1 },
                Messages: {
                    $push: {
                        _id: "$_id",
                        Sender: "$Sender",
                        Message: "$Message",
                        Date: "$Date"
                    }
                }
            }
        }
    ]).then(
        (Result) => {
            let result = {};

            Result.map((r) => {
                result[r._id.toString()] = r.Messages;
            });

            return result;
        }
    )
};

MessagesSchema.statics.GetNewMessages = function (ConversationIds, LastMessageID) {
    let match = {
        ConversationID: { $in: ConversationIds },
    };

    if (LastMessageID) {
        match._id = { $gt: Lib.Utils.ObjectId(LastMessageID) };
    }

    return this.aggregate([
        {
            $match: match
        },
        {
            $sort: {
                Date: -1
            }
        },
        {
            $group: {
                _id: "$ConversationID",
                Messages: { $push: { _id: "$_id", Message: "$Message", Date: "$Date", Sender: "$Sender" } }
            }
        }
    ])
};

const MessagesModel = exports.MessagesModel = mongoose.model('Messages', MessagesSchema);