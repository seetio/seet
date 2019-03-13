exports.RegisterErrors = {
    EmailIsInvalid                                  : 'EmailIsInvalid',
    PasswordMustContainAtLeast6CharactersOrDigits   : 'Password must contain at least 6 characters or digits',
    CantRegisterAtTheMoment                         : 'Cant register at the moment',
    UserAlreadyExists                               : 'User already exists'
};

exports.LoginErrors = {
    WrongUsernameOrPassword                         : 'WrongUsernameOrPassword',
    UserNotExists                                   : 'User not exists',
    SessionTimeout                                  : 'Session timed out',
    CodeTimeout                                     : 'Code has timed out',
    WrongCode                                       : 'Wrong code entered'
};

exports.ResponseErrors = {
    PleaseVerifyAllFields                           : 'Please verify all fields',
    UserAlreadyExists                               : 'User already exists',
    PhoneIsNotValid                                 : 'Phone is not valid',
    FirstNameIsNotValid                             : 'First name is not valid'
};

exports.PostingErrors = {
    MissingContent                                  : 'Missing Content'
};

exports.DocumentsErrors = {
    ProvideTitle                                    : 'Please provide docuemnt title',
    InvalidFileGiven                                : 'The file uploaded is invalid or missing'
};

exports.CreateCompanyErrors = {
    FirstNameNotValid                               : 'First name not valid',
    LastNameNotValid                                : 'Last name not valid',
    EmailNotValid                                   : 'Email not valid',
    PhoneNotValid                                   : 'Phone not valid',
    CompanyURLNotValid                              : 'Company url is not valid',
    CompanyURLNotAvailable                          : 'Company url not available'
};

exports.ChatErrors = {
    InvalidNumberOfParticipants                     : 'InvalidNumberOfParticipants'
};

exports.EditUserErrors = {
    CantRemoveYourSelf                              : 'Cant remove yourself'
};

exports.GeneralError                                = 'We experienced an error. please try again soon'