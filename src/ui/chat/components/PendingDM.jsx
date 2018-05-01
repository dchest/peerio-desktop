const React = require('react');

const { action, computed, observable, reaction } = require('mobx');
const { observer } = require('mobx-react');

const routerStore = require('~/stores/router-store');
const { contactStore, chatStore, chatInviteStore } = require('peerio-icebear');
const T = require('~/ui/shared-components/T');

const { Avatar, Button } = require('~/peer-ui');
const EmojiImage = require('~/ui/emoji/Image');
const PlusIcon = require('~/ui/shared-components/PlusIcon');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class PendingDM extends React.Component {
    // Testing vars
    @observable activePendingDMUsername = 'ltest1';

    // Contact object for the target user
    @computed get targetContact() {
        return contactStore.getContact(this.activePendingDMUsername);
    }

    @observable isNewUser = true;
    @observable dismissed = false;

    @computed get chatListEmpty() {
        // TODO: refactor when SDK is there for chat invites
        return !chatStore.chats.length && !chatInviteStore.received.length;
    }

    componentDidMount() {
        /*
            Listen for a change in activePendingDMUsername.
            When switching between two PendingDMs, `dismissed` will be reset so that the proper text shows up.
        */
        this.targetUserReaction = reaction(() => this.activePendingDMUsername, () => {
            this.dismissed = false;
        });
    }

    componentWillUnmount() {
        this.targetUserReaction();
        this.targetUserReaction = null;
    }

    @action.bound onDismiss() {
        this.dismissed = true;
    }

    onMessage = () => {
        console.log('on message');
    }

    onCancel = () => {
        routerStore.navigateTo(routerStore.ROUTES.zeroChats);
    }

    render() {
        const c = this.targetContact;

        if (this.dismissed) {
            return (
                <div className="pending-dm dismissed">
                    <EmojiImage emoji="relieved" size="large" />
                    <T className="main-text" k="title_acceptedInvitationDismissed">
                        {{ plusIcon: () => <PlusIcon /> }}
                    </T>

                    {this.chatListEmpty
                        ? <div className="button-container">
                            <Button onClick={this.onCancel}>
                                <T k="button_cancel" />
                            </Button>
                        </div>
                        : null
                    }
                </div>
            );
        }

        return (
            <div className="pending-dm">
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
        );
    }
}

module.exports = PendingDM;
