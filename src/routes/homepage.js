const Promise       = require('bluebird');
const sharp         = require('sharp');
const HomeRoutes    = require('express').Router();
const Lib           = require('./../lib');
const s3            = require('./../lib/s3');
const Post          = require('./../models/post');
const Calendar      = require('./../models/calendar');
const User          = require('./../models/user');
const HomeHelper    = require('./../route-helpers/homepage');
const Logger        = require('./../lib/logger');

HomeRoutes.get(
    '/',
    async (Request, Response) => {
        let posts       = [];
        let agenda      = [];
        let birthdays   = [];
        let companyId   = Request.session.User.CompanyID;
        let companyTeams= Response.locals.Company.Settings.Teams;
        let userTeam    = Request.session.User.Team;

        try {
            posts       = await HomeHelper.GetPosts(companyId, null, null, companyTeams, userTeam);
            agenda      = await Calendar.CalendarModel.GetUpcomingCompanysAgenda(companyId);
            birthdays   = await User.UserModel.GetUpcomingCompanyBirthdays(companyId);
        } catch (Error) {
            Logger.error(Error);
        }

        return Response.render('panel/home', { Posts: posts, agenda: agenda, birthdays: birthdays });
    }
);

HomeRoutes.get(
    '/posts/:LastPostID([a-zA-Z0-9]{24})',
    (Request, Response) => {
        let lastPostID  = Request.params.LastPostID;
        let companyId   = Request.session.User.CompanyID;
        let companyTeams= Response.locals.Company.Settings.Teams;
        let userTeam    = Request.session.User.Team;

        return HomeHelper.GetPosts(companyId, lastPostID, null, companyTeams, userTeam).then(
            (ResultPosts) => {
                if (!ResultPosts.length) {
                    throw new Lib.Error('No posts reuslt');
                }

                return Response.render('components/posts', { Posts: ResultPosts });
            }
        ).catch(
            (Error) => {
                if (!(Error instanceof Lib.Error)) {
                    Logger.error(Error);
                }

                return Response.status(500).end();
            }
        );
    }
);

HomeRoutes.post(
    '/post',
    (Request, Response) => {
        let companyId   = Request.session.User.CompanyID;
        let userId      = Request.session.User._id;
        let responseJson = {
            Success: false,
            Data: null
        };

        return HomeHelper.NewPost(companyId, userId, Request.body).then(
            (CreatedPost) => {
                CreatedPost.User = [Request.session.User];
                return Response.render('components/post', { post: CreatedPost });
            }
        ).catch(
            (Error) => {
                Logger.error(Error);

                return Response.end(500);
            }
        );
    }
);

