var saveSettingsTimeout = null;
var reloadSettingsPage  = false;

function settingsPageCallback () {
    
    // console.log(buildFormObject($('#SettingsForm')));
    // dispatchEvent(new Event('change'));
    $('#ToggleTeamsEdit')[0].addEventListener('change', saveSettings);
    $('#ToggleGalleryModule')[0].addEventListener('change', saveSettings);
    // $('#ToggleFeedModule')[0].addEventListener('change', saveSettings);
    $('#ToggleCalendarModule')[0].addEventListener('change', saveSettings);
    $('#ToggleTreeModule')[0].addEventListener('change', saveSettings);
    $('#ToggleNotesModule')[0].addEventListener('change', saveSettings);
    $('#ToggleDocumentsModule')[0].addEventListener('change', saveSettings);
    $('#ToggleShiftsModule')[0].addEventListener('change', saveSettings);
    $('#ChangeLanguage').change(function () {
        reloadSettingsPage = true;
        saveSettings();
    });
    $('#UpdateCompanyLogo')[0].addEventListener('click', UpdateCompanyLogo);
    if ($('#DeleteCompanyLogo').length) {
        $('#DeleteCompanyLogo')[0].addEventListener('click', DeleteCompanyLogo);
    }

    $('#ToggleTeamsEdit, #ToggleGalleryModule, #ToggleCalendarModule, #ToggleTreeModule, #ToggleNotesModule, #ToggleDocumentsModule, #ToggleShiftsModule').change(function () {
        var targetDiv = $(this).data('targetdiv');
        if ($(this).is(':checked')) {
            $(targetDiv).removeClass('disabled');
        } else {
            $(targetDiv).addClass('disabled');
        }
    });

    // $('#ToggleTeamsEdit')[0].addEventListener('change', function() {
    //     if ($('#ToggleTeamsEdit').is(':checked')) {
    //         $('#TeamList').removeClass('disabled');
    //     } else {
    //         $('#TeamList').addClass('disabled');
    //     }

    //     saveSettings();
    // })

    $('#AddTeamRow')[0].addEventListener('click', addTeamRow);

    // Modules Tab

    setTimeout(function() {
        var selectizeOptions = {
            valueField: '_id',
            labelField: 'FirstName',
            searchField: ['FirstName', 'LastName'],
            render: {
                option: function(item, escape) {
                    return '<div>'+
                        '<div class="thumb"><img src="' + item.Thumb + '" /></div>' +
                        '<div class="name">' + item.FirstName + ' ' + item.LastName + '</div>' +
                    '</div>';
                }
            },
            options : employees
        };
        $('#FeedEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#GalleryEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#CalendarEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#TreeEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#NotesEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#DocumentsEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#ShiftsEditors').selectize(selectizeOptions).on('change', saveSettings);
        $('#EmployeesEditors').selectize(selectizeOptions).on('change', saveSettings);
    }, 60);
}

$(document.body).on('click', '.delete_team_row', function () {
    $(this).closest('.team').eq(0).remove();
    saveSettings();
});

$(document.body).on('keyup', '.edit_single_team_name', function () {
    saveSettings();
});

function addTeamRow () {
    $('<div class="team">' +
        '<div class="input-field col s11">' +
            '<input class="edit_single_team_name" name="Teams" type="text" placeholder="'+ trans.teamName +'">' +
        '</div>' +
        '<div class="input-field col s1">' +
            '<a class="delete_team_row btn-floating red darken-2 waves-effect waves-light"><i class="fa fa-trash"></i>' +
            '</a>' +
        '</div>' +
      '</div>').insertBefore($('.add_team_container'));

    saveSettings();
}

function saveSettings () {
    clearTimeout(saveSettingsTimeout);

    saveSettingsTimeout = setTimeout(function () {
        var settingsObject = buildFormObject($('#SettingsForm'));
        $.ajax({
            url: location.hash.replace(/^\#\//, ''),
            method: 'POST',
            data: JSON.stringify(settingsObject),
            contentType: 'application/json; charset=utf-8',
            dataType: 'JSON'
        }).then(
            function (Data) {
                if (true === Data.Success) {
                    Materialize.toast(trans.changesSavedSuccessfuly, 2000);
                } else {
                    Materialize.toast(trans.anErrorOccured, 2000);
                }

                if (true === reloadSettingsPage) {
                    location.reload();
                }
            }
        )
    }, 400)
}

function UpdateCompanyLogo () {
    var newLogo = $('#NewCompanyLogoImage')[0].files[0];
    $('#NewLogoError').addClass('hide');

    if (!newLogo) {
        $('#NewLogoError').text(trans.selectImageFirst).removeClass('hide');

        return;
    }

    if (5000000 < newLogo.size) {
        $('#NewLogoError').text(trans.imageMustBeLowerThan5Mb).removeClass('hide');

        return;
    }

    if (false === /\.(jpe?g|png)$/i.test(newLogo.name)) {
        $('#NewLogoError').text(trans.fileTypeMustBeJpgOrPng).removeClass('hide');

        return;
    }

    $('.collection-item.change_logo').addClass('disabled');

    var formData = new FormData();
    formData.append('file', newLogo);

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/update-logo',
        type: 'POST',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
            if (data.Success) {
                location.reload();
            } else {
                $('.collection-item.change_logo').removeClass('disabled');
                Materialize.toast(Data.Data, 2000);
            }
        },
        error: function () {
            $('.collection-item.change_logo').removeClass('disabled');
            Materialize.toast(trans.anErrorOccured, 2000);
        }
    });
}

function DeleteCompanyLogo () {
    $('.collection-item.change_logo').addClass('disabled');

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/delete-logo',
        method: 'PATCH',
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            if (true === Data.Success) {
                location.reload();
            } else {
                $('.collection-item.change_logo').removeClass('disabled');
                Materialize.toast(Data.Data, 2000);
            }
        }
    )
}

function buildFormObject (form) {
    var result = {};

    $(form).serializeArray().forEach(
        function (field) {
            if (result.hasOwnProperty(field.name)) {
                if (!Array.isArray(result[field.name])) {
                    result[field.name] = [result[field.name]];
                }

                result[field.name].push(field.value);
            } else {
                result[field.name] = field.value
            }
        }
    );

    result.TeamsEnabled     = $('#ToggleTeamsEdit').is(':checked');
    result.GalleryEnabled   = $('#ToggleGalleryModule').is(':checked');
    // result.FeedEnabled      = $('#ToggleFeedModule').is(':checked');
    result.CalendarEnabled  = $('#ToggleCalendarModule').is(':checked');
    result.TreeEnabled      = $('#ToggleTreeModule').is(':checked');
    result.NotesEnabled     = $('#ToggleNotesModule').is(':checked');
    result.DocumentsEnabled = $('#ToggleDocumentsModule').is(':checked');
    result.ShiftsEnabled    = $('#ToggleShiftsModule').is(':checked');

    result.EmployeesEditors = result.EmployeesEditors.split(',');
    result.GalleryEditors   = result.GalleryEditors.split(',');
    result.FeedEditors      = result.FeedEditors.split(',');
    result.CalendarEditors  = result.CalendarEditors.split(',');
    result.TreeEditors      = result.TreeEditors.split(',');
    result.NotesEditors     = result.NotesEditors.split(',');
    result.DocumentsEditors = result.DocumentsEditors.split(',');
    result.ShiftsEditors    = result.ShiftsEditors.split(',');

    return result;
}