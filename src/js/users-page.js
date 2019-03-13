var newEmployeeTemplate = 
    '<li class="collection-item">' +
        '<div class="col s4 input-field"><input type="text" name="Phone" class="phone_input" value="{Phone}" placeholder=""></input></div>' +
        '<div class="col s4 input-field"><input type="text" name="FirstName" value="{FirstName}" placeholder=""></input></div>' +
        '<div class="col s3 input-field"><input type="text" name="LastName" value="{LastName}" placeholder=""></input></div>' +
        '<div class="col s1 input-field center-align"><button class="remove_new_employee_row btn red darken-2 waves-effect waves-light" type="button"><i class="fa fa-trash"></i></input></button></div>' +
        '<div class="clear"></div>' +
    '</li>'
;

$('body').on('submit', '#EditUser', function (e) {
    e.preventDefault();
    $('#Phone').val($('#EditPhone').intlTelInput('getNumber'));
    var qs = $('#EditUser').serialize();
    $.post(location.hash.replace(/^\#\//, ''), { Query: qs }, function (Data) {
        Materialize.toast(trans.changesSavedSuccessfuly, 2000);
    }, 'JSON');
});

var fetchUsersTimeout;
var updatingUserProfile;
var creatingNewUser;
var refreshEmployeesPage;

function usersPageCallback () {
    fetchUsersTimeout   = null;
    updatingUserProfile = false;
    creatingNewUser = false;
    refreshEmployeesPage = false;

    if ($('#AddEmployeeModal').length) {

        $('#AddNewUsersButton')[0].addEventListener('click', addNewUsersButton);
        $('#AddEmployeeButton')[0].addEventListener('click', openAddEmployeeModal);
        $('#AddEmployeesButton')[0].addEventListener('click', openAddEmployeesModal);
        $('#AddNewUserButton')[0].addEventListener('click', AddEmployeeButton);
        $('#UploadEmployeesCSV')[0].addEventListener('change', FetchCSVFile);
        $('#AddEmployeeModal').modal({
            dismissible: false,
            ready: function () {
                $('#NewUserPhone').intlTelInput('setCountry', window.countryCode);
            },
            complete: function() {
                if (refreshEmployeesPage) {
                    loadPage();
                }
            }
        });
        $('#AddEmployeesModal').modal({
            dismissible: false,
            complete: function() {
                if (refreshEmployeesPage) {
                    loadPage();
                }
            }
        });
    }

    if ($('#EditUser').length) {
        $('#ProfileThumb')[0].addEventListener('change', userProfileChanged);
        $('#UpdateEmployeeImage')[0].addEventListener('click', openThumbFileUpload);
        $('#DeleteEmployee')[0].addEventListener('click', DeleteEmployeeButton);
    }

    if ($('#SearchTerm').length) {
        $('#SearchTerm')[0].addEventListener('keyup', function () {
            clearTimeout(fetchUsersTimeout);
            fetchUsersTimeout = setTimeout(function () {
                searchChanged();
            }, 670);
        });

        var page = $.urlParam('Page');
        if (!page || 1 > page) {
            $('#SearchTerm').focus();
            var val = $('#SearchTerm').val();
            $('#SearchTerm').val('')
            $('#SearchTerm').val(val);
        }
    }



    function searchChanged () {
        $('#AddEmployeeModal').modal('close');
        var dest = '#/employees/?';
        // var page = $.urlParam('Page');
        // if (0 < page) {
        //     dest += 'Page=' + page + '&';
        // }

        dest += 'SearchTerm=' + $('#SearchTerm').val();

        location.href = dest;
    }
}

function openThumbFileUpload () {
    $('#ProfileThumb').click();
}

function userProfileChanged () {
    if (true === updatingUserProfile) {
        return;
    }

    updatingUserProfile = true;
    $('.user_profile .profile_image').addClass('updating');
    
    var formData = new FormData();
    formData.append('file', $('#ProfileThumb')[0].files[0])
    $('#ProfileThumb').val('');

    $.ajax({
        url: location.hash.replace(/^\#\//, '').replace('/edit', '/update-image'),
        type: 'POST',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
            if (data.Success) {
                $('#UserThumb').attr('src', data.Data);
            }
        },
        error: function () {
            Materialize.toast(trans.anErrorOccured, 2000);
        },
        complete: function () {
            $('.user_profile .profile_image').removeClass('updating');
            updatingUserProfile = false;
        }
    });
}

function openAddEmployeeModal () {
    ResetCreatePopups();
    $('#AddEmployeeModal').modal('open');
}

function openAddEmployeesModal () {
    ResetCreatePopups();
    $('#AddEmployeesModal').modal('open');
}

