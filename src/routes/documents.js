const DocumentsRoutes   = require('express').Router();
const Promise           = require('bluebird');
const Lib               = require('./../lib');
const Documents         = require('./../models/documents');
const Logger            = require('./../lib/logger');

DocumentsRoutes.get(
    '/',
    GetDocuments
);

DocumentsRoutes.use(Lib.Utils.HasEditPermission('Documents'));

DocumentsRoutes.post(
    '/upload-file',
    Lib.Utils.UploadFileMiddleware(true),
    UploadDocumentFile
);

DocumentsRoutes.post(
    '/add',
    AddNewDocument
);

DocumentsRoutes.post(
    '/:DocumentID([a-zA-Z0-9]{24})/delete',
    DeleteDocument
);

function GetDocuments (Request, Response) {
    let companyId   = Lib.Utils.ObjectId(Request.session.User.CompanyID);
    let documents       = [];

    return Documents.DocumentsModel.find({ CompanyID: companyId }).sort({Date: -1}).lean().exec().then(
        (ResultDocuments) => {
            documents = ResultDocuments
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/documents', { documents: documents });
        }
    )
}

function UploadDocumentFile (Request, Response) {
    return Response.json({
        Success: true,
        Data: Request.file.url.split('/').pop()
    });
}

function AddNewDocument (Request, Response) {
    let title   = Request.body.Title;
    let file    = Request.body.File;

    if ('string' !== typeof title || 2 > title.trim().length) {
        return Response.status(500).end(Response.__(Lib.Errors.DocumentsErrors.ProvideTitle));
    }

    if (false === /^[a-zA-Z0-9\.]{50,300}$/.test(file)) {
        return Response.status(500).end(Response.__(Lib.Errors.DocumentsErrors.InvalidFileGiven));
    }

    let newDocument = new Documents.DocumentsModel({
        CompanyID: Request.session.User.CompanyID,
        Name: title,
        File: file,
        LastUpdater: Request.session.User._id
    });

    return newDocument.save().then(
        (CreatedDocument) => {
            return Response.render('components/document', { document: CreatedDocument.toObject() });
        }
    ).catch(
        () => {
            Logger.error(Error);

            return Response.status(500).end(Response.__(Lib.Errors.GeneralError));
        }
    );
}

function DeleteDocument (Request, Response) {
    let documntId       = Request.params.DocumentID;
    let responseJson    = {
        Success: false
    };

    return Documents.DocumentsModel.findOneAndRemove({
        _id: documntId,
        CompanyID: Request.session.User.CompanyID
    }).exec().then(
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
    );
}

module.exports = DocumentsRoutes;
