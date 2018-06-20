const React = require('react');
const { Component } = require('react');
const { MaterialIcon } = require('peer-ui');
const { observer } = require('mobx-react');
const AvatarDialog = require('./AvatarDialog');
const { t } = require('peerio-translator');

@observer class AvatarControl extends Component {
    getInstructions() {
        return (
            <div className="avatar-instructions">
                <MaterialIcon icon="add" />
                <p>{t('title_avatarInstructions')}</p>
                <p className="caption">{t('title_optional')}</p>
            </div>
        );
    }
    render() {
        const { url } = this.props;
        return (
            <div className="avatar-input" onClick={AvatarDialog.showDialog}>
                {url ? <img src={url} /> : this.getInstructions() }
            </div>
        );
    }
}

module.exports = AvatarControl;
