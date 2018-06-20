const React = require('react');
const { observer } = require('mobx-react');
const T = require('~/ui/shared-components/T');

const AvatarWithPopup = require('~/ui/contact/components/AvatarWithPopup');
const EmojiImage = require('~/ui/emoji/Image');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class PendingDMHeader extends React.Component {
    render() {
        const c = this.props.contact;
        return (
            <div className="pending-dm-header">
                <EmojiImage emoji="tada" size="large" />

                <T className="main-text"
                    k={this.props.isNewUser
                        ? 'title_newUserDmInviteHeading'
                        : 'title_dmInviteHeading'
                    }
                >
                    {{ contactName: c.fullName }}
                </T>

                <div className="user-profile-container">
                    <AvatarWithPopup contact={c} size="large" />
                    <div className="username">@{c.username}</div>
                </div>

                <IdentityVerificationNotice />
            </div>
        );
    }
}

module.exports = PendingDMHeader;
