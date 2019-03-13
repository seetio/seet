exports.IsCharactersInit = function (input) {
    if ('string' !== typeof input || 2 > input.trim().length) {
        return false;
    }

    return true;
}