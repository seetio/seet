'use strict';

const Enums     = require('./../lib/enums');
const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const bcrypt    = require('bcrypt');
const moment    = require('moment');

const UserSchema = new Schema({
    Phone: {
        type: String,
        required: true,
        trim: true
    },
    Email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    TwoFactor: {
        Code: {
            type: String,
            required: false
        },
        Expires: {
            type: Date,
            required: false,
            default: Date.now
        }
    },
    Password: {
        type: String,
        required: false
    },
    FirstName: {
        type: String,
        required: false,
        trim: true
    },
    LastName: {
        type: String,
        required: false,
        trim: true
    },
    IsDeleted: {
        type: Boolean,
        default: false
    },
    Team: {
        type: String,
        required: false,
        trim: true
    },
    Thumb: {
        type: String,
        required: false
    },
    CompanyID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    CreatedCompany: {
        type: Boolean,
        default: false
    },
    Role: {
        type: String,
        required: false,
        default: Enums.UserRoles.User
    },
    CreatedDate: {
        type: Date,
        required: false,
        default: Date.now
    },
    BirthDate: {
        type: Date,
        required: false
    },
    IpAddress: {
        type: String,
        required: false
    },
    UpdatedDate: {
        type: Date,
        required: false
    },
    NotificationSubscriptions: [{
        endpoint: String,
        keys: {
            auth: String,
            p256dh: String
        },
        Date: {
            type: Date,
            default: Date.now
        }
    }]
},
{ collection: 'Users' });

UserSchema.index({ Phone: 1, CompanyID: 1 }, { unique: true });
UserSchema.statics.GetUsers = function(Filters, From, Limit, Projection = Enums.DefaultUserModelSerialize) {
    let response = {
        Users: [],
        Pages: 1
    };

    return UserModel.find(Filters, Projection)
    .skip(From)
    .limit(Limit)
    .lean()
    .exec().then(
        (Users) => {
            response.Users = Users;

            return UserModel.count(Filters);
        }
    ).then(
        (UsersCount) => {
            response.Pages = Math.ceil((UsersCount / Limit)) || 1;

            return response;
        }
    );
};

UserSchema.statics.CreateUser = function (Phone, CompanyID, FirstName, LastName, Role = Enums.UserRoles.User, Email, CreatedCompany = false, IpAddress) {
    let newUser = new this({
        Phone           : Phone,
        Role            : Role,
        CompanyID       : CompanyID,
        FirstName       : FirstName,
        LastName        : LastName,
        Email           : Email,
        CreatedCompany  : CreatedCompany,
        IpAddress       : IpAddress
    });

    return newUser.save()   // TODO: continue from here
};

UserSchema.statics.GetUserByPhoneAndCompanyId = function (Phone, CompanyID) {
    return UserModel.findOne({
        Phone: Phone,
        CompanyID: CompanyID
    }).exec();
};

UserSchema.statics.RegisterUser = function (UserDetails) {
    let newUser = new UserModel({
        Phone: UserDetails.Email,
        Password: bcrypt.hashSync(UserDetails.Password, 10),
        FirstName: UserDetails.FirstName,
        LastName: UserDetails.LastName,
        CompanyID: UserDetails.CompanyID,
        TwoFactor: {}
    });

    return newUser.save();
};

UserSchema.statics.GetUpcomingCompanyBirthdays = function (CompanyID) {
    return UserModel.find({
        CompanyID: CompanyID,
        BirthDate: {
            $gte: moment.utc().startOf('day').toDate(),
            $lt: moment.utc().add(5, 'days').endOf('day').toDate()
        }
    }).sort({ BirthDate: 1 }).lean().exec();
};

UserSchema.statics.EditUser =  function (CompanyID, UserID, UserObject, IsAdmin) {
    let allowedEditFields = IsAdmin ? Enums.UserAllowedEditAdminFields : Enums.UserAllowedEditFields;

    return this.findOne({ _id: UserID, CompanyID: CompanyID }).then(
        (ResultUser) => {
            for (let k in UserObject) {
                if (-1 < allowedEditFields.indexOf(k)) {
                    if ('BirthDate' === UserObject[k]) {
                        UserObject[k] = moment.utc(UserObject[k]).startOf('day');
                    }

                    ResultUser[k] = UserObject[k];
                }
            }

            return ResultUser.save();
        }
    )
};

UserSchema.statics.GetUserIdsInTeam = function (TeamName) {
    return this.distinct('_id', { Team: TeamName }).exec();
};

const UserModel = exports.UserModel = mongoose.model('User', UserSchema);