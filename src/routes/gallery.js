const GalleryRoutes = require('express').Router();
const fs            = require('fs');
const path          = require('path');
const ffmpeg        = require('ffmpeg');
const Lib           = require('./../lib');
const Gallery       = require('./../models/gallery');
const s3            = require('./../lib/s3');
const Logger        = require('./../lib/logger');
const Promise       = require('bluebird');
const sharp         = require('sharp');
sharp.cache(false); // without this, we can't unlink temporary created files

function selectRandonImage (ImagesArr, CompanyID) {
    if (!Array.isArray(ImagesArr) || ImagesArr.length < 1) return '/public/img/non-gallery.png';

    return s3.endpoint + String(CompanyID) + '/150' + ImagesArr[Math.floor(Math.random()*ImagesArr.length)];
}

GalleryRoutes.get(
    '/',
    ListGalleries
);

GalleryRoutes.get(
    '/:GalleryID([a-zA-Z0-9]{24})',
    ViewGallery
);

GalleryRoutes.use(Lib.Utils.HasEditPermission('Gallery'));

GalleryRoutes.get(
    '/:GalleryID([a-zA-Z0-9]{24})/edit',
    GetEditGallery
);

GalleryRoutes.post(
    '/:GalleryID([a-zA-Z0-9]{24})/edit',
    PostEditGallery
);

GalleryRoutes.post(
    '/create',
    CreateGallery
);

GalleryRoutes.post(
    '/:GalleryID([a-zA-Z0-9]{24})/add-image',
    Lib.Utils.UploadFileMiddleware(),
    AddImageToGallery
);

GalleryRoutes.post(
    '/:GalleryID([a-zA-Z0-9]{24})/add-video',
    Lib.Utils.UploadFileMiddleware(undefined, true),
    AddVideoToGallery
);

GalleryRoutes.post(
    '/:GalleryID([a-zA-Z0-9]{24})/delete-image',
    DeleteImageFromGallery
);

GalleryRoutes.post(
    '/:GalleryID([a-zA-Z0-9]{24})/delete-gallery',
    DeleteGallery
);

function ListGalleries (Request, Response) {
    let galleries   = [];
    let companyId   = Lib.Utils.ObjectId(Request.session.User.CompanyID);

    return Gallery.GalleryModel.GetCompanyGalleries(companyId).then(
        (Galleries) => {
            galleries = Galleries.map(
                (album) => {
                    album.Cover = selectRandonImage(album.Images, companyId);
                    delete album.Images;

                    return album;
                }
            );
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/galleries', { galleries: galleries });
        }
    )
}

function ViewGallery (Request, Response) {
    let gallery = {};
    let companyId   = Request.session.User.CompanyID;

    return Gallery.GalleryModel.findOne({
        _id: Request.params.GalleryID,
        CompanyID: companyId
    }).lean().exec().then(
        (ResultGallery) => {
            gallery = ResultGallery;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/view-gallery', { gallery: gallery, endpoint: s3.endpoint + companyId });
        }
    )
}

function GetEditGallery (Request, Response) {
    let gallery = {};
    let companyId   = Request.session.User.CompanyID;

    return Gallery.GalleryModel.findOne({
        _id: Request.params.GalleryID,
        CompanyID: companyId
    }).lean().exec().then(
        (Galleries) => {
            gallery = Galleries;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/edit-gallery', { gallery: gallery, endpoint: s3.endpoint + companyId });
        }
    )
}

