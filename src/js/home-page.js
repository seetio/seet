var homePageTimeCallback = null;
var uploadingNewPostMedia;
var NewPostMediaUrl;
var PostingActionInProgress = false;
var endOfHomepageResults = false;
var loadingPosts = false;

function updateTimes () {
    $('#NowTime').text(moment().format('H:mm:ss'));
    $('#NowYear').text(moment().format('YYYY'));
    $('#NowMonth').text(moment().format('MMM').replace('׳', ''));
    $('#NowDay').text(moment().format('DD'));
}

$(document.body).on('click', '.do_like', doLike);
$(document.body).on('click', '.do_unlike', doUnlike);
$(document.body).on('click', '.delete_post', deletePost);
$(document.body).on('click', '.edit_message', editMessage);
$(document.body).on('click', '.delete_comment', deleteComment);
$(document.body).on('submit', '.newComment', newComment);
$(document.body).on('click', '#SaveEditedMessage', saveEditedMessage);

function doLike () {
    var post = $(this).parents('.single_post');
    var postId = post.attr('data-post');
    post.find('.like_count').text(parseInt(post.find('.like_count').text()) + 1);
    post.find('.do_like').addClass('hide');
    post.find('.do_unlike').removeClass('hide');
    $.post(location.hash.replace(/^\#\//, '') + '/'+postId+'/like')
}

function doUnlike () {
    var post = $(this).parents('.single_post');
    var postId = post.attr('data-post');
    post.find('.like_count').text(parseInt(post.find('.like_count').text()) - 1);
    post.find('.do_like').removeClass('hide');
    post.find('.do_unlike').addClass('hide');
    $.post(location.hash.replace(/^\#\//, '') + '/'+postId+'/unlike')
}

function editMessage (event) {
    var type            = event.target.dataset.type;
    var id              = event.target.dataset.id;
    var content;
    if ('post' === type) {
        content = $(event.target).parents('.single_post').find('.post_content').text();
    } else if ('comment' === type) {
        content = $(event.target).parents('.comment').find('.comment_content').text();
    }

    $('#EditedMessageContent')[0].dataset.type  = type;
    $('#EditedMessageContent')[0].dataset.id    = id;
    $('#EditedMessageContent').val((content || '').trim());
    $('#EditMessageModal').modal().modal('open');
    $('#EditedMessageContent').trigger('autoresize');
}

function saveEditedMessage () {
    var type            = $('#EditedMessageContent')[0].dataset.type;
    var id              = $('#EditedMessageContent')[0].dataset.id;
    var content         = $('#EditedMessageContent').val();

    $.post(location.hash.replace(/^\#\//, '') + '/'+id+'/edit', {
        type: type,
        content: content
    }, function (data) {
        if (data.Success) {
            if ('post' === type) {
                $('.single_post[data-post="'+id+'"]').find('.post_content').html(data.Data);
            } else if ('comment' === type) {
                $('.comment[data-comment="'+id+'"]').find('.comment_content').html(data.Data);
            }

            $('#EditMessageModal').modal('close');
            Materialize.toast(trans.changesSavedSuccessfuly, 2000);
        } else {
            if (data.Data) {
                alert(data.Data);
            }
        }
    }, 'json');
}

function deletePost () {
    var post = $(this).parents('.single_post');
    var postId = post.attr('data-post');

    if (true === PostingActionInProgress) {
        return;
    }
    PostingActionInProgress = true;
    post.css({opacity: 0.3});

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/' + postId + '/delete',
        method: 'POST',
        data: JSON.stringify({}),
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            PostingActionInProgress = false;
            if (Data.Success) {
                post.remove();
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
            checkIfPostsContent();
        }
    ).catch(
        function () {
            PostingActionInProgress = false;
            Materialize.toast(trans.anErrorOccured, 2000);
            post.css({opacity: 1});
        }
    )
}

function deleteComment () {
    var post        = $(this).parents('.single_post');
    var comment     = $(this).parents('.comment');
    var postId      = post.attr('data-post');
    var commentId   = $(this).attr('data-comment');

    if (true === PostingActionInProgress) {
        return;
    }
    PostingActionInProgress = true;
    comment.css({opacity: 0.3});

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/' + postId + '/delete-comment',
        method: 'POST',
        data: JSON.stringify({CommentID: commentId}),
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            PostingActionInProgress = false;
            if (Data.Success) {
                comment.remove();
                post.find('.comment_count').text(parseInt(post.find('.comment_count').text()) - 1);
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
        }
    ).catch(
        function () {
            PostingActionInProgress = false;
            Materialize.toast(trans.anErrorOccured, 2000);
            comment.css({opacity: 1});
        }
    )
}

function newComment (e) {
    e.preventDefault();
    var post    = $(this).parents('.single_post');
    var postId  = post.attr('data-post');
    var comment = $(this).find('.user_comment').val();

    if (2 > comment.trim().length) {
        Materialize.toast(trans.commentIsntGood, 2000);
        return;
    }

    if (true === PostingActionInProgress) {
        return;
    }
    PostingActionInProgress = true;
    
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/' + postId + '/comment',
        method: 'POST',
        data: JSON.stringify({Comment: comment}),
        contentType: 'application/json; charset=utf-8'
    }).then(
        function (Data) {
            $(Data).prependTo(post.find('.comments'));
            post.find('.comment_count').text(parseInt(post.find('.comment_count').text()) + 1);
            post.find('.user_comment').val('');
            PostingActionInProgress = false;
            $('.dropdown-button').dropdown({constrainWidth: false});
        }
    ).catch(
        function () {
            PostingActionInProgress = false;
            Materialize.toast(trans.anErrorOccured, 2000);
            post.find('.user_comment').val('');
        }
    )

    return false;
}