function AddEmployeeButton () {
    if (true === creatingNewUser) {
        return;
    }
    creatingNewUser = false;

    var query = {
        Phone: $('#NewUserPhone').intlTelInput('getNumber'),
        FirstName: $('#NewUserFirstName').val(),
        LastName: $('#NewUserLastName').val(),
    }

    $.post('/employees/create', query, function (Data) {
        if (Data.Success) {
            $('#AddEmployeeModal .success_errors').addClass('hide');
            Materialize.toast(trans.changesSavedSuccessfuly, 2000);
            refreshEmployeesPage = true;
            $('#AddEmployeeModal').modal('close');
        } else {
            $('#AddEmployeeModal .success_errors').removeClass('hide');
            $('#AddEmployeeModal .error_message').text(Data.Data);
        }
    }, 'JSON')
    .always(
        function () {
            creatingNewUser = false;
        }
    );
}

function DeleteEmployeeButton () {
    if (true === confirm(trans.areYouSure)) {
        $.post(location.hash.replace(/^\#\//, '').replace('/edit', '/delete'), {}, function (Data) {
            if (true === Data.Success) {
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
                location.href = '/#/employees';
            } else {
                Materialize.toast(Data.Data, 4000);
            }
        }, 'JSON');
    }
}

function drawNewCSVData (CSVEmployees) {
    var ul = $('#NewEmployeesList > ul');

    if (CSVEmployees.length) {
        $('#NewEmployeesList').removeClass('hide');
    }

    for (var e in CSVEmployees) {
        if (-1 === ['length', 'item'].indexOf(e)) {
            var employee = CSVEmployees[e];
            var renderedTemplate = newEmployeeTemplate
                .replace('{Phone}', employee[0])
                .replace('{FirstName}', employee[1])
                .replace('{LastName}', employee[2]);

            var appendedEl = $(renderedTemplate).appendTo(ul);
            $(appendedEl).find('.phone_input').intlTelInput({
                initialCountry: window.countryCode,
                preferredCountries: ['il', 'us'],
                utilsScript: '/public/js/utils.js'
            });

            $(appendedEl).find('.remove_new_employee_row').click(function () {
                $(this).closest('.collection-item').remove();
            });
        }
    }
}

function addNewUsersButton () {
    if (true === creatingNewUser) {
        return;
    }
    creatingNewUser = true;

    var newEmployees = [];
    $('#NewEmployeesList input').attr('disabled', 'disabled');
    $('#NewEmployeesList .remove_new_employee_row').remove();
    $('#AddEmployeesModal .close_button').removeClass('hide');
    $('#AddNewUsersButton, #AddEmployeesModal .cancel_button').addClass('hide');

    $('#NewEmployeesList > ul > .collection-item').each(
        function () {
            var phone = $(this).find('input[name="Phone"]').intlTelInput('getNumber');
            $(this).attr('data-phone', phone);

            newEmployees.push({
                Phone       : phone,
                FirstName   : $(this).find('input[name="FirstName"]').val(),
                LastName    : $(this).find('input[name="LastName"]').val()
            });
        }
    )

    $.ajax({
        url: '/employees/create-many',
        data: JSON.stringify(newEmployees),
        type: 'POST',
        contentType: "application/json",
        dataType: 'json',
        success: function (Data) {
            if (Data.Success) {
                var totalSuccess = 0;
                Data.Data.forEach(function (user) {
                    if (user.Success) {
                        totalSuccess++;
                    }
                    $('.collection-item[data-phone="'+user.Phone+'"]').addClass(user.Success ? 'green lighten-5' : 'red lighten-5');
                });
                $('<li class="collection-item">'+trans.importedSuccesfuly+' '+totalSuccess+'/'+Data.Data.length+'</li>').prependTo('#NewEmployeesList > ul');
                refreshEmployeesPage = true;
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
        },
        complete: function () {
            creatingNewUser = false;
        }
    });
}

function ResetCreatePopups () {
    $('#AddEmployeesModal .success_errors').addClass('hide');
    $('#NewEmployeesList').addClass('hide');
    $('#NewEmployeesList > .collection').html('');
    $('#UploadCSVGUIButton').removeClass('hide');
    $('#AddNewUsersButton').addClass('hide');
    $('#AddEmployeesModal .cancel_button').removeClass('hide');
    $('#AddNewUsersButton, #AddEmployeesModal .close_button').addClass('hide');

    $('#AddEmployeeModal .success_errors').addClass('hide');
    $('#NewUserPhone').val('');
    $('#NewUserFirstName').val('');
    $('#NewUserLastName').val('');
}

function FetchCSVFile () {
    $('#AddEmployeesModal .success_errors').addClass('hide');
    var file = $('#UploadEmployeesCSV')[0].files[0];
    if (!file) {
        return;
    }

    if (false === /(\.csv)/i.test(file.name)) {
        $('#AddEmployeesModal .success_errors').removeClass('hide');
        $('#AddEmployeesModal .error_message').text(trans.onlyCSVFileSupported);

        return;
    }

    $('#UploadCSVGUIButton').addClass('hide');

    var reader = new FileReader();

    reader.onload = function () {
        drawNewCSVData(CSVToArray(reader.result));
        $('#AddNewUsersButton').removeClass('hide');
        $('#UploadEmployeesCSV').val('');
    }

    reader.readAsText(file);
}