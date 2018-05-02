const React = require('react');

const { action, computed, observable, reaction } = require('mobx');
const { observer } = require('mobx-react');

const routerStore = require('~/stores/router-store');
const { chatStore, chatInviteStore } = require('peerio-icebear');
const T = require('~/ui/shared-components/T');

const { Avatar, Button } = require('~/peer-ui');
const EmojiImage = require('~/ui/emoji/Image');
const PlusIcon = require('~/ui/shared-components/PlusIcon');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class PendingDM extends React.Component {
    @observable dismissed = false;

    @computed get chatListEmpty() {
        // TODO: refactor when SDK is there for chat invites
        return !chatStore.chats.length && !chatInviteStore.received.length;
    }

    @action.bound onDismiss() {
        this.dismissed = true;
        chatStore.activeChat.dismiss();
    }

    onMessage = () => {
        chatStore.activeChat.start();
    }

    onCancel = () => {
        routerStore.navigateTo(routerStore.ROUTES.zeroChats);
    }

    render() {
        const c = chatStore.activeChat && chatStore.activeChat.contact;
        if (!c) return null;

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
                    k={this.isReceived
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
