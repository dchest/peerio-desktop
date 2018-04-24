const { observable } = require('mobx');
const { ipcRenderer } = require('electron');
const { clientApp, warnings } = require('peerio-icebear');

class UpdaterStore {
    /**
     * If true, the last update failed.
     * Set during the launch.
     */
    @observable lastUpdateFailed = false;

    /**
     * If true, update checking is in progress.
     */
    @observable checking = false;

    /**
     * If true, the update is downloading.
     */
    @observable downloading = false;

    /**
     * If true, the update has been downloaded
     * and is ready to install.
     *
     * Not set when retrying the update installation.
     */
    @observable readyToInstall = false;

    /**
     * If true, the update is being installed
     * (including when retrying install).
     */
    @observable installing = false;

    /**
     * Error reason, if any.
     */
    @observable error = null;

    constructor() {
        // Set up event handlers.
        ipcRenderer.on('update-last-failed', (ev, failed) => {
            this.lastUpdateFailed = failed;
        });

        ipcRenderer.on('update-downloaded', () => {
            console.log('Update downloaded');
            this.readyToInstall = true;
        });

        ipcRenderer.on('checking-for-update', () => {
            this.checking = true;
            console.log('Checking for update');
        });

        ipcRenderer.on('update-available', (ev, info) => {
            this.checking = false;
            this.downloading = true;
            console.log('Update available.', info);
            warnings.add('title_updateDownloading');
        });

        ipcRenderer.on('update-not-available', info => {
            this.checking = false;
            console.log('Update not available.', info);
        });

        ipcRenderer.on('update-error', err => {
            this.error = err;
            console.error('Update error:', err);
        });

        // Request to check if last update failed.
        ipcRenderer.send('update-check-last-failed');

        // Force check and install if client is deprecated.
        when(() => clientApp.clientVersionDeprecated, () => {
            this.quitAndRetryInstall();
        });
    }

    cleanup() {
        return new Promise(resolve => {
            ipcRenderer.once('update-cleanup-done', () => { resolve(); });
            ipcRenderer.send('update-cleanup');
        });
    }

    check() {
        ipcRenderer.send('update-check');
    }

    quitAndInstall() {
        if (this.installing) return;
        this.readyToInstall = false;
        this.installing = true;
        ipcRenderer.send('update-install');
    }

    quitAndRetryInstall() {
        if (this.installing) return;
        this.readyToInstall = false;
        this.installing = true;
        ipcRenderer.send('update-retry-install');
    }
}

module.exports = new UpdaterStore();
