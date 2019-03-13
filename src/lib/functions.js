module.exports = {
    InArray: IsInArray,
    IsEqualStrings: IsEqualStrings,
    IsVideo: IsVideo
};

function IsInArray (val, arr) {
    arr = arr.map((a) => { return String(a); });

    return -1 < arr.indexOf(String(val));
}

function IsEqualStrings (a, b) {
    return String(a) === String(b);
}

function IsVideo (url) {
    return /(mp4|webm|avi|mpeg)$/i.test(url);
}