'use strict';

const User      = require('./user');
const Enums     = require('./../lib/enums');
const cache     = require('./../lib/cache');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const CompanySchema = new Schema({
    CompanyName: {
        type: String,
        required: false
    },
    Hosts: [String],
    Settings: {
        Lang: {
            type: String,
            enums: Object.keys(Enums.AvailableLangs),
            default: Enums.AvailableLangs.en
        },
        Teams: {
            Enabled: Boolean,
            List: {
                type: [String],
                default: []
            }
        },
        Registration: {
            Enabled: {
                type: Boolean,
                default: false
            },
            Token: {
                type: String
            }
        },
        Permissions: {
            AnyOneCanPost: {
                type: Boolean,
                default: false
            }
        },
        Modules: {
            Feed: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Chat: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Gallery: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Tree: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Poll: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Employees: {
                Editors: {
                    type: [Schema.Types.ObjectId],
                    default: []
                }
            },
            EmployeeOfTheMonth: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Calendar: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Documents: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Shifts: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            },
            Notes: {
                Enabled: {
                    type: Boolean,
                    default: true
                },
                Editors: [Schema.Types.ObjectId]
            }
        },
        CustomLogo: {
            type: String,
            default: null
        }
    },
    IsDeleted: {
        type: Boolean,
        default: false
    },
    Date: {
        type: Date,
        required: false,
        default: Date.now
    }
},
{ collection: 'Company' });

CompanySchema.index({ Hosts: 1 });
CompanySchema.statics.GetCompanyByHostname = function(Hostname) {
    return this.findOne({
        Hosts: new RegExp('^'+ Hostname +'$', 'i')
    }).lean().exec();
};

CompanySchema.statics.CreateCompany = function (CompanyObject) {
    let newCompany = new CompanyModel({
        CompanyName     : CompanyObject.CompanyName,
        Hosts           : CompanyObject.Hosts,
        CountryCode     : CompanyObject.CountryCode,
        Currency        : CompanyObject.Currency,
        ExpirationDate  : CompanyObject.ExpirationDate,
        Settings: {
            Lang: CompanyObject.Lang
        }
    });

    return newCompany.save();
};

CompanySchema.statics.UpdateCompanyDeletedUsers = async function (CompanyID) {
    try {
        let deletedUsers = JSON.stringify(await User.UserModel.distinct('_id', { CompanyID: CompanyID, IsDeleted: true }).lean().exec());
        await cache.set('company_deleted_users_' + CompanyID.toString(), deletedUsers);

        return JSON.parse(deletedUsers);
    } catch (Error) {
        console.log(Error.stack);

        return [];
    }
};

CompanySchema.statics.GetDeletedUsers = async function (CompanyID) {
    try {
        let existingDeleted = await cache.getAsync('company_deleted_users_' + CompanyID.toString());
        if (!existingDeleted) {
            return await this.UpdateCompanyDeletedUsers(CompanyID);
        }

        return JSON.parse(existingDeleted);
    } catch (Error) {
        console.log(Error.stack);

        return [];
    }
};

// TODO: When creating new company, make sure to initiate default values

const CompanyModel = exports.CompanyModel = mongoose.model('Company', CompanySchema);
