const Promise       = require('bluebird');
const assert        = require('assert');
const Lib           = require('./../lib');
const Conversation  = require('./../models/conversations');
const Messages      = require('./../models/messages');
const User          = require('./../models/user');
const Company       = require('./../models/company');
const Logger        = require('./../lib/logger');
const parseUserThumb= Lib.Utils.ParseUserThumb;

exports.GetConversations = async function (CompanyID, UserID) {
    let conversations   = [];
    let users           = [];

    try {
        let deletedUsers        = Lib.Utils.ParseArrayToObjectIds(await Company.CompanyModel.GetDeletedUsers(CompanyID));
        conversations           = await Conversation.ConversationsModel.getConversations(CompanyID, UserID, deletedUsers);
        let existingUsers       = new Set();
        let tmpConversationIds  = [];

        conversations.map((conversation) => {
            tmpConversationIds.push(conversation._id);
            conversation.Participants.map(
                (u) => {
                    existingUsers.add(u._id);
                    return parseUserThumb(u, CompanyID + '/');
                }
            );
        });

        let unreadCounts = await Messages.MessagesModel.GetUnreadMessagesCountForConversations(UserID, tmpConversationIds);

        conversations = conversations.map(
            (c) => {
                c.Unread = unreadCounts.hasOwnProperty(c._id.toString()) ? unreadCounts[c._id.toString()] : 0;

                return c;
            }
        );

        existingUsers.add(UserID);
        existingUsers = Array.from(existingUsers);

        users = (await User.UserModel.GetUsers({
            _id: { $nin: existingUsers },
            CompanyID: CompanyID,
            IsDeleted: false
        }, 0, 0, { FirstName: 1, LastName: 1, Thumb: 1  })).Users;

        const preConversations = users.sort(
            (a, b) => {
                if (a.FirstName.toLowerCase() < b.FirstName.toLowerCase()) return -1;
                if (a.FirstName.toLowerCase() > b.FirstName.toLowerCase()) return 1;
                return 0;
            }
        ).map(
            (user) => {
                return {
                    Participants: [
                        {...parseUserThumb(user, CompanyID + '/')}
                    ],
                    LastMessage: [],
                    Unread: 0
                }
            }
        );

        conversations = conversations.concat(preConversations);
    } catch (Error) {
        Logger.error(Error);
    }

    return {
        Conversations: conversations
    }
};

exports.GetConversation = async function (CompanyId, UserId, Participants, Unread) {
    let conversation = {};

    try {
        Participants.add(UserId);
        Participants = Array.from(Participants);
        let validatedUsers = await User.UserModel.find({
            _id: { $in: Participants },
            CompanyID: CompanyId
        }).lean().exec();
        assert(1 < validatedUsers.length, Lib.Errors.ChatErrors.InvalidNumberOfParticipants);
        Participants = Participants.map(p => Lib.Utils.ObjectId(p));
        conversation = await Conversation.ConversationsModel.findOne({
            CompanyID: CompanyId,
            $and: [
                { Participants: { $all: Participants } },
                { Participants: { $size: Participants.length  } }
            ]
        }).lean().exec();

        if (null === conversation) {
            conversation = (await new Conversation.ConversationsModel({
                Participants: Participants,
                CompanyID: CompanyId,
                LastMessageID: null
            }).save()).toObject();
        }

        conversation.Messages = (await Messages.MessagesModel.find({
            ConversationID: conversation._id
        }, {Sender: 1, Message: 1, Date: 1}).sort({Date: -1}).limit(20).lean().exec()).reverse();

        if (0 < Unread) {
            Messages.MessagesModel.updateMany({
               ConversationID: conversation._id
            }, {
                $addToSet: {
                    ReadBy: Lib.Utils.ObjectId(UserId)
                }
            }).exec();
        }

    } catch (e) {
        Logger.error(e);

        conversation = {};
    }

    return conversation;
};

exports.GetConversationMessages = async function (CompanyID, UserID, ConversationID, MessageID, Old) {
    let messages = [];

    try {
        let conversation        = await Conversation.ConversationsModel.findOne({
            _id: ConversationID,
            CompanyID: CompanyID,
            Participants: UserID
        }).lean().exec();

        let messagesQuery = {
            ConversationID: conversation._id
        };

        if (MessageID) {
            if (Old) {
                messagesQuery._id = { $lt: Lib.Utils.ObjectId(MessageID) };
            } else {
                messagesQuery._id = { $gt: Lib.Utils.ObjectId(MessageID) };
            }
        }

        messages = await Messages.MessagesModel.find(messagesQuery).limit(10).lean().exec();

        if (messages && messages.length && !Old) {
            Messages.MessagesModel.updateMany({
                ConversationID: conversation._id
            }, {
                $addToSet: {
                    ReadBy: Lib.Utils.ObjectId(UserID)
                }
            }).exec();
        }

    } catch (Error) {
        Logger.error(Error);
    }

    return messages;
};

exports.AddMessageToConversation = async function (ConversationID, CompanyID, UserID, Message) {
    try {
        const conversation = await Conversation.ConversationsModel.findOne({
            _id: ConversationID,
            CompanyID: CompanyID,
            Participants: UserID
        });

        if (null !== conversation) {
            let newMessage = {
                ConversationID: ConversationID,
                Sender: UserID,
                Message: Message,
                ReadBy: [Lib.Utils.ObjectId(UserID)]
            };

            let savedMessage = await new Messages.MessagesModel(newMessage).save();
            conversation.LastMessageID = savedMessage._id;
            await conversation.save();
            return (savedMessage).toObject();
        }
    } catch (Error) {
        Logger.error(Error);

        return {};
    }
};
