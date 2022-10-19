const vscode = require('vscode');
const pathLibrary = require('path');
const dirTree = require("directory-tree");

const DIRECTORY_TYPE = "directory";
const DIRECTORY_ICON = "$(folder)";
const FILE_TYPE = "file";
const FILE_ICON = "$(file)";
let mypick = undefined;
let currentBasePath = "";
let currentFoldersList = [];
let files = {};
let currentFilesList = [];
const filtered_folders = ["node_modules", ".."];
function getIcon(type) {
    return type == FILE_TYPE ? FILE_ICON : DIRECTORY_ICON;
}

function transformToArray(current, path) {
    let newArray = {};
    for (let f of current) {
        newArray[f.name] = {
            label: `${getIcon(f.type)} ${f.name}`,
            description: `${path}${f.name}`,
            name: f.name,
            type: f.type
        }
        if (f.type == DIRECTORY_TYPE && !filtered_folders.includes(f.name)) {
            newArray[f.name]["children"] = transformToArray(f.children, `${path}${f.name}/`);
            newArray[f.name]["children"][".."] = {
                label: `${DIRECTORY_ICON} ..`,
                description: path.substring(0, path.length - 1),
                type: DIRECTORY_TYPE,
                name: ".."
            };

        }
    }
    return newArray;
}

function sortFiles(currentFiles) {
    currentFiles = currentFiles.sort(function (a, b) {
        if (a.type == b.type) {
            return (a.label > b.label ? -1 : 1);
        } else {
            return (a.type == DIRECTORY_TYPE ? -1 : 1);
        }
    });
    let index = currentFiles.findIndex((v) => { return v.name == ".." });
    if (index != -1) {
        const removed = currentFiles.splice(index, 1);
        currentFiles = [removed[0], ...currentFiles];
    }
    return currentFiles;
}

function getFilesDictFromPath(path) {
    path = path.split("/");
    let currentPosition = files;
    for (let p of path) {
        if (p != '') {
            currentPosition = currentPosition[p].children;
        }
    }
    return currentPosition;
}

async function makeCurrentFolder(path) {
    currentFoldersList = [];
    const currentDict = getFilesDictFromPath(path);
    Object.keys(currentDict).forEach((k) => {
        currentFoldersList.push({
            label: currentDict[k].label,
            description: currentDict[k].description,
            type: currentDict[k].type,
            name: currentDict[k].name
        });
    });
    currentFoldersList = sortFiles(currentFoldersList);
}

function searchFile(path, val) {
    const regex = new RegExp(`${val}`, "gi");
    const currentDict = getFilesDictFromPath(path);

    let res = [];
    Object.keys(currentDict).forEach((k) => {
        if (currentDict[k].name.match(regex)) {
            res.push({
                label: currentDict[k].label,
                description: currentDict[k].description,
                type: currentDict[k].type,
                name: currentDict[k].name
            });
        }
        if (currentDict[k].type == DIRECTORY_TYPE && !filtered_folders.includes(currentDict[k].name)) {
            res = [...res, ...searchFile(`${path}${path != "" ? "/" : ""}${currentDict[k].name}`, val)];
        }
    });
    return res;
}


function activate(context) {
    const directory = (vscode.workspace.rootPath || "/");

    function selectedValue(mySelection) {
        const current = (mySelection || mypick.activeItems[0]);
        if (current["type"] == DIRECTORY_TYPE) {
            currentBasePath = current["description"];
            makeCurrentFolder(currentBasePath);
            mypick.value = "";
            mypick.items = currentFoldersList;
        } else {
            const filePath = pathLibrary.join(vscode.workspace.rootPath, current.description);
            const openPath = vscode.Uri.file(filePath);
            mypick.dispose();
            vscode.window.showTextDocument(openPath).then((editor) => { });
        }
    }
    let disposable = vscode.commands.registerCommand('better-quick-open.quickopen', async function () {
        const tempfiles = dirTree(directory, { attributes: ["type"] });
        files = transformToArray(tempfiles.children, "");
        mypick = vscode.window.createQuickPick();
        mypick.ignoreFocusOut = true;
        currentBasePath = "";
        makeCurrentFolder(currentBasePath);
        mypick.items = currentFoldersList;
        mypick.show();
        mypick.onDidChangeValue((val) => {
            if (mypick.value != "") {
                if (val.substring(val.length - 1, val.length) == "/") {
                    mypick.value = mypick.value.substring(0, mypick.value.length - 1);
                    selectedValue(currentFoldersList.find((e) => { return e.name == mypick.value }));
                } else {
                    currentFilesList = sortFiles(searchFile(currentBasePath, mypick.value));
                    mypick.items = currentFilesList;
                }
            } else {
                mypick.items = currentFoldersList;
            }
        });
        mypick.onDidAccept(selectedValue);
    });
    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}