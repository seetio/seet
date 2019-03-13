'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const NotesSchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Title: {
        type: String,
        required: false
    },
    Note: {
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
{ collection: 'Notes' })

NotesSchema.index({ CompanyID: 1 });

const NotesModel = exports.NotesModel = mongoose.model('Notes', NotesSchema);