const React = require('react');
const AppNav = require('~/ui/AppNav');
const uiStore = require('~/stores/ui-store');
const { Dialog, ProgressBar } = require('peer-ui');
const { t } = require('peerio-translator');
const { observer } = require('mobx-react');
const { clientApp } = require('peerio-icebear');
const MigrationDialog = require('~/ui/shared-components/MigrationDialog');

@observer
class App extends React.Component {
    get signatureErrorDialog() {
        const hide = uiStore.hideFileSignatureErrorDialog;
        const dialogActions = [
            { label: t('button_dismiss'), onClick: hide }
        ];
        return (
            <Dialog
                active={uiStore.isFileSignatureErrorDialogActive}
                actions={dialogActions}
                onCancel={hide}
                title={t('title_invalidFileSignature')}
                className="dialog-warning">
                <p>{t('error_invalidFileSignatureLong')}</p>
            </Dialog>
        );
    }

    componentWillMount() {
        uiStore.init();
    }

    render() {
        return (
            <div className="app-root">
                <AppNav />
                {clientApp.updatingAfterReconnect
                    ? <div className="global-update-progress"><ProgressBar type="linear" mode="indeterminate" /></div>
                    : null}

                {this.props.children}
                <MigrationDialog />
                {this.signatureErrorDialog}
            </div>
        );
    }
}

module.exports = App;
