const React = require('react');
const { Link } = require('react-router');
const { t } = require('peerio-translator');
const { observer } = require('mobx-react');

@observer
class SignupLink extends React.Component {
    render() {
        return (
            <div>
                {t('title_newUser')} &nbsp; <Link to="/signup">{t('button_CreateAccount')}</Link>
            </div>
        );
    }
}

module.exports = SignupLink;