HomeRoutes.post(
    '/add-media',
    Lib.Utils.UploadFileMiddleware(),
    (Request, Response) => {
        let file            = Request.file;
        let companyId       = Request.session.User.CompanyID;
        let responseJson    = {
            Success: false,
            Data: null
        };

        if (file.url) { // Is an video
            return Response.json({
                Success: true,
                Data: file.url
            })
        }

        return new Promise((Resolve, Reject) => { // Is an image
            return sharp(file.buffer).resize(800, 800).max().toBuffer()
            .then(
                (ResizedImage) => {
                    return Resolve(s3.UploadFile(String(companyId) + '/' + file.name, ResizedImage, file.type));
                }
            ).catch(Reject)
        }).then(
            (ImageURL) => {
                responseJson.Success    = true;
                responseJson.Data       = ImageURL;
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
);

HomeRoutes.post(
    '/:PostID([a-zA-Z0-9]{24})/like',
    (Request, Response) => {
        let companyId       = Request.session.User.CompanyID;
        let userId          = Request.session.User._id;
        let postId          = Request.params.PostID;

        let responseJson    = {
            Success: false,
            Data: null
        };

        return Post.PostModel.findOneAndUpdate({
            _id: postId,
            CompanyID: companyId
        }, {
            $addToSet: { Likes: Lib.Utils.ObjectId(userId) }
        }).exec().then(
            (ImageURL) => {
                responseJson.Success    = true;
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
);

HomeRoutes.post(
    '/:PostID([a-zA-Z0-9]{24})/unlike',
    (Request, Response) => {
        let companyId       = Request.session.User.CompanyID;
        let userId          = Request.session.User._id;
        let postId          = Request.params.PostID;

        let responseJson    = {
            Success: false,
            Data: null
        };

        return Post.PostModel.findOneAndUpdate({
            _id: postId,
            CompanyID: companyId
        }, {
            $pull: { Likes: Lib.Utils.ObjectId(userId) }
        }).exec().then(
            () => {
                responseJson.Success    = true;
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
);

HomeRoutes.post(
    '/:PostID([a-zA-Z0-9]{24})/comment',
    (Request, Response) => {
        let companyId       = Request.session.User.CompanyID;
        let userId          = Request.session.User._id;
        let postId          = Request.params.PostID;

        let responseJson    = {
            Success: false,
            Data: null
        };

        return HomeHelper.NewComment(companyId, postId, userId, Request.body.Comment).then(
            (ResultComment) => {
                ResultComment.User = [Request.session.User];

                return Response.render('components/comment', { comment: ResultComment })
            }
        ).catch(
            (Error) => {
                Logger.error(Error);

                return Response.end(500);
            }
        )
    }
);

HomeRoutes.post(
    '/:PostID([a-zA-Z0-9]{24})/delete',
    (Request, Response) => {
        let companyId       = Request.session.User.CompanyID;
        let userId          = Request.session.User._id;
        let postId          = Request.params.PostID;
        let responseJson    = {
            Success: false,
            Data: null
        };
        let query           = {
            _id: postId,
            CompanyID: companyId
        };

        if (false === Response.locals.CanEditFeed) { // make sure its user's post if he don't editor
            query.UserID = userId;
        }

        return Post.PostModel.findOneAndRemove(query).then(
            (ResultPost) => {
                if (null !== ResultPost) {
                    responseJson.Success = true;
                }
            }
        ).catch(
            (Error) => {
                Logger.error(Error);
            }
        ).finally(
            () => {
                Response.json(responseJson);
            }
        )
    }
);

HomeRoutes.post(
    '/:PostID([a-zA-Z0-9]{24})/delete-comment',
    (Request, Response) => {
        let companyId       = Request.session.User.CompanyID;
        let commentId       = Request.body.CommentID;
        let userId          = Request.session.User._id;
        let postId          = Request.params.PostID;
        let responseJson    = {
            Success: false,
            Data: null
        };
        let matchingComment = {
            _id: Lib.Utils.ObjectId(commentId)
        };

        if (false === Response.locals.CanEditFeed) {
            matchingComment.UserID = Lib.Utils.ObjectId(userId);
        }

        return Post.PostModel.findOneAndUpdate({
            _id: postId,
            CompanyID: companyId
        },
        {
            $pull: {
                Comments: matchingComment
            }
        }).then(
            (ResultPost) => {
                if (null !== ResultPost) {
                    responseJson.Success = true;
                }
            }
        ).catch(
            (Error) => {
                Logger.error(Error);
            }
        ).finally(
            () => {
                Response.json(responseJson);
            }
        )
    }
);

HomeRoutes.post(
    '/:MessageID([a-zA-Z0-9]{24})/edit',
    async (Request, Response) => {
        let responseJson    = { Success: false };
        let userId          = Request.session.User._id;
        let companyId       = Request.session.User.CompanyID;
        let messageId       = Request.params.MessageID;
        let type            = Request.body.type;
        let content         = (Request.body.content || '').trim();

        try {
            let post = await Post.PostModel.findOne({
                CompanyID: companyId,
                $or: [
                    { _id: messageId },
                    { 'Comments._id': messageId }
                ]
            }).exec();

            if (null === post) {
                throw new Lib.Error(Lib.Errors.GeneralError);
            }

            if (!content.length) {
                throw new Lib.Error(Lib.Errors.PostingErrors.MissingContent);
            }

            if ('post' === type && post.UserID.toString() === userId) {
                post.Content = content;
            } else if ('comment' === type && post.UserID.toString() === userId) {
                let comment = post.Comments.find(c => c.id.toString() === messageId);

                comment.Comment = content;
            } else {
                throw new Lib.Error(Lib.Errors.GeneralError);
            }

            await post.save();

            responseJson.Data       = await new Promise((resolve, reject) => {
                Response.render('components/safe-text', {text: content}, (err, data) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(data);
                });
            });
            responseJson.Success    = true;

        } catch (Error) {
            if (Error instanceof Lib.Error) {
                responseJson.Data = Response.__(Error.message);
            } else {
                responseJson.Data = Response.__(Lib.Errors.GeneralError);
                Logger.error(Error);
            }
            responseJson.Success = false;
        }

        return Response.json(responseJson);
    }
);

module.exports = HomeRoutes;
