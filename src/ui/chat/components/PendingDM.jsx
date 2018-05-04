const React = require('react');
const { observer } = require('mobx-react');

const routerStore = require('~/stores/router-store');
const { chatStore } = require('peerio-icebear');
const T = require('~/ui/shared-components/T');

const { Avatar, Button } = require('~/peer-ui');
const EmojiImage = require('~/ui/emoji/Image');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class PendingDM extends React.Component {
    onDismiss() {
        routerStore.navigateTo(routerStore.ROUTES.pendingDMDismissed);
        chatStore.activeChat.dismiss();
    }

    onMessage = () => {
        chatStore.activeChat.start();
        this.props.onMessage();
    }

    render() {
        if (!chatStore.activeChat) return null;
        const c = chatStore.activeChat.contact || chatStore.activeChat.otherParticipants[0];
        if (!c) return null;

        return (
            <div className="pending-dm">
                <EmojiImage emoji="tada" size="large" />

                <T className="main-text"
                    k={chatStore.activeChat.isReceived
                        ? 'title_newUserDmInviteHeading'
                        : 'title_dmInviteHeading'
                    }
                >
                    {{ contactName: c.fullName }}
                </T>

                <div className="user-profile-container">
                    <Avatar username={c.username} size="large" clickable />
                    <div className="username">@{c.username}</div>
                </div>

                <IdentityVerificationNotice />

                {!this.props.buttonsHidden &&
                    <div className="button-container">
                        <Button onClick={this.onDismiss}>
                            <T k="button_dismiss" />
                        </Button>
                        <Button onClick={this.onMessage} theme="affirmative">
                            <T k="button_message" />
                        </Button>
                    </div>
                }
            </div>
        );
    }
}

module.exports = PendingDM;
