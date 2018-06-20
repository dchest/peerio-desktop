const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { Button, Dialog } = require('peer-ui');
const { t } = require('peerio-translator');
const version = require('electron').remote.app.getVersion();
const Terms = require('~/ui/shared-components/Terms');
const { socket } = require('peerio-icebear');

const Copyright = require('~/whitelabel/components/Copyright');
const PoweredBySettings = require('~/whitelabel/components/PoweredBySettings');

@observer
class About extends React.Component {
    @observable termsDialogOpen = false;

    hideTermsDialog = () => {
        this.termsDialogOpen = false;
    };

    showTermsDialog = () => {
        this.termsDialogOpen = true;
    };

    render() {
        const termsDialogActions = [
            { label: t('button_ok'), onClick: this.hideTermsDialog }
        ];
        return (
            <div>
                <section className="section-divider">
                    <img className="logo" src="static/img/logo-withtext.svg" />
                    <PoweredBySettings />
                    <p>
                        {t('title_version')} <strong>{version}</strong>
                    </p>
                    <p>
                        {t('title_networkLatency')} <strong>{socket.latency}ms</strong>
                    </p>

                </section>
                <section>
                    <Copyright />
                    <div className="settings-terms">
                        {t('title_appName')}
                        <Button
                            onClick={this.showTermsDialog}
                            label={t('button_terms')}
                            theme="link"
                        />
                    </div>
                </section>

                <Dialog active={this.termsDialogOpen}
                    actions={termsDialogActions}
                    onCancel={this.hideTermsDialog}
                    className="terms-container">
                    <Terms />
                </Dialog>
            </div>
        );
    }
}

module.exports = About;
