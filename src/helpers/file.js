const electron = require('electron').remote;
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const sanitize = require('sanitize-filename');
const { t } = require('peerio-translator');


function requestDownloadPath(fileName) {
    return new Promise((resolve, reject) => {
        let p = sanitize(fileName, { replacement: '_' });
        try {
            const downloadsDir = electron.app.getPath('downloads');
            p = `${downloadsDir}/${p}`;
        } catch (err) {
            console.log(err);
        }

        let filters;
        let ext = path.extname(path.basename(p));
        // On Windows, set up "Save as type" filters if the file has an extension.
        if (process.platform === 'win32' && ext.length > 1) {
            ext = ext.substring(1); // strip dot
            filters = [
                {
                    name: t('dialog_fileTypeForExtension', { extension: ext.toUpperCase() }), // '{extension} File'
                    extensions: [ext]
                },
                {
                    name: t('dialog_fileTypeAllFiles'), // 'All Files'
                    extensions: ['*']
                }
            ];
        }

        const win = electron.getCurrentWindow();
        electron.dialog.showSaveDialog(
            win,
            {
                defaultPath: p,
                filters
            },
            fileSavePath => {
                if (fileSavePath) resolve(fileSavePath);
                else reject(new Error('User cancelled save dialog.'));
            });
    });
}

// todo: do this in a mobx reaction
function downloadFile(file) {
    let finalPath;
    return requestDownloadPath(file.name)
        .then(p => {
            finalPath = p;
            return file.download(p);
        }) // todo: file.cached is a temporary hack
        .then(() => file.cached && electron.app.dock && electron.app.dock.downloadFinished(finalPath))
        .then(() => file.cached && electron.shell.showItemInFolder(finalPath));
}

function pickLocalFiles() {
    return new Promise(resolve => {
        const win = electron.getCurrentWindow();
        electron.dialog.showOpenDialog(win, {
            properties: ['openFile', 'multiSelections']
        }, resolve);
    });
}

/**
 * @typedef {Object} getListFilesResult
 * @property {Array<string>} success - list of recognized files
 * @property {Array<string>} error - list of paths failed to read
 * @property {Array<string>} restricted - list of paths refused to read (not supported, like .app on mac)
 */
/**
 * Takes an array of file/folder paths,
 * returns an array of passed files and all files in passed folders recursively
 * @param {Array<string>} mixed files/folders paths
 * @returns {getListFilesResult}
 */
function getListOfFiles(paths) {
    // console.debug(paths);
    const ret = {
        success: [], error: [], restricted: []
    };
    ret.successBytes = 0;
    paths.forEach(p => {
        try {
            const stat = fs.lstatSync(p);
            if (stat.isFile()) {
                ret.success.push(p);
                ret.successBytes += stat.size;
                return;
            }
            if (stat.isDirectory()) {
                if (process.platform === 'darwin' && p.substr(-4).toLowerCase() === '.app') {
                    ret.restricted.push(p);
                    return;
                }
                // going into recursion
                const namesInDir = fs.readdirSync(p);
                for (let i = 0; i < namesInDir.length; i++) namesInDir[i] = path.join(p, namesInDir[i]);
                const nested = getListOfFiles(namesInDir);
                ret.success.push(...nested.success);
                ret.error.push(...nested.error);
                ret.restricted.push(...nested.restricted);
                ret.successBytes += nested.successBytes;
                return;
            }
            ret.error.push(p);
        } catch (err) {
            ret.error.push(p);
            console.error(err);
        }
    });
    ret.success = _.uniq(ret.success);
    ret.error = _.uniq(ret.error);
    ret.restricted = _.uniq(ret.restricted);
    return ret;
}

module.exports = { downloadFile, pickLocalFiles, getListOfFiles };
