'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const GallerySchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Title: {
        type: String,
        required: false
    },
    Images: [String],
    Date: {
        type: Date,
        required: false,
        default: Date.now
    },
    LastUpdated: {
        type: Date,
        required: false,
        default: Date.now
    },
    LastUpdater: {
        type: Schema.Types.ObjectId,
        required: false
    },
},
{ collection: 'Gallery' });

GallerySchema.index({ CompanyID: 1 });
GallerySchema.statics.GetCompanyGalleries = function(CompanyID) {
    return this.aggregate([
        {
            $match: {
                CompanyID: CompanyID
            }
        },
        {
            $sort: { Date: -1 }
        },
        {
            $project: {
                Title: 1,
                Images: 1
            }
        }
    ]).exec();
};

GallerySchema.statics.CreateGallery = function(CompanyID, UserID) {
    let newGallery = new this({
        CompanyID: CompanyID,
        LastUpdater: UserID
    });

    return newGallery.save();
};

const GalleryModel = exports.GalleryModel = mongoose.model('Gallery', GallerySchema);