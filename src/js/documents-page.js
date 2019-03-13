var DocumentInProcess = false;
function openAddDocumentModal () {
    resetAddDocumentModal();
    $('#AddEditDocumentModal').modal().modal('open');
}

function resetAddDocumentModal () {
    $('#AddEditDocumentModal .errors_con').addClass(('hide'));
    $('#SubmitAddNewDocument').removeClass('disabled');
    $('#NewDocumentTitle').val('');
    $('#NewDocumentFile').val('').trigger('change');
}

function sendDocument (Data) {
    if (true === Data.Success) {
        var title   = $('#NewDocumentTitle').val().trim();
        var file    = Data.Data;

        $.ajax({
            url: location.hash.replace(/^\#\//, '') + '/add',
            method: 'POST',
            data: JSON.stringify({
                Title: title,
                File: file
            }),
            contentType: 'application/json; charset=utf-8',
            dataType: 'html'
        }).then(
            function (Data) {
                DocumentInProcess = false;
                $('#SubmitAddNewDocument').removeClass('disabled');
                var newDocument = $(Data).appendTo('.documents_container');
                newDocument.dropdown({constrainWidth: false});
                newDocument.find('.trash_button').click(tashClicked);
                newDocument.find('.delete_document').click(deleteDocument);
                newDocument.find('.dropdown-button').dropdown({constrainWidth: false});
                $('#AddEditDocumentModal').modal('close');
                checkEmptyDocumentContent();
            }
        ).catch(
            function (data) {
                DocumentInProcess = false;
                $('#SubmitAddNewDocument').removeClass('disabled');
                Materialize.toast(data, 2000);
            }
        )
    } else {
        $('#AddEditDocumentModal .errors').text(trans.couldntUploadFile);
    }
    
}

function uploadDocumentFile () {
    $('#AddEditDocumentModal .errors_con').addClass(('hide'));
    var title = $('#NewDocumentTitle').val().trim();
    var file  = $('#NewDocumentFile')[0].files[0];

    if (!file) {
        $('#AddEditDocumentModal .errors_con').removeClass(('hide'));
        $('#AddEditDocumentModal .errors').text(trans.pleaseChooseFile);
        return;
    }
    
    if (2 > title.length) {
        $('#AddEditDocumentModal .errors_con').removeClass(('hide'));
        $('#AddEditDocumentModal .errors').text(trans.missingTitle);
        return;
    }
    
    if (true === DocumentInProcess) {
        return;
    }

    DocumentInProcess = true;
    $('#SubmitAddNewDocument').addClass('disabled');

    var formData = new FormData();
    formData.append('file', file);
    $('#NewDocumentFile').val('');
    
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/upload-file',
        type: 'POST',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        headers: {
            'custom-name': encodeURIComponent(title)
        },
        success: sendDocument,
        error: function () {
            $('#AddEditDocumentModal .errors_con').addClass(('hide'));
            $('#SubmitAddNewDocument').removeClass('disabled');
            $('#AddEditDocumentModal .errors').text(trans.couldntUploadFile);
        }
    });
}

function tashClicked(e) {
    e.stopPropagation();
    e.preventDefault();
}

function deleteDocument () {
    if (true === DocumentInProcess) {
        return;
    }
    DocumentInProcess = true;

    var $document   = $(this).parents('.document').eq(0);
    var documentId  = $document.attr('data-document');
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/' + documentId +'/delete',
        method: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            DocumentInProcess = false;
            $document.remove();
            Materialize.toast(trans.changesSavedSuccessfuly, 2000);
            checkEmptyDocumentContent();
        }
    ).catch(
        function (data) {
            DocumentInProcess = false;
            Materialize.toast(trans.anErrorOccured, 2000);
        }
    )
}

function checkEmptyDocumentContent () {
    if ($('.documents_container .document').length) {
        $('.documents_page .documents_container').removeClass('hide');
        $('.documents_page .no_results').addClass('hide');
    } else {
        $('.documents_page .documents_container').addClass('hide');
        $('.documents_page .no_results').removeClass('hide');
    }
}

function documentsPageCallback () {
    DocumentInProcess = false;
    $('#AddNewDocument').click(openAddDocumentModal);
    $('#SubmitAddNewDocument').click(uploadDocumentFile);

    $('.dropdown-button').dropdown({constrainWidth: false});
    $('.documents_container .trash_button').click(tashClicked);
    $('.documents_container .delete_document').click(deleteDocument);
    checkEmptyDocumentContent();
}