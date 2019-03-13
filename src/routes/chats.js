const assert        = require('assert');
const ChatRoutes    = require('express').Router();
const Promise       = require('bluebird');
const Lib           = require('./../lib');
const Conversation  = require('./../models/conversations');
const Messages      = require('./../models/messages');
const User          = require('./../models/user');
const Logger        = require('./../lib/logger');
const Chats         = require('./../route-helpers/chats');

ChatRoutes.get(
    '/',
    GetChats
);

ChatRoutes.post(
    '/conversation',
    GetOrCreateConversation
);

ChatRoutes.get(
    '/fetch',
    FetchMessages
);

ChatRoutes.post(
    '/conversation/:ConversationID([a-zA-Z0-9]{24})',
    AddMessageToConversation
);

async function GetChats (Request, Response) {
    let userId          = Lib.Utils.ObjectId(Request.session.User._id);
    let companyId       = Lib.Utils.ObjectId(Request.session.User.CompanyID);

    const conversations = await Chats.GetConversations(companyId, userId);

    return Response.json(conversations);
}

async function GetOrCreateConversation (Request, Response) {
    let companyId       = Request.session.User.CompanyID;
    let userId          = Request.session.User._id;
    let unread          = Request.body.Unread;
    let participants    = new Set(Request.body.Participants.map(p => p._id));

    const conversation = await Chats.GetConversation(companyId, userId, participants, unread);

    return Response.json(conversation);


}

async function FetchMessages (Request, Response) {
    let companyId       = Lib.Utils.ObjectId(Request.session.User.CompanyID);
    let userId          = Lib.Utils.ObjectId(Request.session.User._id);
    let conversationId  = Request.query._id;
    let messageId       = Request.query.MessageID;
    let old             = Request.query.Old;

    let newMessages = await Chats.GetConversationMessages(companyId, userId, conversationId, messageId, old);

    return Response.json(newMessages);
}

async function AddMessageToConversation (Request, Response) {
    let companyId       = Request.session.User.CompanyID;
    let userId          = Request.session.User._id;
    let conversationId  = Request.params.ConversationID;
    let message         = Request.body.Message;

    const newMessage = await Chats.AddMessageToConversation(conversationId, companyId, userId, message);

    return Response.json(newMessage);
}

module.exports = ChatRoutes;
