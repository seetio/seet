module.exports = {
    Enums: require('./enums'),
    Utils: require('./utils'),
    Errors: require('./errors'),
    Error: require('./custom-error'),
    Validators: require('./validators')
};

module.exports.DefaultUserModelSerialize = {
    Email: 1
};