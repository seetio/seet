'use strict';

const Lib       = require('./../lib');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const TreeSchema = new Schema({
    CompanyID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Data: {
        type: String,
        required: false
    },
    UpdateDate: {
        type: Date,
        required: false,
        default: Date.now
    },
    LastUpdater: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Date: {
        type: Date,
        required: false,
        default: Date.now
    }
},
{ collection: 'Tree' })

TreeSchema.index({ CompanyID: 1}, { unique: true });

TreeSchema.statics.GetTree = function(CompanyID) {
    return this.findOne({ CompanyID: CompanyID }).lean().exec();
};

TreeSchema.statics.SaveTree = function(CompanyID, UserID, TreeData) {
    return this.findOneAndUpdate({ CompanyID: CompanyID },
    {
        $set: {
            CompanyID: CompanyID,
            LastUpdater: UserID,
            Data: TreeData,
            UpdateDate: new Date()
        }
    }, { upsert: true }).exec();
};

const TreeModel = exports.TreeModel = mongoose.model('Tree', TreeSchema);