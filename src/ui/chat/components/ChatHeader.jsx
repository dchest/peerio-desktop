const React = require('react');
const { computed } = require('mobx');
const { observer } = require('mobx-react');
const { chatStore } = require('peerio-icebear');
const T = require('~/ui/shared-components/T');
const AvatarWithPopup = require('~/ui/contact/components/AvatarWithPopup');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class ChatHeader extends React.Component {
    @computed get displayParticipants() {
        const chat = chatStore.activeChat;
        if (!chat) return [];
        if (chat.isChannel) return chat.allParticipants;
        return chat.otherParticipants;
    }

    render() {
        const chat = chatStore.activeChat;

        return (
            <div className="messages-start">
                <div className="avatars">
                    {this.displayParticipants.map(
                        c => <AvatarWithPopup size="large" key={c.username} contact={c} tooltip />
                    )}
                </div>
                <T k={chat.isChannel ? 'title_chatBeginningRoom' : 'title_chatBeginning'} tag="div" className="title">
                    {{
                        chatName: chat.name
                    }}
                </T>
                <IdentityVerificationNotice />
            </div>
        );
    }
}

module.exports = ChatHeader;
