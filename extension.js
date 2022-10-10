const vscode = require('vscode');
const dirTree = require("directory-tree");

const mypick = vscode.window.createQuickPick();
let folders = [];
let files = {};

function getIcon(type){
    return type == "file" ? "$(file)":"$(folder)";
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
        if(f.type == "directory"){
            newArray[f.name]["children"] = transformToArray(f.children, `${path}${f.name}/`);
        }
    }
    return newArray;
}

async function parseFiles(){
    const directory = vscode.workspace.rootPath || "/";
    let folders = [];
    const tempfiles = dirTree(directory, {attributes:["type"]});
    files = transformToArray(tempfiles.children, "/");
    console.log(files);
    Object.keys(files).forEach((k)=>{
        folders.push({
            label: files[k].label,
            description: files[k].description,
            type: files[k].type
        });
    });
    folders = folders.sort(function(a,b){
        if(a.type == b.type){
            return (a.label > b.label ? -1 : 1);
        }else {
            return (a.type == "directory" ? -1 : 1);
        }
    });
    return folders;
}

parseFiles().then((f)=>{
    folders = f;
});

function searchFile(initialPath, val){
    let path = initialPath == "" ? ["/"] : ["/", ...initialPath.split("/")];
    let currentPosition = files;
    const regex = new RegExp(`${val}`,"gi");
    for(let p of path){
        currentPosition = currentPosition[p];
    }
    let res = [];
    Object.keys(currentPosition).forEach((k)=>{
        if (currentPosition[k].label.match(regex)){
            res.push({
                label: currentPosition[k].label,
                description: currentPosition[k].description,
                type: currentPosition[k].type
            });
        }
        if(currentPosition[k].type == "directory"){
            res = [...res, ...searchFile(`${initialPath}${initialPath != ""?"/":""}${currentPosition[k].label}`, val)];
        }
    });
    return res;
}


function activate(context) {
    let disposable = vscode.commands.registerCommand( 'better-quick-open.quickopen', async function () {
        mypick.items = folders;
        mypick.show();
        mypick.onDidChangeValue((val)=>{
            let res = searchFile("",val);
            console.log(res);
        });
    });
    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}