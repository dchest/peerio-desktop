const React = require('react');
const AppNav = require('~/ui/AppNav');
const uiStore = require('~/stores/ui-store');
const { Dialog, ProgressBar } = require('~/react-toolbox');
const { t } = require('peerio-translator');
const ContactProfile = require('~/ui/contact/components/ContactProfile');
const { observer } = require('mobx-react');
const { observable } = require('mobx');
const { clientApp } = require('~/icebear');
const RatingDialog = require('./shared-components/RatingDialog');

@observer
class App extends React.Component {
    // variable for testing only, TODO hook up to sdk
    showRatingDialog = true;

    // for smooth dialog hiding, without this it will render empty dialog while hiding it
    @observable contactDialogHiding = false;
    hideContactDialog = () => {
        this.contactDialogHiding = true;

        setTimeout(() => {
            uiStore.contactDialogUsername = null;
            this.contactDialogHiding = false;
        }, 500);
    };

    @observable ratingDialogHiding = false;
    hideRatingDialog = () => {
        this.ratingDialogHiding = true;
    };

    get signatureErrorDialog() {
        const hide = uiStore.hideFileSignatureErrorDialog;
        const dialogActions = [
            { label: t('button_dismiss'), onClick: hide }
        ];
        return (
            <Dialog
                active={uiStore.isFileSignatureErrorDialogActive}
                actions={dialogActions}
                onOverlayClick={hide}
                onEscKeyDown={hide}
                title={t('title_invalidFileSignature')}
                className="dialog-warning">
                <p>{t('error_invalidFileSignatureLong')}</p>
            </Dialog>
        );
    }

    get ratingDialog() {
        const ratingDialogActions = [
            { label: t('button_notNow'), className: 'button-later', onClick: this.hideRatingDialog },
            { label: t('button_send'), onClick: this.hideRatingDialog }
        ];
        return (
            <Dialog active={!this.ratingDialogHiding}
                actions={ratingDialogActions}
                onOverlayClick={this.hideRatingDialog} onEscKeyDown={this.hideRatingDialog}
                title={t('title_ratingDialogHeading')}
                className="rating-dialog">
                <RatingDialog />
            </Dialog>
        );
    }

    componentWillMount() {
        uiStore.init();
    }

    render() {
        const contactDialogActions = [
            { label: t('button_close'), onClick: this.hideContactDialog }
        ];

        return (
            <div className="app-root">
                <AppNav />
                {clientApp.updatingAfterReconnect
                    ? <div className="global-update-progress"><ProgressBar type="linear" mode="indeterminate" /></div>
                    : null}

                {this.props.children}
                <Dialog active={!this.contactDialogHiding && !!uiStore.contactDialogUsername}
                    actions={contactDialogActions} onOverlayClick={this.hideContactDialog}
                    onEscKeyDown={this.hideContactDialog}
                    title={t('title_settingsProfile')}>
                    {
                        uiStore.contactDialogUsername
                            ? <ContactProfile username={uiStore.contactDialogUsername}
                                onClose={this.hideContactDialog} />
                            : null
                    }
                </Dialog>
                {this.signatureErrorDialog}
                {this.showRatingDialog
                    ? this.ratingDialog
                    : null
                }
            </div>
        );
    }
}

module.exports = App;
