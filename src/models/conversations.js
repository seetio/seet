'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const ConverationsSchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Participants: {
        type: [Schema.Types.ObjectId],
        required: true
    },
    Date: {
        type: Date,
        default: Date.now
    },
    LastMessageID: {
        type: Schema.Types.ObjectId,
        required: false
    }
},
{ collection: 'Conversations' });

ConverationsSchema.index({ CompanyID: 1, Participants: 1 });

ConverationsSchema.statics.getConversations = function (CompanyID, UserID, DeletedUsers) {
    let q = [
        {
            $match: {
                CompanyID: CompanyID,
                $and: [
                    { Participants: { $eq: UserID } },
                    { Participants: { $nin: DeletedUsers } }
                ]
            }
        },
        // {
        //     $project: {
        //         Uid: {
        //             $arrayElemAt: [{, 0]
        //         },
        //         LastMessageID: 1
        //     }
        // },
        {
            $lookup: {
                from: 'Messages',
                localField: 'LastMessageID',
                foreignField: '_id',
                as: 'LastMessage'
            }
        },
        {
            $project: {
                Participants: {
                    $setDifference: ["$Participants", [UserID]]
                },
                ConversationID: 1,
                'LastMessage.Sender': 1,
                'LastMessage.Date': 1,
                'LastMessage.Message': 1,
                'LastMessage._id': 1
            }
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'Participants',
                foreignField: '_id',
                as: 'Participants'
            }
        },
        {
            $project: {
                'Participants._id'      : 1,
                'Participants.FirstName': 1,
                'Participants.LastName' : 1,
                'Participants.Thumb'    : 1,
                'LastMessage._id'       : 1,
                'LastMessage.Sender'    : 1,
                'LastMessage.Date'      : 1,
                'LastMessage.Message'   : 1
            }
        },
        {
            $sort: { 'LastMessage.Date': -1 }
        }
    ];
    return this.aggregate(q).exec();
};

ConverationsSchema.statics.GetConversationIdsOfUser = function (CompanyID, UserID) {
    return this.find({
        CompanyID: CompanyID,
        Participants: UserID
    }).lean().exec();
};

const ConversationsModel = exports.ConversationsModel = mongoose.model('Conversations', ConverationsSchema);