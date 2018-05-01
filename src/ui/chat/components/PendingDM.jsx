const React = require('react');

const { computed, observable } = require('mobx');
const { observer } = require('mobx-react');

const { contactStore } = require('peerio-icebear');
const T = require('~/ui/shared-components/T');

const { Avatar, Button } = require('~/peer-ui');
const EmojiImage = require('~/ui/emoji/Image');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class PendingDM extends React.Component {
    // Testing vars
    activePendingDMUsername = 'ltest1';

    // Contact object for the target user
    @computed get targetContact() {
        return contactStore.getContact(this.activePendingDMUsername);
    }

    // Did you attempt to invite an existing user, or is this a new user?
    // Behaviour is the same but the text is slightly different
    @observable isNewUser = true;

    onDismiss = () => {
        console.log('on dismiss');
    }

    onMessage = () => {
        console.log('on message');
    }

    render() {
        const c = this.targetContact;

        return (
            <div className="pending-dm">
                <div className="content">
                    <EmojiImage emoji="tada" size="large" />

                    <T className="main-text"
                        k={this.isNewUser
                            ? 'title_acceptedInvitationText'
                            : 'title_addedToContactsText'
                        }
                    >
                        {{ fullName: c.fullName }}
                    </T>

                    <div className="user-profile-container">
                        <Avatar username={c.username} size="large" clickable />
                        <div className="username">@{c.username}</div>
                    </div>

                    <IdentityVerificationNotice />

                    <div className="button-container">
                        <Button onClick={this.onDismiss}>
                            <T k="button_dismiss" />
                        </Button>
                        <Button onClick={this.onMessage} theme="affirmative">
                            <T k="button_message" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = PendingDM;

// "title_acceptedInvitationText": "Good news! {fullName} just joined Peerio.",
// "title_addedToContactsText": "Hello! {fullName} has added you to the Contact list.",
// "title_blankChatScreen": "You can start a Direct Message with your contacts using the <plusIcon>+</> button",
