const Lib   = require('./../lib');

module.exports = {
    Thumb: ParseUserThumb,
    Image: ParseImage,
    Media: ParseMedia,
    Extension: getExtension,
    Linkify: Lib.Utils.Linkify
}

function ParseUserThumb (Thumb, Endpoint, Prefix) {
    return Thumb ? 
        Endpoint + (Prefix || '') + Thumb :
        'https://static.seet.io/49c2e00452aa68891073bcfe/066a819cc86575b080d6c57309acd0c5c597539150de8ac7e01de60faf48a1cdbcbae6672b2ed3ddfb4c9fcc4a72646e74ecb7bf64eabdd2d029e03c6f3a9d9d.jpg'
}

function ParseImage (Image, Endpoint, Prefix) { 
    return Endpoint + (Prefix || '') + Image;
}

function ParseMedia (Media) {
    if (!Media || 'string' !== typeof Media) {
        return '';
    };

    Media = Media.replace(/[^a-zA-Z0-9\.\/\:\-]/g, ''); // ensure safe media
    let extension   = Media.split('.').pop();
    let videoId     = 'video_' + Lib.Utils.RandomTenDigits();
    if (/(jpg|jpeg|png|gif)$/i.test(extension)) {
        return '<img src="' + Media + '" />';
    } else {
        return '<video id="' + videoId + '" class="video-js" controls preload="auto">' +
            '<source src="' + Media + '" type="video/' + extension + '"></source>' +
        '</video>' + 
        '<script>videojs("'+ videoId +'", {fluid: true});</script>';
    }
}

function getExtension (file) {
    return 'string' === typeof file ? file.split('.').pop() : file;
}