function createPost () {
    var postContent  = $('#NewPostContent').val().trim();
    var errorMessage = $('.publish_post_container .errors');
    var data         = {};
    errorMessage.addClass('hide');

    if (2 > postContent.length) {
        errorMessage.text(trans.reallyThisIsYourPost);
        errorMessage.removeClass('hide');        

        return;
    }

    if (true === PostingActionInProgress) {
        return;
    }
    PostingActionInProgress = true;

    data.Content = postContent;
    if ('string' === typeof NewPostMediaUrl) {
        data.Media = NewPostMediaUrl.split('/').pop();
    }

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/post',
        method: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        dataType: 'html'
    }).then(
        function (Data) {
            Materialize.toast(trans.postPublishedSuccessfuly, 2000);
            $(Data).prependTo($('.posts_container'));
            $('#NewPostContent').val('');
            $('#AddNewPostMediaButton').removeClass('hide');
            $('.publish_post_container .media .image_preview, .publish_post_container .media .video_preview, .publish_post_container .media .preloader-wrapper').addClass('hide');
            $('.publish_post_container .media .image_preview img').attr('src', '');
            $('.publish_post_container .media .video_preview source').attr('src', '');
            $('.dropdown-button').dropdown({constrainWidth: false})
            NewPostMediaUrl = null;
            PostingActionInProgress = false;
            checkIfPostsContent();
        }
    ).catch(
        function () {
            PostingActionInProgress = false;
            Materialize.toast(trans.anErrorOccured, 3000);
        }
    );
}

function MediaFileChanged () {
    if (true === uploadingNewPostMedia) {
        return;
    }

    $('#AddNewPostMediaButton').addClass('hide');
    $('#PublishPost').prop('disabled', 'disabled');
    $('.publish_post_container .media .image_preview, .publish_post_container .media .video_preview').addClass('hide');
    $('.publish_post_container .media .preloader-wrapper').removeClass('hide');
    
    uploadingNewPostMedia = true;

    var formData = new FormData();
    formData.append('file', $('#NewPostMediaFile')[0].files[0])
    $('#NewPostMediaFile').val('');

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/add-media',
        type: 'POST',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
            if (data.Success) {
                NewPostMediaUrl = data.Data;
                if (/(jpg|jpeg|png|gif)$/i.test(data.Data)) {
                    $('.publish_post_container .media .image_preview').removeClass('hide');
                    $('.publish_post_container .media .image_preview img').attr('src', data.Data);
                } else {
                    var ext = data.Data.split('.').pop();
                    $('.publish_post_container .media .video_preview').removeClass('hide');
                    $('.publish_post_container .media .video_preview source').attr('src', data.Data);
                    $('.publish_post_container .media .video_preview source').attr('type', 'video/' + ext);
                    videojs(
                        'NewPostVideo',
                        {
                            fluid: true
                        }
                    )
                }
            }
        },
        error: function () {
            Materialize.toast(trans.fileTypeNotSupported, 2000);
            $('#AddNewPostMediaButton').removeClass('hide');
        },
        complete: function () {
            uploadingNewPostMedia = false;
            $('#PublishPost').prop('disabled', '');
            $('.publish_post_container .media .preloader-wrapper').addClass('hide');
        }
    });
}

function checkIfPostsContent () {
    if ($('.posts_container .single_post:not(.no_results)').length) {
        $('.posts_container .single_post.no_results').addClass('hide');
    } else {
        $('.posts_container .single_post.no_results').removeClass('hide');
    }
}

function homepageScrollListener () {
    var posts_container = $('.posts_container');
    var posts = $('.posts_container .single_post:not(.no_results)');

    if (posts.length) {
        if (false === loadingPosts && false === endOfHomepageResults &&
            ((posts_container[0].scrollHeight < window.innerHeight) ||
            (document.body.scrollHeight <= window.scrollY + window.innerHeight + 300))
        ) {
            loadingPosts = true;
            loadMorePosts($(posts[posts.length - 1]).attr('data-post'));
        }
    }
}

function loadMorePosts (lastPostId) {
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/posts/' + lastPostId,
        method: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'html'
    }).then(
        function (Data) {
            loadingPosts = false;
            $(Data).appendTo('.home_page .posts_container');
        }
    ).catch(
        function () {
            endOfHomepageResults = true;
            loadingPosts = false;
        }
    )
}

function homePageCallback () {
    PostingActionInProgress = false;
    NewPostMediaUrl = null;
    uploadingNewPostMedia = false;
    updateTimes();
    homePageTimeCallback = setInterval(updateTimes, 500);
    $('#PublishPost').click(createPost);
    $('#NewPostMediaFile').change(MediaFileChanged);
    $('#NewPostContent').keyup(function () {
        $(this).height('initial');
        var scrollHeight = $(this).prop('scrollHeight');
        $(this).height((42 < scrollHeight ? scrollHeight : 42) + 'px');
    });
    $('.dropdown-button').dropdown({constrainWidth: false});
    checkIfPostsContent();
    PostingActionInProgress = false;
    endOfHomepageResults = false;
    loadingPosts = false;
    document.addEventListener('scroll', homepageScrollListener, false);
}