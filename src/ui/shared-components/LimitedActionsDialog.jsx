const React = require('react');
const { observable, action } = require('mobx');
const { observer } = require('mobx-react');

const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');

const { Dialog } = require('peer-ui');

@observer
class LimitedActionsDialog extends React.Component {
    @observable visible = false;

    @action.bound show() {
        this.visible = true;
    }

    @action.bound hide() {
        this.visible = false;
    }

    @action.bound confirmDialog() {
        this.hide();
    }

    render() {
        const dialogActions = [
            { label: t('button_gotIt'), onClick: this.confirmDialog }
        ];

        return (
            <Dialog active={this.visible}
                className="limited-actions-dialog"
                actions={dialogActions}
                onCancel={this.hide}
                title={t('title_limitedActions')}
                theme="small"
            >
                <T k="dialog_limitedActionsContent" className="text" />
            </Dialog>
        );
    }
}

module.exports = LimitedActionsDialog;
