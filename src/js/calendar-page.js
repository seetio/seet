var editedEvent;
var addEditEventHtml = '<div id="editEventPopover" class="card">' + 
    '<div class="row">' +
        '<div class="title col s12"><span class="label"></span> <span id="EventDate" class="event_time"></span>' +
        '<i class="fa fa-close"></i>' +
        '</div>' +
        '<div class="input-field col s12">' +
            '<input id="EventTitle" name="EventTitle" placeholder="'+trans.toast+'">' +
            '<label class="active" for="EventTitle">'+trans.title+'</label>' +
        '</div>' +
        '<div class="input-field col s12">' +
            '<input id="EventTime" name="EventTime" value="00:00">' +
            '<label class="active" for="EventTime">'+trans.time+'</label>' +
        '</div>' +
        '<div class="actions col s12">' +
            '<button id="addCalEevent" class="hidable btn waves-effect waves-light" type="button" name="action">' +
                '<i class="fa fa-check"></i>' +
            '</button>' +
            '<button id="editCalEvent" class="hidable btn waves-effect waves-light" type="button" name="action">' +
                '<i class="fa fa-check"></i>' +
            '</button>' +
            '<button id="delCalEvent" class="hidable btn waves-effect waves-light" type="button" name="action">' +
                '<i class="fa fa-trash"></i>' +
            '</button>' +
            '<button id="closeCalEevent" class="close-btn btn waves-effect waves-light" type="button" name="action">' +
                '<i class="fa fa-times"></i>' +
            '</button>' +
            '<div class="clear"></div>' +
        '</div>' +
    '</div>' +
'</div>';

$(document.body).on('click', '#calendar, #editEventPopover', function (e) {
    e.stopPropagation();
});

$(document.body).on('click', function (e) {
    $('#editEventPopover').remove();
});

$(document.body).on('click', '#addCalEevent', addCalEvent);
$(document.body).on('click', '#editCalEvent', editCalEvent);
$(document.body).on('click', '#delCalEvent', delCalEvent);
$(document.body).on('click', '#closeCalEevent, #editEventPopover .fa-close', function () {
    $('#editEventPopover').remove();
});

$(document.body).on('click', function (e) {
    $('#editEventPopover').remove();
});

function addCalEvent (e) {
    var newCalEvent = {
        title: $('#EventTitle').val(),
        start: moment.utc($('#EventDate').text() + 'T' + $('#EventTime').val() + ':00'),
    };

    $('#editEventPopover').remove();
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/add-event',
        method: 'POST',
        data: JSON.stringify(newCalEvent),
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            if (true === Data.Success) {
                newCalEvent._id = Data.Data;
                $('#calendar').fullCalendar('renderEvent', newCalEvent, true);
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
                buildAgenda();
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
        }
    )
}

function editCalEvent (e) {
    editedEvent.title = $('#EventTitle').val();
    editedEvent.start = moment.utc($('#EventDate').text() + 'T' + $('#EventTime').val() + ':00');
    // $('#calendar').fullCalendar('updateEvent', editedEvent);
    $('#editEventPopover').remove();

    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/edit-event',
        method: 'POST',
        data: JSON.stringify(editedEvent),
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            if (true === Data.Success) {
                // $('#calendar').fullCalendar('updateEvent', editedEvent); // not good - this modifying our id
                $('#calendar').fullCalendar('removeEvents', function (calEvent) {
                    return editedEvent._id === calEvent._id;
                });
                $('#calendar').fullCalendar('renderEvent', editedEvent, true);
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
                buildAgenda();
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
        }
    )
}

