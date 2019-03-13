var TreeEditNode = '<li class="edit"><a href="#"><input type="text" class="job_title" placeholder="'+ trans.position +'" /><input type="text" class="name" placeholder="'+trans.employee+'" /><i class="fa fa-trash"></i><i class="fa fa-arrow-left"></i><i class="fa fa-arrow-down"></i><i class="fa fa-arrow-right"></i></a></li>';
var TreeViewNode = '<li><a href="#"><div class="person_content"><div class="details"><span type="text" class="job_title"></span><span type="text" class="name"></span></div></div></a></li>';
var EmployeesObj = {};

$(document).on('click', '.tree a', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (-1 === location.hash.indexOf('/edit')) {
        location.href = $(this).attr('href');
    }
})
$(document).on('click', '.tree li a .fa-trash', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).closest('li').eq(0).remove();
    if (0 === $('.tree ul li').length) {
        $(TreeEditNode).appendTo($('.tree ul').eq(0));
        initSelectize();
    }
});
$(document).on('click', '.tree li a .fa-arrow-right', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).closest('li').eq(0).after(TreeEditNode);
    initSelectize();
});
$(document).on('click', '.tree li a .fa-arrow-left', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).closest('li').eq(0).before(TreeEditNode);
    initSelectize();
});
$(document).on('click', '.tree li a .fa-arrow-down', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).closest('li').eq(0).append('<ul>' + TreeEditNode + '</ul>');
    initSelectize();
});

$('body').on('click', '#SaveTree', function () {
    var employeesJson = getEmployees();

    $.ajax({
        method: 'POST',
        dataType: 'JSON',
        url: location.hash.replace(/^\#\//, ''),
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ Data: employeesJson }),
        success: function(Data) {
            Materialize.toast(trans.changesSavedSuccessfuly, 2000);
        }
    })
});

function getEmployees(ul,result) {
    if(!ul) {
        ul = $('.tree ul').eq(0);
    }

    result  = [];
    var li  = ul.find('> li');

    li.each(function () {
        var a   = $(this).find('a');
        var ul  = $(this).find('ul').eq(0);
        var currEmployee = {
            'job_title':    a.find('.job_title').val(),
            'name':         a.find('.name').val()
        };

        if(ul.length) {
            currEmployee.childs = getEmployees(ul,result);
            result.push(currEmployee);
            return result;
        }
        else {
            result.push(currEmployee);
        }
    });

    return result;
}

function initSelectize () {
    $('input.name').selectize({
        valueField: '_id',
        labelField: 'FirstName',
        searchField: ['FirstName', 'LastName'],
        maxItems: 1,
        render: {
            option: function(item, escape) {
                return '<div>'+
                    '<div class="thumb"><img src="' + item.Thumb + '" /></div>' +
                    '<div class="name">' + item.FirstName + ' ' + item.LastName + '</div>' +
                '</div>';
            }
        },
        options : employees
    });
}

function prepareEmployees () {
    for (var e in employees) {
        var employee = employees[e];
        EmployeesObj[employee._id] = {
            Name: employee.FirstName + ' ' + employee.LastName,
            Thumb: employee.Thumb
        }
    }
}

function treePageCallback () {
    var editMode = -1 < location.hash.indexOf('/edit') ? true : false;
    var nodeToAppend = (editMode ? TreeEditNode : TreeViewNode);
    prepareEmployees();

    if ((!emplyeeData.length || (1 === emplyeeData.length && !emplyeeData[0].job_title && !emplyeeData[0].name)) && false === editMode) {
        $('.tree_page .tree_container').addClass('hide');
        $('.tree_page .no_results').removeClass('hide');

        return;
    }

    function drawEmployees(obj, ul) {
        if(!ul) {
            ul = $('.tree ul').eq(0);
        }

        for (var k in obj) {
            var employee = obj[k];
            var appendedEmployee = $(nodeToAppend).appendTo(ul);
            if (true === editMode) {
                $(appendedEmployee).find('.job_title').val(employee.job_title);
                $(appendedEmployee).find('.name').val(employee.name);
            } else {
                $(appendedEmployee).find('.job_title').text(employee.job_title);
                $(appendedEmployee).find('.name').text(EmployeesObj[employee.name] ? EmployeesObj[employee.name].Name : '-');
                $(appendedEmployee).find('a').attr('href', '#/employees/' + employee.name);
                if (EmployeesObj[employee.name] && EmployeesObj[employee.name].Thumb) {
                    var $a = $(appendedEmployee).find('a .person_content');
                    $('<div class="thumb"><img src="' + EmployeesObj[employee.name].Thumb + '" /></div>').prependTo($a);
                }
            }

            if (employee.childs) {
                var newUl = $('<ul></ul>').appendTo(appendedEmployee);
                drawEmployees(employee.childs, newUl);
            }
        }
    }

    if (window.emplyeeData.length) {
        drawEmployees(window.emplyeeData);
    } else {
        $(nodeToAppend).appendTo($('.tree ul').eq(0));
    }

    if (editMode) {
        $('.tree_page .save_section').removeClass('hide');
        setTimeout(initSelectize, 10);
    }
}