const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { Button, Dialog, Switch } = require('peer-ui');
const { t } = require('peerio-translator');
const { User } = require('peerio-icebear');
const T = require('~/ui/shared-components/T');
const urls = require('~/config').translator.urlMap;
const config = require('~/config');

@observer
class Account extends React.Component {
    @observable deleteAccountDialogActive = false;

    onPromoSubscriptionChanged = (ev) => {
        User.current.settings.subscribeToPromoEmails = ev.target.checked;
        User.current.saveSettings();
    }

    onErrorTrackingChanged = (ev) => {
        User.current.settings.errorTracking = ev.target.checked;
        User.current.saveSettings();
    }

    onDataCollectionChanged = (ev) => {
        User.current.settings.dataCollection = ev.target.checked;
        User.current.saveSettings();
    }

    showConfirmDelete = () => {
        this.deleteAccountDialogActive = true;
    }

    hideConfirmDelete = () => {
        this.deleteAccountDialogActive = false;
    }


    onDeleteConfirmed = () => {
        User.current.deleteAccount(User.current.username);
        this.deleteAccountDialogActive = false;
    }

    toUpgrade() {
        return window.open(urls.upgrade);
    }

    render() {
        const dialogActions = [
            { label: t('button_cancel'), onClick: this.hideConfirmDelete },
            { label: t('button_confirm'), onClick: this.onDeleteConfirmed }
        ];
        return (
            <div className="settings-container-account">
                {config.disablePayments || User.current.hasActivePlans ? null
                    : <section className="upgrade-message-container">
                        <div className="message">{t('title_upgradeMessage')}</div>
                        <Button label={t('button_upgrade')}
                            onClick={this.toUpgrade}
                        />
                    </section>
                }
                <section className="section-divider">
                    <div className="title">{t('title_promoConsentRequestTitle')}</div>
                    <Switch checked={User.current.settings.subscribeToPromoEmails}
                        label={t('title_promoConsent')}
                        onChange={this.onPromoSubscriptionChanged} />
                </section>
                <section>
                    <div className="title">{t('title_dataPreferences')}</div>
                    <p>
                        {t('title_dataDetail')}
                    </p>
                    <Switch checked={User.current.settings.errorTracking}
                        label={t('title_errorTrackingMessage')}
                        onChange={this.onErrorTrackingChanged} />
                    <Switch checked={User.current.settings.dataCollection}
                        label={t('title_dataCollectionMessage')}
                        onChange={this.onDataCollectionChanged} />
                </section>
                <section className="delete-account">
                    <Button label={t('button_accountDelete')} onClick={this.showConfirmDelete} />
                </section>
                <Dialog active={this.deleteAccountDialogActive} actions={dialogActions}
                    onCancel={this.hideConfirmDelete} title={t('title_accountDelete')}>
                    <T k="title_accountDeleteDescription1" tag="p" /><br />
                    <T k="title_accountDeleteDescription2" tag="p" /><br />
                    <T k="title_accountDeleteDescription3" tag="p" />
                </Dialog>
            </div>
        );
    }
}

module.exports = Account;
