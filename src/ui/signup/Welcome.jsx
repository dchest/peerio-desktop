const React = require('react');
const { Component } = require('react');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');


@observer class Welcome extends Component {
    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.props.returnHandler();
        }
    };

    render() {
        return (
            <div className="welcome-content">
                <div className="welcome-heading">
                    <div className="display-1">{t('title_welcomeHeading')}</div>
                    {/* Welcome to Peerio! */}
                    <div className="title">{t('title_welcomeSubHeading')}</div>
                    {/* Your private and secure collaboration platform */}
                </div>
                <div className="private-container">
                    <div className="private">
                        <div className="title">{t('title_welcomePrivate')}</div>
                        {/* Private */}
                        <p>{t('title_welcomePrivateContent')}</p>
                        {/* Peerio’s end-to-end encryption keeps your data safe from breaches. */}
                    </div>
                    <div className="safe">
                        <div className="title">{t('title_welcomeSafe')}</div>
                        {/* Safe */}
                        <p>{t('title_welcomeSafeContent')}</p>
                        {/* Only you can access your account. Your data is safe and secure 24/7. */}
                    </div>
                    <div className="fast">
                        <div className="title">{t('title_welcomeFast')}</div>
                        {/* Fast */}
                        <p>{t('title_welcomeFastContent')}</p>
                        {/* So fast, you’ll forget that everything is always encrypted. */}
                    </div>
                </div>
                {/* <Dropdown value={languageStore.language}
                    options={languageStore.translationLangsDataSource} onChange={languageStore.changeLanguage} />
                */}
            </div>
        );
    }
}

module.exports = Welcome;
