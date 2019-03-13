(function () {
    moment.locale(locale);
    var staticUrlEndpoint = 'https://static.seet.io';
    $('#toggleNav').click(function(evt) {
        evt.preventDefault();
        $('body, #sideNav').toggleClass('open');
    });

    var currentRequest = {abort: function() {}};
    var currentPage = '';

    function loadPage (e) {
        resetComponents(); // remove tails from other pages
        currentPage = location.hash.replace(/^\#\//, '').split('/')[0];
        var pageEl = $('#sideNav .links li a[data-page="' + currentPage + '"]');
        if (!pageEl.length) {
            window.location.replace('#/home');
        }
        $('#sideNav .links li a').removeClass('selected');
        pageEl.addClass('selected');

        if (true === $('#toggleNav').is(':visible')) {
            $('body, #sideNav').removeClass('open');
        }

        if ('function' === typeof Pages[currentPage]) {
            Pages[currentPage]();
        } else {
            Pages.generic();
        }
    }

    function resetComponents () {
        // home page
        clearInterval(homePageTimeCallback);
        document.removeEventListener('scroll', homepageScrollListener, false);

        // calendar page
        $('#editEventPopover').remove();

        // gallery page
        galleryImagesToUpload = [];

        // employees page
        clearTimeout(fetchUsersTimeout);
    }

    function loadPageData (Data) {
        $('.site_container').html(Data);
        switch (currentPage) {
            case 'home':
                homePageCallback();
                break;
            case 'tree':
                treePageCallback();
                break;
            case 'calendar':
                calendarPageCallback();
                break;
            case 'gallery':
                galleryPageCallback();
                break;
            case 'important':
                notesPageCallback();
                break;
            case 'documents':
                documentsPageCallback();
                break;
            case 'subscription':
                subscriptionPageCallback();
                break;
            case 'settings':
                settingsPageCallback();
                break;
            case 'employees':
                usersPageCallback();
                break;
        }
    }

    var Pages = {
        generic: function () {
            currentRequest.abort();
            $('.site_container').html('');
            var loader = $('.loading_page_container').clone().prependTo('.site_container');
            loader.removeClass('hide');
            currentRequest = $.get('/' + location.hash.replace(/^\#\//, ''), loadPageData);
            // currentRequest = $.get('/' + currentPage, loadPageData);
        }
    };

    function escapeHtml (input) {
        var inputStr = String(input || '');
        return inputStr
            .replace(/\r|\n/g, "<br/>")
            .replace(/\</g, "&lt;")
            .replace(/\>/g, "&gt;")
            .replace(/\&lt\;br\s?\/?\&gt\;/gi, "<br/>")
    }

    $(document).on('click', '[data-link]', function (e) {
        e.preventDefault();
        e.stopPropagation();

        location.href = $(this).data('link');
    })

    $.urlParam = function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null){
           return null;
        }
        else{
           return decodeURI(results[1]) || 0;
        }
    }

    function CSVToArray( strData, strDelimiter ){
        strDelimiter = (strDelimiter || ",");
        var objPattern = new RegExp(
            (
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );
        var arrData = [[]];
        var arrMatches = null;
        while (arrMatches = objPattern.exec( strData )){
            var strMatchedDelimiter = arrMatches[ 1 ];
            if (
                strMatchedDelimiter.length &&
                (strMatchedDelimiter != strDelimiter)
                ){
                arrData.push( [] );
            }
            if (arrMatches[ 2 ]){
                var strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );
            } else {
                var strMatchedValue = arrMatches[ 3 ];
            }
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }
        return( arrData );
    }

    function updateTimeLabel () {
        var thisHour    = new Date().getHours();
        var moon        = '/public/img/moon.png';
        var sun         = '/public/img/sun.png';
        if (5 <= thisHour && 11 >= thisHour) {
            $('#TimeLabel').text(trans.goodMorning);
            $('#TimeImage').attr('src', sun);
        } else if (12 <= thisHour && 16 >= thisHour) {
            $('#TimeLabel').text(trans.goodNoon);
            $('#TimeImage').attr('src', sun);
        } else if (17 <= thisHour && 19 >= thisHour) {
            $('#TimeLabel').text(trans.goodAfternoon);
            $('#TimeImage').attr('src', sun);
        } else {
            $('#TimeLabel').text(trans.goodEvening);
            $('#TimeImage').attr('src', moon);
        }
    }
    updateTimeLabel();
    $('#sideNav .profile').removeClass('invisible');
    setTimeout(updateTimeLabel, 15000);

    window.addEventListener('hashchange', loadPage);
    loadPage();
