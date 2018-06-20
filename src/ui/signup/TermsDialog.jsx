const React = require('react');
const { Component } = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { Dialog } = require('peer-ui');
const Terms = require('~/ui/shared-components/Terms');
const { t } = require('peerio-translator');

@observer class TermsDialog extends Component {
    @observable static show = false;

    static hideDialog() {
        TermsDialog.show = false;
    }

    static showDialog() {
        TermsDialog.show = true;
    }

    render() {
        const { hideDialog, show } = TermsDialog;
        const termsDialogActions = [
            { label: t('button_ok'), onClick: hideDialog }
        ];
        return (
            <Dialog active={show}
                actions={termsDialogActions}
                onCancel={hideDialog}
                className="terms-container">
                <Terms />
            </Dialog>
        );
    }
}

module.exports = TermsDialog;
