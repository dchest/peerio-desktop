const { observer } = require('mobx-react');
const React = require('react');
const T = require('~/ui/shared-components/T');
const { MaterialIcon } = require('peer-ui');
const css = require('classnames');

@observer
class IdentityVerificationNotice extends React.Component {
    render() {
        return (
            <div className="identity-verification-notice">
                <div className={css('notice-container', { 'extra-margin': this.props.extraMargin })}>
                    <MaterialIcon className="notice-icon" icon="security" />
                    <T className="text-content" k="title_verifyUserIdentity" />
                </div>
            </div>
        );
    }
}

module.exports = IdentityVerificationNotice;
