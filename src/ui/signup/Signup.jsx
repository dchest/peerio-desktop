const React = require('react');
const { Button, Dialog } = require('peer-ui');
const { User, errors } = require('peerio-icebear');
const { observable, computed } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const css = require('classnames');
const languageStore = require('~/stores/language-store');
const FullCoverLoader = require('~/ui/shared-components/FullCoverLoader');
const { Profile, ProfileStore } = require('./Profile');
const SignupProgress = require('./SignupProgress');
const AccountKey = require('./AccountKey');
const Welcome = require('./Welcome');
const AvatarDialog = require('./AvatarDialog');
const autologin = require('~/helpers/autologin');
const T = require('~/ui/shared-components/T');
const ConfirmKey = require('~/ui/signup/ConfirmKey');
const TermsDialog = require('./TermsDialog');
const config = require('~/config');

@observer class Signup extends React.Component {
    @observable busy = false;
    @observable show = false; // starts show animation
    @observable step = 0;
    @observable errorVisible = false;
    @observable errorMessage = undefined;

    steps = [
        () => <Welcome returnHandler={this.advance} />,
        () => <Profile store={this.profileStore} returnHandler={this.advance} />,
        () => <AccountKey store={this.profileStore} returnHandler={this.advance} />,
        () => <ConfirmKey store={this.profileStore} returnHandler={this.advance} />
    ];

    titles = [
        t('title_hello'),
        t('title_signup'),
        t('title_AccountKey'),
        t('title_AccountKey')
    ];

    get title() { return this.titles[this.step]; }

    @observable profileStore = new ProfileStore();

    handleSaveAvatar = (buffers, blobs) => {
        this.profileStore.avatarBuffers = buffers;
        const [blob] = blobs;
        const reader = new FileReader();
        reader.onload = () => {
            this.profileStore.temporaryAvatarDataUrl = reader.result;
        };
        reader.readAsDataURL(blob);
    }

    @computed get hasErrors() {
        return this.step === 1 ? this.profileStore.hasErrors : false;
    }

    @computed get readyToSignup() {
        return !this.profileStore.hasErrors && (this.profileStore.keyBackedUp || this.profileStore.confirmedKeyBackup);
    }

    componentWillMount() {
        this.profileStore.rerollPassphrase();
    }

    componentDidMount() {
        this.show = true;
    }

    createAccount = () => {
        if (this.busy) return Promise.resolve(false);
        this.hideError();
        this.busy = true;
        const u = new User();
        u.username = this.profileStore.username;
        u.email = this.profileStore.email;
        u.firstName = this.profileStore.firstName;
        u.lastName = this.profileStore.lastName;
        u.locale = languageStore.language;
        u.passphrase = this.profileStore.passphrase;

        // DEV MODE ONLY
        if (config.devAutologin && config.devAutologin.signupPassphraseOverride) {
            u.passphrase = config.devAutologin.signupPassphraseOverride;
        }

        User.current = u;
        return u.createAccountAndLogin()
            .then(() => {
                this.busy = false;
                autologin.enable();
                autologin.dontSuggestEnablingAgain();
                window.router.push('/app/onboarding');
            })
            .catch(err => {
                User.current = null;
                this.busy = false;
                this.errorVisible = true;
                // todo: error message will not be localized, maybe don't use it at all
                this.errorMessage = `${t('error_signupServerError')} ${errors.normalize(err).message}`;
            })
            .then(async () => {
                const { avatarBuffers, keyBackedUp } = this.profileStore;
                keyBackedUp && await User.current.setAccountKeyBackedUp();
                avatarBuffers && await User.current.saveAvatar(avatarBuffers);
            });
    }

    navigateToLogin = () => {
        window.router.push('/');
    };

    navigateToAccountKey = () => {
        if (this.profileStore.hasErrors || this.busy) return;
        this.step = 2;
        this.busy = false;
    };

    navigateToProfile = () => {
        this.step = 1;
        this.busy = false;
        this.errorVisible = false;
    };

    advance = () => {
        if (this.step === 0) {
            this.step = 1;
        } else if (this.step === 1) {
            this.navigateToAccountKey();
        } else if (this.step === 2 && !this.profileStore.keyBackedUp) {
            this.step = 3;
        } else {
            this.readyToSignup && this.createAccount();
        }
    };

    retreat = () => {
        if (this.step === 0 || this.step === 1) {
            this.navigateToLogin();
        } else if (this.step === 2) {
            this.navigateToProfile();
        } else {
            this.step = 2;
        }
    };

    hideError = () => {
        this.errorVisible = false;
    };

    get signupNav() {
        const { step, steps } = this;
        const isLastStep = step === steps.length - 1;

        if (this.step === 0) {
            return (
                <Button
                    label={t('button_getStarted')}
                    onClick={this.advance}
                    theme="affirmative"
                />
            );
        }

        return (
            <div className="signup-nav">
                <Button
                    label={this.step === 1 ? t('button_cancel') : t('button_back')}
                    onClick={this.retreat}
                    theme="secondary"
                />
                <Button
                    label={isLastStep ? t('button_finish') : t('button_next')}
                    onClick={this.advance}
                    disabled={isLastStep ? !this.readyToSignup : this.hasErrors}
                />
            </div>
        );
    }

    get errorDialog() {
        const errorActions = [
            { label: t('button_cancel'), onClick: this.hideError },
            { label: t('button_retry'), onClick: this.createAccount }
        ];
        return (
            <Dialog actions={errorActions} active={this.errorVisible}
                onCancel={this.hideError}
                title={t('title_error')}>{this.errorMessage}
            </Dialog>
        );
    }

    render() {
        const { step, steps } = this;
        return (
            <div className={css('signup', { show: this.show })}>
                <SignupProgress step={step} count={steps.length - 1} title={this.title} />
                <div className="signup-content-container">
                    <div className={step === 0 || step === 3 ? 'signup-welcome' : 'signup-content'} >
                        {steps[this.step]()}
                        {this.signupNav}
                        {this.errorDialog}
                        {step === 0 ?
                            <T k="title_TOSRequestText" className="terms-smallprint">
                                {{
                                    tosButton: text => (<Button onClick={TermsDialog.showDialog}
                                        label={text}
                                        theme="link" />)
                                }}
                            </T>
                            : null
                        }
                    </div>
                    {step === 0 || step === 1
                        ? <div className="back-to-login">
                            <T k="title_alreadyHaveAccount" />&nbsp;
                            <Button label={t('button_login')} theme="link" onClick={this.retreat} />
                        </div>
                        : null
                    }
                </div>
                <TermsDialog />
                <AvatarDialog onSave={this.handleSaveAvatar} />
                <FullCoverLoader show={this.busy} />
            </div>
        );
    }
}

module.exports = Signup;
