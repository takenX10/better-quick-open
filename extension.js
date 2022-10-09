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
            type: f.type
        }
        if(f.type == "directory"){
            let transformed = transformToArray(f.children, `${path}${f.name}/`);
            Object.keys(transformed).forEach((k)=>{
                if (k != "label" && k != "current"){
                    newArray[f.name][k] = transformed[k];
                }
            });
        }
    }
    return newArray;
}

async function parseFiles(){
    const directory = vscode.workspace.rootPath || "/";
    let folders = [];
    const tempfiles = dirTree(directory, {attributes:["type"]});
    console.log(tempfiles);
    let files = {
        "/":transformToArray(tempfiles.children, "/")
    }
    Object.keys(files["/"]).forEach((k)=>{
        if(k != "label" && k != "description"){
            folders.push({
                label: files["/"][k].label,
                description: files["/"][k].description,
                type: files["/"][k].type
            })
        }
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
    //mypick.items = folders;
});


function activate(context) {
    let disposable = vscode.commands.registerCommand( 'better-quick-open.quickopen', async function () {
        mypick.items = folders;
        mypick.show();
    });
    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}