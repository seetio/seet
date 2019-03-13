var galleryImagesToUpload;
var currentUploadingProcesses;
var totalAlbumImagesToUpload;
var totalAlbumImagesUploaded;
var removingImage;

function galleryPageCallback  () {
    galleryImagesToUpload = [];
    currentUploadingProcesses = 0;
    totalAlbumImagesToUpload = 0;
    totalAlbumImagesUploaded = 0;
    removingImage = false;
    if ($('#GalleriesPage').length) {
        if (window.galleries.length) {
            drawAlbums();
        }
    }

    if ($('#EditGalleryPage').length) {
        $('#GalleryImagesUpload')[0].addEventListener('change', fileInputChanged);
    } else {
        checkEmptyGalleriesContent();
    }
}

// view galleries page

function drawAlbums () {
    window.galleries.forEach(
        function (album) {
            $('#GalleriesPage .galleries_container').append(
                '<a href="#/gallery/' + album._id + '"><div class="col s12 m3">' +
                    '<div class="card">' +
                        '<div class="card-image">' +
                            '<img src="'+ ThumbToVideoUrl(album.Cover) +'" />' +
                        '</div>' +
                        '<div class="card-content">' +
                            '<div class="card-title">' + (album.Title ? escapeHtml(album.Title) : trans.galleryWithoutName) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div></a>'
            );
        }
    )
}

function ThumbToVideoUrl (videoUrl) {
    if (false === /(mp4|webm|avi|mpeg)$/i.test(videoUrl)) {
        return videoUrl; // its not video, return the original value
    }

    return videoUrl.replace(/\.[\.a-z0-9]{2,6}$/i, '.jpg');;
}

$(document).on('click', '#CreateNewAlbum', function () {
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/create',
        method: 'POST',
        data: "{}",
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            if (true === Data.Success) {
                location.href = location.hash + '/' + Data.Data + '/edit';
                Materialize.toast(trans.newAlbumCreated, 2000);
            } else {
                console.log('Error!');
            }
        }
    )
});

// edit gallery page

$(document).on('click', '#UploadImagesBtn', function () {
    $('#GalleryImagesUpload').click();
});

$(document).on('click', '#EditGalleryPage .delete_image', function () {
    if (true === removingImage) return;
    removingImage = true;

    var image = $(this);
    image.closest('.thumb').css({opacity: 0.2});
    $.ajax({
        url: location.hash.replace(/^\#\//, '').replace('/edit', '/delete-image'),
        type: 'POST',
        data: JSON.stringify({Image: image.data('url')}),
        contentType: 'application/json; charset=utf-8',
        success: function(Data) {
            if (Data.Success) {
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
                image.closest('.thumb').remove();
            } else {
                Materialize.toast(trans.anErrorOccured, 3000);
            }
        },
        complete: function () {
            removingImage = false;
        }
    });
});

$(document).on('click', '#SaveGallery', function () {
    $.ajax({
        url: location.hash.replace(/^\#\//, ''),
        type: 'POST',
        data: JSON.stringify({
            Title: $('#GalleryTitle').val()
        }),
        contentType: 'application/json; charset=utf-8',
        success: function(Data) {
            if (Data.Success) {
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
            }
        }
    });
});

$(document).on('click', '#DeleteGallery', function () {
    $('#ConfirmRemoveAlbumModal').modal();
    $('#ConfirmRemoveAlbumModal').modal('open');
});

$(document).on('click', '#AgreeRemoveAlbum', function (e) {
    e.preventDefault();
    $.ajax({
        url: location.hash.replace(/^\#\//, '').replace('/edit', '/delete-gallery'),
        type: 'POST',
        data: JSON.stringify({}),
        contentType: 'application/json; charset=utf-8',
        success: function(Data) {
            if (Data.Success) {
                location.href = '#/gallery';
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
            }
        }
    });
});

function fileInputChanged () {
    var files = $('#GalleryImagesUpload')[0].files;
    var filesNotSupported = false;

    for (var f in files) {
        if (-1 === ['length', 'item'].indexOf(f)) {
            if (true === /(jpg|jpeg|png|gif)/i.test(files[f].type)) {
                galleryImagesToUpload.push(files[f]);
                totalAlbumImagesToUpload++;
            } else if (true === /(mp4|avi|mpeg|webm)/i.test(files[f].type)) {
                files[f].IsVideo = true;
                galleryImagesToUpload.push(files[f]);
                totalAlbumImagesToUpload++;
            } else {
                filesNotSupported = true;
            }
        }
    }
    if (true === filesNotSupported) {
        Materialize.toast(trans.someOfTheFilesNotSupported, 2000);
    }
    drawUploadStatus();
    uploadNextImage();
}

function uploadNextImage () {
    if (3 <= currentUploadingProcesses || !galleryImagesToUpload.length) {
        return;
    }

    currentUploadingProcesses++;
    var file = galleryImagesToUpload.pop();

    var formData = new FormData();
    formData.append('image', file);
    var urlPath = file.IsVideo ? '/add-video' : '/add-image';

    $.ajax({
        url: location.hash.replace(/^\#\//, '').replace('/edit', urlPath),
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(Data) {
            if (Data.Success && true === /^\#\/gallery/i.test(location.hash)) {
                var videoUrl = Data.Data.split('/');
                var fileId = videoUrl.pop();
                fileId = ('150' + fileId).replace(/\.[\.a-z0-9]{2,6}$/i, '.jpg');
                videoUrl.push(fileId);
                videoUrl = videoUrl.join('/');

                var htmlToAppend = (file.IsVideo ?
                '<div class="col s12 m2 thumb">' +
                    '<div class="card video" style="background-image: url('+videoUrl +')">' +
                        '<button data-url="'+ Data.Data.split('/').pop() +'" class="delete_image small_button red darken-4 btn waves-effect waves-light" type="submit" name="action"><i style="margin:0;" class="fa fa-trash"></i></button>' +
                    '</div>' +
                '</div>' :
                '<div class="col s12 m2 thumb">' +
                    '<div class="card" style="background-image: url('+Data.Data+')">' +
                        '<button data-url="'+ Data.Data.split('/').pop().replace(/^150/, '') +'" class="delete_image small_button red darken-4 btn waves-effect waves-light" type="submit" name="action"><i style="margin:0;" class="fa fa-trash"></i></button>' +
                    '</div>' +
                '</div>');

                $(htmlToAppend).appendTo('#EditGalleryPage .gallery_images');
            }
        },
        complete: function () {
            if (true === /^\#\/gallery/i.test(location.hash)) {
                currentUploadingProcesses--;
                totalAlbumImagesUploaded++;

                uploadNextImage();
                drawUploadStatus();
            }
        }
    });
}

function checkEmptyGalleriesContent () {
    if (galleries.length) {
        $('.gallery_page .galleries_container').removeClass('hide');
        $('.gallery_page .no_results').addClass('hide');
    } else {
        $('.gallery_page .galleries_container').addClass('hide');
        $('.gallery_page .no_results').removeClass('hide');
    }
}


function drawUploadStatus () {
    if (totalAlbumImagesToUpload) {
        $('.upload_status_container .preloader-wrapper').removeClass('hide');
        $('.upload_status_container').removeClass('hide');
        $('#UploadStatus').text(trans.uploadInProgress + ' ' + totalAlbumImagesUploaded + ' / ' + totalAlbumImagesToUpload);
        
        if (totalAlbumImagesToUpload === totalAlbumImagesUploaded) {
            $('.upload_status_container .preloader-wrapper').addClass('hide');
            $('#UploadStatus').text(trans.uploadCompleted);
        }
    }
}