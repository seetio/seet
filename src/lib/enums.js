'use strict';

exports.AvailableLangs = {
    en: 'en',
    he: 'he'
};

exports.UserRoles = {
    Admin   : 'Admin',
    Author  : 'Author',
    User    : 'User'
};

exports.UserAllowedEditFields = ['FirstName', 'Email', 'LastName', 'BirthDate', 'Team'];
exports.UserAllowedEditAdminFields = ['Phone', 'FirstName', 'LastName', 'Email', 'BirthDate', 'Team', 'Role'];

exports.DefaultUserModelSerialize = {
    Email: 1,
    FirstName: 1,
    LastName: 1,
    Thumb: 1,
    Team: 1
};

exports.YourSMSCodeIs = 'Your authentication code for login is ';
