const NotesRoutes   = require('express').Router();
const Lib           = require('./../lib');
const Notes         = require('./../models/notes');
const Promise       = require('bluebird');
const Logger        = require('./../lib/logger');

NotesRoutes.get(
    '/',
    GetNotes
);

NotesRoutes.post(
    '/add',
    AddNote
);

NotesRoutes.post(
    '/:NoteID([a-zA-Z0-9]{24})/edit',
    EditNote
);

NotesRoutes.post(
    '/:NoteID([a-zA-Z0-9]{24})/delete',
    DeleteNote
);

function GetNotes (Request, Response) {
    let companyId   = Lib.Utils.ObjectId(Request.session.User.CompanyID);
    let notes       = [];

    return Notes.NotesModel.find({ CompanyID: companyId }).then(
        (ResultNotes) => {
            notes = ResultNotes
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/notes', { notes: notes });
        }
    )
}

function AddNote (Request, Response) {
    let companyId   = Request.session.User.CompanyID;
    let userId      = Request.session.User._id;
    let notes       = [];

    let title       = Request.body.Title;
    let note        = Request.body.Note;

    if ('string' !== typeof title || 2 > title.length || 'string' !== typeof note || 2 > note.length) {
        return Response.end(500);
    }

    let newNote = new Notes.NotesModel({
        Title: title,
        Note: note,
        CompanyID: Lib.Utils.ObjectId(companyId),
        LastUpdater: Lib.Utils.ObjectId(userId)
    });

    return newNote.save().then(
        (CreatedNote) => {
            return Response.render('components/note', { note: CreatedNote.toObject() });
        }
    ).catch(
        (Error) => {
            Logger.error(Error);

            return Response.end(500);
        }
    )
}

function EditNote (Request, Response) {
    let companyId   = Request.session.User.CompanyID;
    let userId      = Request.session.User._id;
    let noteId      = Request.params.NoteID;

    let title       = Request.body.Title;
    let note        = Request.body.Note;

    if ('string' !== typeof title || 2 > title.length || 'string' !== typeof note || 2 > note.length) {
        return Response.end(500);
    }

    return Notes.NotesModel.findOne({
        _id: noteId,
        CompanyID: companyId
    }).then(
        (ResultNote) => {
            if (null === ResultNote) {
                throw new Lib.Error(Lib.Errors.GeneralError);
            }

            ResultNote.Title        = title.trim();
            ResultNote.Note         = note.trim();
            ResultNote.LastUpdater  = Lib.Utils.ObjectId(userId);

            return ResultNote.save();
        }
    ).then(
        (SavedNote) => {
            return Response.render('components/note', { note: SavedNote.toObject() });
        }
    ).catch(
        (Error) => {
            Logger.error(Error);

            return Response.end(500);
        }
    )
}

function DeleteNote (Request, Response) {
    let companyId   = Request.session.User.CompanyID;
    let noteId      = Request.params.NoteID;
    let responseJson= {
        Success: false
    };

    return Notes.NotesModel.findOneAndRemove({
        _id: noteId,
        CompanyID: companyId
    }).then(
        () => {
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

module.exports = NotesRoutes;
