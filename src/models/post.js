'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const PostSchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    UserID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Content: {
        type: String,
        required: false
    },
    Media: {
        type: String,
        required: false
    },
    Comments: [{
        UserID: Schema.Types.ObjectId,
        Date: Date,
        Media: String,
        Comment: String
    }],
    Likes: [Schema.Types.ObjectId],
    Date: {
        type: Date,
        required: false,
        default: Date.now
    }
},
{ collection: 'Post' })

PostSchema.index({ CompanyID: 1, UserID: 1 });

PostSchema.statics.CreatePost = function(CompanyID, UserID) {
    let newPost = new this({
        CompanyID: CompanyID,
        LastUpdater: UserID
    });

    return newPost.save();
};

PostSchema.statics.GetPosts = function (CompanyID, LastObjectID, Limit = 15, CustomMatch = {}, DeletedUsers = []) {
    let match = {
        CompanyID: CompanyID,
        UserID: { $nin: DeletedUsers }
    };

    if (LastObjectID) {
        match._id = { $lt: Lib.Utils.ObjectId(LastObjectID) };
    }

    if (CustomMatch) {
        match = Object.assign({}, match, CustomMatch);
    }

    return PostModel.aggregate([
        {
            $match: match
        },
        { $sort: { Date: -1 } },
        { $limit: Limit },
        {
            $unwind: {
                "path": "$Comments",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                localField: 'UserID',
                foreignField: '_id',
                from: 'Users',
                as: 'User'
            }
        },
        {
            $lookup: {
                localField: 'Comments.UserID',
                foreignField: '_id',
                from: 'Users',
                as: 'Comments.User'
            }
        },
        { $sort: { 'Comments.Date': -1 } },
        {
            $group: {
                _id: '$_id',
                Content: { $first: "$Content" },
                Media: { $first: "$Media" },
                Date: { $first: "$Date" },
                User: { $first: "$User" },
                Likes: { $first: "$Likes" },
                Comments: { $push: "$Comments" }
            }
        },
        { $sort: { Date: -1 } },
        {
            $project: {
                _id: 1,
                Content: 1,
                Media: 1,
                Date: 1,
                'User._id': 1,
                'User.FirstName': 1,
                'User.LastName': 1,
                'User.Thumb': 1,
                Likes: 1,
                Comments: {
                    $filter: {
                        input: "$Comments",
                        as: "comment",
                        cond: {
                            $and: [
                                { $ifNull: [ '$$comment.Comment', false ] },
                                { $eq: [-1, { $indexOfArray: [ DeletedUsers, '$$comment.UserID' ] }]}
                            ]
                        },
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                Content: 1,
                Media: 1,
                Date: 1,
                User: 1,
                Likes: 1,
                'Comments._id': 1,
                'Comments.Comment': 1,
                'Comments.Date': 1,
                'Comments.User.FirstName': 1,
                'Comments.User.LastName': 1,
                'Comments.User._id': 1,
                'Comments.User.Thumb': 1
            }
        }
    ]).exec();
};


/*
    Removing comments

    db.getCollection('Post').updateMany({
        'Comments.UserID': ObjectId("59c4d7ebba0f6086881be5a5")
    },
    {
        $pull: { 'Comments': { 'UserID': ObjectId("59c4d7ebba0f6086881be5a5") } }
    })
*/
const PostModel = exports.PostModel = mongoose.model('Post', PostSchema);