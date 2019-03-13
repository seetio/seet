var ImportantNoteInProccess = false;
var EditingNoteId = null;

function createImportantNote () {
    var title   = $('#ImportantNoteTitle').val();
    var content = $('#ImportantNoteContent').val();

    if (2 > title.trim().length || 2 > content.trim().length) {
        return;
    }

    if (true === ImportantNoteInProccess) {
        return;
    }
    ImportantNoteInProccess = true;

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/add',
        method: 'POST',
        data: JSON.stringify({
            Title: title,
            Note: content
        }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'html'
    }).then(
        function (Data) {
            ImportantNoteInProccess = false;
            var insertedNote = $(Data).prependTo($('.notes_container'));
            insertedNote.find('.edit_important_note').click(openEditNote);
            $('#AddEditNoteModal').modal('close');
            checkEmptyNotesContent();
        }
    ).catch(
        function () {
            ImportantNoteInProccess = false;
            Materialize.toast(trans.anErrorOccured, 2000);
        }
    )

}

function editImportantNote () {
    var title   = $('#ImportantNoteTitle').val().trim();
    var content = $('#ImportantNoteContent').val().trim();
    var note    = $('.note[data-note="'+EditingNoteId+'"]');
    var noteId  = note.attr('data-note');

    if (2 > title.length || 2 > content.length) {
        return;
    }

    if (true === ImportantNoteInProccess) {
        return;
    }
    ImportantNoteInProccess = true;

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/' + noteId + '/edit',
        method: 'POST',
        data: JSON.stringify({
            Title: title,
            Note: content
        }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'html'
    }).then(
        function (Data) {
            ImportantNoteInProccess = false;
            $('#AddEditNoteModal').modal('close');
            note.replaceWith(Data);
            $('.note[data-note="'+EditingNoteId+'"] .edit_important_note').click(openEditNote);
        }
    ).catch(
        function () {
            ImportantNoteInProccess = false;
            Materialize.toast(trans.anErrorOccured, 2000);
        }
    )
}

function deleteImportantNote () {
    var note    = $('.note[data-note="'+EditingNoteId+'"]');
    var noteId  = note.attr('data-note');

    if (true === ImportantNoteInProccess) {
        return;
    }
    ImportantNoteInProccess = true;

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/' + noteId + '/delete',
        method: 'POST',
        data: JSON.stringify(),
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            ImportantNoteInProccess = false;
            if (Data.Success) {
                note.remove();
                $('#AddEditNoteModal').modal('close');
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
            checkEmptyNotesContent();
        }
    ).catch(
        function () {
            ImportantNoteInProccess = false;
            Materialize.toast(trans.anErrorOccured, 2000);
        }
    )
}

function openNoteModal (create) {
    var action = create ? 'add' : 'edit';
    $('#AddEditNoteModal .add, #AddEditNoteModal .edit').hide();
    $('#AddEditNoteModal .' + action).show();
    $('#ImportantNoteTitle').val('');
    $('#ImportantNoteContent').val('');
    $('#AddEditNoteModal').modal();
    $('#AddEditNoteModal').modal('open');
    $('#AddEditNoteModal').removeClass('add edit');
    $('#AddEditNoteModal').addClass(action);
    $('#ImportantNoteContent').trigger('keyup');
}

function openEditNote (e) {
    e.stopPropagation();
    e.preventDefault();
    var note = $(this).parents('.note').eq(0);
    EditingNoteId = note.attr('data-note');
    openNoteModal(false);
    $('#ImportantNoteTitle').val($(note).find('.title').text().trim());
    $('#ImportantNoteContent').val($(note).find('.content').text().trim());
    $('#ImportantNoteContent').trigger('autoresize');
}

function checkEmptyNotesContent () {
    if ($('.notes_container .note').length) {
        $('.notes_page .notes_container').removeClass('hide');
        $('.notes_page .no_results').addClass('hide');
    } else {
        $('.notes_page .notes_container').addClass('hide');
        $('.notes_page .no_results').removeClass('hide');
    }
}

function notesPageCallback () {
    EditingNoteId = null;
    ImportantNoteInProccess = false;
    $('#AddNewImportantNote').click(function () {
        openNoteModal(true);
    });
    
    $('.edit_important_note').click(openEditNote);
    $('#SubmitAddNewImportantNote').click(createImportantNote);
    $('#SubmitDeleteImportantNote').click(deleteImportantNote);
    $('#SubmitEditImportantNote').click(editImportantNote);
    checkEmptyNotesContent();
}