const React = require('react');
const { Component } = require('react');
const { observer } = require('mobx-react');
const { Button } = require('~/peer-ui');
const { clipboard } = require('electron').remote;
const PDFSaver = require('~/ui/shared-components/PDFSaver');
const AvatarControl = require('./AvatarControl');
const { t } = require('peerio-translator');
const { warnings } = require('peerio-icebear');


@observer class AccountKey extends Component {
    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.props.returnHandler();
        }
    };

    backupAccountKey = () => {
        const { username, email, passphrase } = this.props.store;
        const tplVars = {
            username,
            email,
            key: passphrase
        };

        this.pdfSaver.save(tplVars, `${username}.pdf`);

        // NOTICE: user can press cancel and this flag would still be set to true
        this.props.store.keyBackedUp = true;
    };

    copyPassphrase = () => {
        clipboard.writeText(this.props.store.passphrase);
        warnings.add('title_copied');
    };

    render() {
        const { store: { passphrase, temporaryAvatarDataUrl } } = this.props;
        return (
            <div className="savekey-container">
                <AvatarControl url={temporaryAvatarDataUrl} />
                <p>{t('title_accountKey1')}</p>
                <div className="account-key-wrapper">
                    <div className="label">{t('title_yourAccountKey')}</div>
                    <div className="inner">
                        <div className="account-key" onClick={this.copyPassphrase}>{passphrase}</div>
                        <Button icon="content_copy"
                            tooltip={t('title_copy')}
                            onClick={this.copyPassphrase}
                            theme="no-hover active"
                        />
                    </div>
                </div>
                <p>{t('title_accountKey2')}</p>
                <Button
                    label={t('button_saveAccountKey')}
                    icon="file_download"
                    className="pdf-download"
                    onClick={this.backupAccountKey}
                    theme="primary"
                />
                <PDFSaver ref={ref => { this.pdfSaver = ref; }} template="./AccountKeyBackup.html" />
            </div>
        );
    }
}

module.exports = AccountKey;