function PostEditGallery (Request, Response) {
    let companyId   = Request.session.User.CompanyID;
    let galleryId   = Request.params.GalleryID;
    let responseJson    = {
        Success: false
    };

    return Gallery.GalleryModel.findOne({
        _id: galleryId,
        CompanyID: companyId
    }).exec().then(
        (ResultGallery) => {
            ResultGallery.Title = Request.body.Title || null;

            return ResultGallery.save();
        }
    ).then(
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

function CreateGallery (Request, Response) {
    let companyId       = Request.session.User.CompanyID;
    let userId          = Request.session.User._id
    let responseJson    = {
        Success: false,
        Data: null
    };

    return Gallery.GalleryModel.CreateGallery(companyId, userId).then(
        (CreatedGallery) => {
            responseJson.Success = true;
            responseJson.Data = CreatedGallery._id
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

function AddImageToGallery (Request, Response) {
    let companyId   = Lib.Utils.ObjectId(Request.session.User.CompanyID);
    let galleryId   = Request.params.GalleryID;
    let file        = Request.file;
    let imageURL;
    let contentType;
    let responseJson= {
        Success: false,
        Data: null
    };

    return Promise.resolve(
        sharp(file.buffer).resize(1920, 1920).max().toBuffer()
    ).then(
        (ResizedImage) => {
            if (false === /(jpg|jpeg|png|gif)/i.test(file.type)) {
                throw new Error();
            }

            return s3.UploadFile(String(companyId) + '/' + file.name, ResizedImage, file.type).then(
                () => {
                    return sharp(ResizedImage).resize(150, 150).toBuffer();
                }
            )
        }
    ).then(
        (ThumbImage) => {
            return s3.UploadFile(String(companyId) + '/150' + file.name, ThumbImage, file.type);
        }
    ).then(
        (ImageURL) => {
            imageURL = ImageURL;

            return Gallery.GalleryModel.findOneAndUpdate({
                CompanyID: companyId,
                _id: galleryId
            },
            {
                $push: {
                    Images: file.name
                }
            }).exec();
        }
    ).then(
        () => {
            responseJson.Success = true;
            responseJson.Data = imageURL;
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

async function AddVideoToGallery (Request, Response) {
    let companyId   = Lib.Utils.ObjectId(Request.session.User.CompanyID);
    let galleryId   = Request.params.GalleryID;
    let file        = Request.file;
    let imageGenName= file.name.replace(/\.[\.a-z0-9]{2,6}$/i, '_1.jpg');
    let imageName   = file.name.replace(/\.[\.a-z0-9]{2,6}$/i, '.jpg');

    try {
        let workingDir = path.join(__dirname, './../../tmp_files/');

        let process = Promise.promisifyAll(await new ffmpeg(workingDir + file.name));
        await process.fnExtractFrameToJPGAsync(workingDir, { number: 1, file_name: imageName });
        let imageBuffer = await sharp(workingDir + imageGenName).resize(150, 150).toBuffer();
        await s3.UploadFile(String(companyId) + '/150' + imageName, imageBuffer, 'image/jpeg');
        fs.unlinkSync(workingDir + file.name);
        fs.unlinkSync(workingDir + imageGenName);

        await Gallery.GalleryModel.findOneAndUpdate({
                CompanyID: companyId,
                _id: galleryId
            },
            {
                $push: {
                    Images: file.name
                }
            }).exec();
    } catch (Error) {
        Logger.error(Error);
    }

    return Response.json({
        Success: true,
        Data: file.url
    });
}

function DeleteImageFromGallery (Request, Response) {
    let companyId       = Request.session.User.CompanyID;
    let galleryId       = Request.params.GalleryID;
    let imageUrl        = Request.body.Image;
    let responseJson    = {
        Success: false
    };

    return Gallery.GalleryModel.findOneAndUpdate(
        {
            CompanyID: companyId,
            _id: galleryId
        },
        {
            $pull: {
                Images: imageUrl
            }
        }
    ).exec().then(
        (updateChanges) => {
            return s3.DeleteFiles([
                {Key: String(companyId) + '/' + imageUrl},
                {Key: String(companyId) + '/150' + imageUrl}
            ])
        }
    ).then(
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

function DeleteGallery (Request, Response) {
    let companyId       = Request.session.User.CompanyID;
    let galleryId       = Request.params.GalleryID;
    let responseJson    = {
        Success: false
    };

    return Gallery.GalleryModel.findOneAndRemove(
        {
            CompanyID: companyId,
            _id: galleryId
        }
    ).exec().then(
        (RemovedAlbum) => {
            if (null !== RemovedAlbum && RemovedAlbum.Images) {
                let imagesKeys = [];
                RemovedAlbum.Images.map((image) => {
                    imagesKeys.push({ Key: String(companyId) + '/' + image });
                    imagesKeys.push({ Key: String(companyId) + '/150' + image });
                });

                s3.DeleteFiles(imagesKeys).catch(() => {});
            }

            return true;
        }
    ).then(
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

module.exports = GalleryRoutes;
