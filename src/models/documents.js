'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const DocumentsSchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Name: {
        type: String,
        required: false
    },
    File: {
        type: String,
        required: false
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
{ collection: 'Documents' });

DocumentsSchema.index({ CompanyID: 1 });

const DocumentsModel = exports.DocumentsModel = mongoose.model('Documents', DocumentsSchema);