// @ts-check

const React = require('react');
const { computed } = require('mobx');
const { observer } = require('mobx-react');

const { chatStore } = require('peerio-icebear');
const routerStore = require('~/stores/router-store');
const ChatList = require('./components/ChatList');
const ZeroChats = require('~/ui/chat/ZeroChats_medcryptor');

@observer
class Chat extends React.Component {
    @computed get zeroState() {
        return (
            !chatStore.loading && !chatStore.activeChat && routerStore.currentRoute === routerStore.ROUTES.chats
        );
    }

    render() {
        return (
            <div className="messages">
                <ChatList />
                {this.zeroState ? <ZeroChats condensed /> : null}
                {this.props.children}
            </div>
        );
    }
}

module.exports = Chat;
