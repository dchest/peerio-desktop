const React = require('react');
const { Component } = require('react');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');
const { Dialog } = require('~/peer-ui');
const updaterStore = require('~/stores/updater-store');

@observer class ReadyToInstallUpdateDialog extends Component {
    handleOK() {
        updaterStore.quitAndInstall();
    }
    render() {
        return (
            <Dialog
                className="dialog-ready-to-install"
                active={updaterStore.readyToInstall}
                actions={[
                    { label: t('button_ok'), onClick: this.handleOK }
                ]}>
                <T k="title_updateWillRestart" />
            </Dialog>
        );
    }
}


module.exports = ReadyToInstallUpdateDialog;
