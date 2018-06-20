const React = require('react');
const { action, observable } = require('mobx');
const { observer } = require('mobx-react');
const { Avatar, Button, Dialog, ProgressBar } = require('peer-ui');
const { contactStore, chatStore } = require('peerio-icebear');
const { t } = require('peerio-translator');
const routerStore = require('~/stores/router-store');
const T = require('~/ui/shared-components/T');

@observer
class ContactProfile extends React.Component {
    startChat = () => {
        chatStore.startChat([this.props.contact]);
        routerStore.navigateTo(routerStore.ROUTES.chats);
        if (this.props.onClose) this.props.onClose();
    };

    removeContact = () => {
        contactStore.removeContact(this.props.contact);
    };

    addContact = () => {
        contactStore.addContact(this.props.contact);
    };

    @observable dialogVisible;
    @action.bound openDialog() { this.dialogVisible = true; }
    @action.bound closeDialog() { this.dialogVisible = false; }

    render() {
        const c = this.props.contact;
        if (!c) return null;

        let content;

        if (c.loading) {
            content = (
                <div className="contact-profile">
                    <div className="row loading">
                        <ProgressBar type="circular" mode="indeterminate" />
                    </div>
                </div>
            );
        } else if (c.notFound) {
            content = (
                <div className="contact-profile">
                    <div className="row notfound">
                        {t('error_usernameNotFound')}
                    </div>
                </div>
            );
        } else {
            const f = c.fingerprint.split('-');
            content = (
                <div className="contact-profile">
                    {c.tofuError
                        ? <div className="contact-error">
                            {t('error_contactFingerprintChangedDetail')}
                        </div>
                        : null}
                    <div className="contact-avatar-info">
                        <Avatar contact={c} size="full" />
                        <div className="account-profile-container">
                            {c.isDeleted ? <T k="title_accountDeleted" className="deleted-account" tag="div" /> : null}
                            <div className="full-name selectable">{c.firstName} {c.lastName}</div>
                            <div className="selectable">{c.usernameTag}</div>
                            <div className="row">
                                <div className="list-title"> {t('title_publicKey')}</div>
                                <div className="monospace selectable">{f[0]} {f[1]} {f[2]}</div>
                                <div className="monospace selectable">{f[3]} {f[4]} {f[5]}</div>
                            </div>
                        </div>
                    </div>
                    <div className="row profile-actions-container">
                        <div className="profile-actions">
                            {c.isDeleted
                                ? null
                                : <Button
                                    tooltip={t('title_haveAChat')}
                                    icon="forum"
                                    onClick={this.startChat}
                                    theme="no-hover"
                                />
                            }
                            {c.isAdded
                                ? <Button icon="star"
                                    tooltip={t('button_removeFavourite')}
                                    onClick={this.removeContact}
                                    theme="no-hover"
                                    className="gold"
                                />
                                : <Button icon="star_outline"
                                    tooltip={t('button_addFavourite')}
                                    onClick={this.addContact}
                                    theme="no-hover"
                                />
                            }
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <Dialog
                active={this.dialogVisible}
                onCancel={this.closeDialog}
                actions={[{ label: t('button_ok'), onClick: () => this.closeDialog() }]}
            >
                {content}
            </Dialog>
        );
    }
}


module.exports = ContactProfile;
