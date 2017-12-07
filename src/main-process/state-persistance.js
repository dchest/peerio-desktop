const { TinyDb } = require('peerio-icebear');

function saveWindowState(state) {
    TinyDb.system.setValue('windowState', state);
}

function getSavedWindowState() {
    return TinyDb.system.getValue('windowState')
        .then(savedState => savedState || {})
        .then(savedState => ({
            x: savedState.x,
            y: savedState.y,
            width: savedState.width || 1024,
            height: savedState.height || 728,
            isMaximized: savedState.isMaximized
        }));
}

module.exports = { saveWindowState, getSavedWindowState };
