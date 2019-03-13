const TreeRoutes        = require('express').Router();
const Tree              = require('./../models/tree');
const UsersHelper       = require('./../route-helpers/users');
const Lib               = require('./../lib');
const Logger            = require('./../lib/logger');
const parseUserThumb = Lib.Utils.ParseUserThumb;

TreeRoutes.get(
    '/',
    GetTree
);

TreeRoutes.use(Lib.Utils.HasEditPermission('Tree'));

TreeRoutes.get(
    '/edit',
    GetEditTree
);

TreeRoutes.post(
    '/edit',
    PostEditTree
);

// TreeRoutes.get(
//     '/edit',
//     (Request, Response) => {
//         return Response.render('panel/tree', { employeesTree: [{name: 'bar', job_title: 'CTO'}]});
//     }
// )

function GetTree (Request, Response) {
    let companyId = Request.session.User.CompanyID;
    let employees = [];
    let employeesTree = [];

    return Tree.TreeModel.GetTree(companyId).then(
        (TreeData) => {
            employeesTree = TreeData ? TreeData.Data : [];
            employeesTree = Lib.Utils.EscapeScriptTags(employeesTree);
            return UsersHelper.GetUsers({}, companyId, 500);
        }
    ).then(
        (EmployeesData) => {
            employees = Lib.Utils.EscapeScriptTags(
                parseUserThumb(EmployeesData.Users, companyId + '/')
            );
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/tree', { employeesTree: employeesTree, employees: employees });
        }
    )
}

function GetEditTree (Request, Response) {
    let companyId = Request.session.User.CompanyID;
    let employees = [];
    let employeesTree = [];

    Response.locals.EditMode = true;

    return Tree.TreeModel.GetTree(companyId).then(
        (TreeData) => {
            employeesTree = TreeData ? TreeData.Data : [];
            employeesTree = Lib.Utils.EscapeScriptTags(employeesTree);
            return UsersHelper.GetUsers({}, companyId, 500);
        }
    ).then(
        (EmployeesData) => {
            employees = Lib.Utils.EscapeScriptTags(
                parseUserThumb(EmployeesData.Users, companyId + '/')
            );
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.render('panel/tree', { employeesTree: employeesTree, employees: employees });
        }
    )
}

function PostEditTree (Request, Response) {
    let userId = Request.session.User._id;
    let companyId = Request.session.User.CompanyID;
    let treeData = JSON.stringify(Request.body.Data);
    let responseJson = {
        Success: false
    };

    return Tree.TreeModel.SaveTree(companyId, userId, treeData).then(
        (TreeData) => {
            responseJson.Success = true;
        }
    ).catch(
        (Error) => {
            Logger.error(Error);
        }
    ).finally(
        () => {
            return Response.json(responseJson);
        }
    )
}

module.exports = TreeRoutes;
