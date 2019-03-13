const Promise   = require('bluebird');
const Post      = require('./../models/post');
const User      = require('./../models/user');
const Company   = require('./../models/company');
const Lib       = require('./../lib');

exports.NewPost = function (CompanyID, UserID, QueryParams) {
    let postObject = {
        CompanyID   : CompanyID,
        UserID      : UserID,
        Content     : QueryParams.Content
    };

    if (!QueryParams.Content || !Lib.Validators.IsCharactersInit(QueryParams.Content)) {
        return Promise.reject(new Lib.Error(Lib.Errors.PostingErrors.MissingContent));
    }

    if ('string' === typeof QueryParams.Media && 40 < QueryParams.Media.length) {
        postObject.Media = QueryParams.Media;
    }

    let newPost = new Post.PostModel(postObject);

    return newPost.save().then(
        (CreatedPost) => {
            return CreatedPost.toObject();
        }
    );
};

exports.GetPosts = async (CompanyID, LastObjectID, Limit, CompanyTeams, UserTeam) => {
    let limit       = 15;
    let customMatch = {};

    try {
        let deletedUsers = Lib.Utils.ParseArrayToObjectIds(await Company.CompanyModel.GetDeletedUsers(CompanyID));
        if ('string' === typeof CompanyID) {
            CompanyID = Lib.Utils.ObjectId(CompanyID);
        }

        if (0 < parseInt(Limit)) {
            limit = parseInt(Limit);
        }

        let action;

        if (true === CompanyTeams.Enabled && Array.isArray(CompanyTeams.List) && -1 < CompanyTeams.List.indexOf(UserTeam)) {
            action = User.UserModel.GetUserIdsInTeam(UserTeam);
        } else {
            action = Promise.resolve();
        }

        return action.then(
            (userIds) => {
                if (true === CompanyTeams.Enabled) {
                    customMatch.UserID = { $in: userIds || [] };
                }

                return Post.PostModel.GetPosts(CompanyID, LastObjectID, limit, customMatch, deletedUsers);
            }
        );
    } catch (Error) {
        throw Error;
    }
};

exports.NewComment = (CompanyID, PostID, UserID, Comment) => {
    if ('string' !== typeof Comment || 2 > Comment.length) {
        return Promise.reject(new Lib.Error(Lib.Errors.GeneralError));
    }

    let newComment = {
        _id: Lib.Utils.ObjectId(),
        CompanyID: Lib.Utils.ObjectId(CompanyID),
        UserID: Lib.Utils.ObjectId(UserID),
        Comment: Comment,
        Date: new Date()
    };
    
    return Post.PostModel.findOneAndUpdate({
        _id: Lib.Utils.ObjectId(PostID),
        CompanyID: Lib.Utils.ObjectId(CompanyID)
    },
    {
        $addToSet: { Comments: newComment }
    }).then(
        (AffectedPost) => {
            if (null === AffectedPost) {
                throw new Lib.Error(Lib.Errors.GeneralError);
            }

            return newComment;
        }
    )
};