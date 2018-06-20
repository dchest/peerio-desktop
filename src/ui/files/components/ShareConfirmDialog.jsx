const React = require('react');
const { observable, action } = require('mobx');
const { observer } = require('mobx-react');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { Checkbox, Dialog } = require('peer-ui');
const uiStore = require('~/stores/ui-store');

@observer
class ShareConfirmDialog extends React.Component {
    @observable shareWarningDisabled = false;

    @action.bound check() {
        if (uiStore.prefs.seenMoveToSharedVolumeWarning) return true;
        this.dialog.showWithoutAnimation();
        return new Promise(resolve => { this.resolve = resolve; });
    }

    @action.bound async cancel() {
        this.dialog.hideWithoutAnimation();
        this.resolve(false);
    }

    @action.bound confirm() {
        this.dialog.setInactive();
        if (this.shareWarningDisabled) {
            uiStore.prefs.seenMoveToSharedVolumeWarning = true;
        }
        this.resolve(true);
    }

    @action.bound toggleShareWarning() {
        this.shareWarningDisabled = !this.shareWarningDisabled;
    }

    dialogRef = ref => { this.dialog = ref; };

    render() {
        const shareConfirmActions = [
            { label: t('button_cancel'), onClick: this.cancel },
            { label: t('button_move'), onClick: this.confirm }
        ];

        return (
            <Dialog
                ref={this.dialogRef}
                actions={shareConfirmActions}
                onCancel={this.cancel}
                title={t('title_moveToSharedFolder')}
                className="move-file-confirm-share">
                <T k="title_moveToSharedFolderDescription" />
                <div className="share-warning-toggle">
                    <Checkbox
                        checked={this.shareWarningDisabled}
                        onChange={this.toggleShareWarning}
                        label={t('title_dontShowMessageAgain')}
                    />
                </div>
            </Dialog>
        );
    }
}

module.exports = ShareConfirmDialog;
