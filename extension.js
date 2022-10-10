const vscode = require('vscode');
const dirTree = require("directory-tree");

const DIRECTORY_TYPE = "directory";
const DIRECTORY_ICON = "$(folder)";
const FILE_TYPE = "file";
const FILE_ICON = "$(file)";
const mypick = vscode.window.createQuickPick();
let currentBasePath = "";
let currentFoldersList = [];
let files = {};
let currentFilesList = [];

function getIcon(type){
    return type == FILE_TYPE ? FILE_ICON: DIRECTORY_ICON;
}

function transformToArray(current, path){
    let newArray = {};
    for(let f of current){
        newArray[f.name] = {
            label: `${getIcon(f.type)} ${f.name}`,
            description: `${path}${f.name}`,
            name: f.name,
            type: f.type
        }
        if(f.type == DIRECTORY_TYPE){
            newArray[f.name]["children"] = transformToArray(f.children, `${path}${f.name}/`);
        }
    }
    return newArray;
}

function sortFiles(currentFiles){
    currentFiles = currentFiles.sort(function(a,b){
        if(a.type == b.type){
            return (a.label > b.label ? -1 : 1);
        }else {
            return (a.type == DIRECTORY_TYPE ? -1 : 1);
        }
    });
    let index = currentFiles.findIndex((v)=>{return v.name == ".."});
    if(index != -1){
        const removed = currentFiles.splice(index, 1);
        currentFiles = [removed[0], ...currentFiles];
    }
    return currentFiles;
}

function getFilesDictFromPath(path){
    path = path.split("/");
    let currentPosition = files;
    for(let p of path){
        if(p != ''){
            currentPosition = currentPosition[p].children;
        }
    }
    return currentPosition;
}

async function makeCurrentFolder(path){
    currentFoldersList = [];
    if(path != ""){
        let current = path.split("/");
        let final = "";
        for(let i=0; i<current.length - 1; i++){
            final += "/"+current[i];
        }
        currentFoldersList.push({
            label: `${DIRECTORY_ICON} ..`,
            description: final,
            type: DIRECTORY_TYPE,
            name: ".."
        });
    }
    const currentDict = getFilesDictFromPath(path);
    Object.keys(currentDict).forEach((k)=>{
        currentFoldersList.push({
            label: currentDict[k].label,
            description: currentDict[k].description,
            type: currentDict[k].type,
            name: currentDict[k].name
        });
    });
    currentFoldersList = sortFiles(currentFoldersList);
}

function searchFile(path, val){
    const regex = new RegExp(`${val}`,"gi");
    const currentDict = getFilesDictFromPath(path);

    let res = [];
    Object.keys(currentDict).forEach((k)=>{
        if (currentDict[k].name.match(regex)){
            res.push({
                label: currentDict[k].label,
                description: currentDict[k].description,
                type: currentDict[k].type,
                name: currentDict[k].name
            });
        }
        if(currentDict[k].type == DIRECTORY_TYPE){
            res = [...res, ...searchFile(`${path}${path != ""?"/":""}${currentDict[k].name}`, val)];
        }
    });
    return res;
}


function activate(context) {
    const directory = (vscode.workspace.rootPath || "/");
    const tempfiles = dirTree(directory, {attributes:["type"]});
    files = transformToArray(tempfiles.children, "");
    let disposable = vscode.commands.registerCommand( 'better-quick-open.quickopen', async function () {
        currentBasePath = "";
        makeCurrentFolder(currentBasePath);
        mypick.items = currentFoldersList;
        mypick.show();
        mypick.onDidChangeValue((val)=>{
            if(val != ""){
                currentFilesList = sortFiles(searchFile(currentBasePath, val));
                mypick.items = currentFilesList;
            }else{
                mypick.items = currentFoldersList;
            }
        });
        mypick.onDidAccept(()=>{
            const current = mypick.activeItems[0];
            console.log(current);
            if(current["type"] == DIRECTORY_TYPE){
                console.log("directory");
                currentBasePath = current["description"];
                makeCurrentFolder(currentBasePath);
                mypick.value = "";
                mypick.items = currentFoldersList;
            }else{

            }
        })
    });
    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}