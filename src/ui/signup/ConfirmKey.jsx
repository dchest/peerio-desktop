const React = require('react');
const { Component } = require('react');
const { observable, reaction } = require('mobx');
const { observer } = require('mobx-react');
const { Input } = require('peer-ui');
const { t } = require('peerio-translator');

@observer class ConfirmKey extends Component {
    @observable confirmText = '';
    confirmTextSample = t('title_confirmTextSample');

    componentDidMount() {
        reaction(() => this.confirmText.toLocaleLowerCase() === this.confirmTextSample.toLocaleLowerCase(), v => {
            console.log(true);
            if (v) this.props.store.confirmedKeyBackup = true;
        });
    }

    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.props.returnHandler();
        }
    };

    render() {
        return (
            <div className="confirm-key-container">
                <div className="confirm-key">
                    <div className="safe" />
                    <div className="headline">{t('title_confirmHeadline')}</div>
                    {/* Got your keys? */}
                    <p>{t('title_confirmContent1')}</p>
                    {/* Only you have a copy of your Account Key. */}
                    <p>{t('title_confirmContent2')}</p>
                    {/* If you lose it, we cannot help you access your account. */}
                    <p>{t('title_confirmTextInput', { sample: this.confirmTextSample })}</p>
                    <Input
                        onKeyPress={this.handleKeyPress}
                        value={this.confirmText} label={t('title_confirmTextInputLabel')}
                        onChange={text => { this.confirmText = text; }} />
                </div>
            </div>
        );
    }
}

module.exports = ConfirmKey;
