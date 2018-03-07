const path = require('path');
const isDevEnv = require('~/helpers/is-dev-env');
const { app, ipcMain } = require('electron');
const TinyDb = require('peerio-icebear/dist/db/tiny-db');
const autoUpdater = require('@peerio/updater')();

TinyDb.system.getValue('pref_prereleaseUpdatesEnabled')
    .then(enabled => {
        autoUpdater.allowPrerelease = !!enabled;
        console.log(`Prerelease updates are ${autoUpdater.allowPrerelease ? 'enabled' : 'disabled'}`);
    }).catch(err => {
        console.error('Failed to retrieve prerelease update setting from TinyDb', err);
    });

let window;

function sendStatusToWindow(text) {
    console.log(text);
    window.webContents.send('console_log', text);
}

function start(mainWindow) {
    try {
        window = mainWindow;

        autoUpdater.setDownloadsDirectory(path.join(app.getPath('userData'), 'Updates'));

        ipcMain.on('install-update', () => {
            console.log('Client approved update installation.');
            app.releaseSingleInstance();
            autoUpdater.quitAndInstall();
        });
        if (!isDevEnv) {
            setTimeout(() => autoUpdater.checkForUpdates(), 3000);
            setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000);
        } else {
            sendStatusToWindow('Updater did not start because dev build was detected.');
        }
    } catch (ex) {
        sendStatusToWindow('Error starting updater.');
        sendStatusToWindow(JSON.stringify(ex));
    }
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', info => {
    sendStatusToWindow('Update available.');
    sendStatusToWindow(JSON.stringify(info));
    window.webContents.send('warning', 'title_updateDownloading');
});

autoUpdater.on('update-not-available', info => {
    sendStatusToWindow('Update not available.');
    sendStatusToWindow(JSON.stringify(info));
});

autoUpdater.on('error', err => {
    sendStatusToWindow('Error in auto-updater.');
    sendStatusToWindow(err instanceof Error ? err.toString() : JSON.stringify(err));
});

autoUpdater.on('download-progress', progressObj => {
    sendStatusToWindow('Download progress...');
    sendStatusToWindow(JSON.stringify(progressObj));
});

autoUpdater.on('update-downloaded', info => {
    sendStatusToWindow('Update downloaded.');
    sendStatusToWindow(JSON.stringify(info));
    window.webContents.send('update-will-restart');
});

module.exports = { start };