function delCalEvent (e) {
    $('#editEventPopover').remove();
    $.ajax({
        url: location.hash.replace(/^\#\//, '') + '/remove-event',
        method: 'POST',
        data: JSON.stringify({_id: editedEvent._id}),
        contentType: 'application/json; charset=utf-8',
        dataType: 'JSON'
    }).then(
        function (Data) {
            if (true === Data.Success) {
                $('#calendar').fullCalendar('removeEvents', function (calEvent) {
                    return editedEvent._id === calEvent._id;
                });
                $('#calendar').fullCalendar( 'rerenderEvents' );
                Materialize.toast(trans.changesSavedSuccessfuly, 2000);
                buildAgenda();
            } else {
                Materialize.toast(trans.anErrorOccured, 2000);
            }
        }
    )
}

function calendarPageCallback () {
    $('#calendar').fullCalendar(
        {
            locale: locale,
            events: calendarEvents,
            dayClick: function(date, e, view) {
                if (true !== canEditCalendar) {
                    return;
                }

                $('#editEventPopover').remove();
                var popover = $(addEditEventHtml).appendTo('body').css({
                    position: 'absolute',
                    top: (e.clientY + window.scrollY) - 50,
                    left: (e.clientX + window.scrollX) - 75,
                    width: '230px'
                });
                
                popover.find('.hidable').hide();
                popover.find('#addCalEevent').show();
                popover.find('.title .label').text(trans.createEventOn);
                $('#EventDate').text(date.format('YYYY-MM-DD'));
                initPickTime();
            },
            eventClick: function(calEvent, e, view) {
                if (true !== canEditCalendar) {
                    return;
                }

                editedEvent = {
                    _id: calEvent._id,
                    title: calEvent.title,
                    start: calEvent.start
                };
                $('#editEventPopover').remove();
                var popover = $(addEditEventHtml).appendTo('body').css({
                    position: 'absolute',
                    top: (e.clientY + window.scrollY) - 50,
                    left: (e.clientX + window.scrollX) - 75,
                    width: '230px'
                });
                
                popover.find('.hidable').hide();
                popover.find('#editCalEvent, #delCalEvent').show();
                popover.find('.title .label').text(trans.editEventOn);
                $('#EventDate').text(calEvent.start.format('YYYY-MM-DD'));
                $('#EventTitle').val(calEvent.title);
                $('#EventTime').val(calEvent.start.format('HH:mm'));
                initPickTime();
            }
        }
    );
    buildAgenda();
}

function buildAgenda () {
    var hasAgenda = false;
    $('.calendar_page .agenda .day_seperator, .calendar_page .agenda .single_event').remove();
    var today = moment().utc();
    var fiveDaysFromNow = moment().utc().add(5, 'day');
    currentDate = null;
    currentDateLabel = null;
    var allEvents = $('#calendar').fullCalendar('clientEvents').sort(
        function (a, b) {
            return a.start - b.start;
        }
    );
    for (var e in allEvents) {
        if (-1 === ['length', 'name'].indexOf(e)) {
            var calEvent = allEvents[e];
            if (calEvent.start < today) continue;

            if (fiveDaysFromNow < calEvent.start) {
                break;
            }

            if (false === hasAgenda) {
                $('.calendar_page .no_agenda').addClass('hide');
                hasAgenda = true;
            }

            var eventDate = calEvent.start.format('YYYY-MM-DD');
            var eventDateLabel = eventDate === moment().utc().format('YYYY-MM-DD') ? trans.today : eventDate;


            if (eventDateLabel !== currentDateLabel) {
                $('.calendar_page .agenda .card-content').append('<div class="day_seperator">' + eventDateLabel + '</div>');
            }
            currentDate = eventDate;
            currentDateLabel = eventDateLabel;

            $('.calendar_page .agenda .card-content').append('<div class="single_event">' + 
            '<span class="time">' + calEvent.start.format('HH:mm') + '</span> ' +
            escapeHtml(calEvent.title) + 
            '</div>');
        }
    }
    
}

function initPickTime () {
    $('#EventTime').pickatime({
        default: 'now', // Set default time: 'now', '1:30AM', '16:30'
        fromnow: 0,       // set default time to * milliseconds from now (using with default = 'now')
        twelvehour: false, // Use AM/PM or 24-hour format
        donetext: trans.ok, // text for done-button
        cleartext: trans.clear, // text for clear-button
        canceltext: trans.cancel, // Text for cancel-button
        autoclose: false, // automatic close timepicker
        ampmclickable: true, // make AM PM clickable
        timeFormat: 'H(:mm)', // make 24 hours time
        aftershow: function(){} //Function for after opening timepicker
    });
}