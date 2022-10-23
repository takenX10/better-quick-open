# better-quick-open

A simple vscode extension to replace `quick open` from vscode, to add routing and folders inside the results

## Features

- Open folders with `enter` or write the name with a trailing slash (e.g. `foldername/`) and it will automatically enter that folder
- If you search for a file inside a folder, it will search only inside that folder.
- `node_modules` folder is filtered

## Installation

```sh
mkdir ~/.vscode/extensions/takenx10.better-quick-open-0.0.3
cd ~/.vscode/extensions/takenx10.better-quick-open-0.0.3
git clone https://github.com/takenX10/better-quick-open
```

now open vscode, press `ctrl+shift+p` and search for `Preferences: Open Keyboard Shortcut(JSON)`, then add

> `{ "key": "ctrl+p", "command": "better-quick-open.quickopen" },`

## TODOs

- Add language specific icons to files
- Implement a faster way to search for files and folders
- Implement a better way to update the folders tree when a new file gets created

## Requirements

## Known Issues

## Release Notes


