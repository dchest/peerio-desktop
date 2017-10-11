const React = require('react');
const { observable, reaction } = require('mobx');
const { observer } = require('mobx-react');
const { FontIcon, IconButton, TooltipIconButton, ProgressBar } = require('~/react-toolbox');
const ChatList = require('./components/ChatList');
const { chatStore, TinyDb, clientApp } = require('~/icebear');
const sounds = require('~/helpers/sounds');
const uiStore = require('~/stores/ui-store');
const { t } = require('peerio-translator');
const css = require('classnames');
const ChatNameEditor = require('./components/ChatNameEditor');
const FullCoverLoader = require('~/ui/shared-components/FullCoverLoader');

const SIDEBAR_STATE_KEY = 'chatSideBarIsOpen';

@observer
class Chat extends React.Component {
    @observable static sidebarOpen = true; // static, so it acts like lazy internal store
    @observable chatNameEditorVisible = false;
    @observable showUserPicker = false;

    static sidebarStateSaver;

    componentWillMount() {
        clientApp.isInChatsView = true;
        TinyDb.user.getValue(SIDEBAR_STATE_KEY).then(isOpen => {
            Chat.sidebarOpen = isOpen == null ? Chat.sidebarOpen : isOpen;
        });
        if (!Chat.sidebarStateSaver) {
            Chat.sidebarStateSaver = reaction(() => Chat.sidebarOpen, open => {
                TinyDb.user.setValue(SIDEBAR_STATE_KEY, open);
            }, { delay: 1000 });
        }
        this.reactionsToDispose = [
            reaction(() => this.showUserPicker, show => { clientApp.isInChatsView = !show; })
        ];
    }

    componentWillUnmount() {
        clientApp.isInChatsView = false;
        this.reactionsToDispose.forEach(dispose => dispose());
    }

    sendMessage(m) {
        try {
            chatStore.activeChat.sendMessage(m)
                .catch(() => Chat.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    sendAck() {
        try {
            chatStore.activeChat.sendAck()
                .catch(() => Chat.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    shareFiles = (files) => {
        try {
            chatStore.activeChat.shareFiles(files)
                .catch(() => Chat.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    };

    addParticipants = (contacts) => {
        chatStore.activeChat.addParticipants(contacts);
        this.closeUserPicker();
    };

    static playErrorSound() {
        if (uiStore.prefs.errorSoundsEnabled) sounds.destroy.play();
    }

    openUserPicker = () => {
        this.showUserPicker = true;
    };

    closeUserPicker = () => {
        this.showUserPicker = false;
    };

    toggleSidebar = () => {
        Chat.sidebarOpen = !Chat.sidebarOpen;
    };

    showChatNameEditor = () => {
        if (!(chatStore.activeChat.canIAdmin && chatStore.activeChat.isChannel)) return;
        this.chatNameEditorVisible = true;
    };

    hideChatNameEditor = () => {
        this.chatNameEditorVisible = false;
    };

    chatNameEditorRef = ref => {
        if (ref) ref.nameInput.focus();
    };

    // assumes active chat exists, don't render if it doesn't
    renderHeader() {
        const chat = chatStore.activeChat;
        return (
            <div className="message-toolbar">
                <div className="message-toolbar-inner" >
                    <div className="title" onClick={this.showChatNameEditor}>
                        {
                            this.chatNameEditorVisible
                                ? <ChatNameEditor showLabel={false} className="name-editor"
                                    readOnly={!chat.canIAdmin}
                                    onBlur={this.hideChatNameEditor} ref={this.chatNameEditorRef} />
                                : <div className="name-editor-inner">
                                    {chat.canIAdmin && chat.isChannel ? <FontIcon value="edit" /> : null}
                                    <div className="title-content">
                                        {chat.name}
                                    </div>
                                </div>
                        }
                    </div>
                    <div className="meta-nav">
                        {chat.isChannel
                            ? <div className="member-count">
                                <TooltipIconButton icon="person"
                                    tooltip={t('title_Members')}
                                    tooltipPosition="bottom"
                                    tooltipDelay={500}
                                    onClick={this.toggleSidebar} />
                                {chat.participants && chat.participants.length ? chat.participants.length : ''}
                            </div>
                            : (chat.changingFavState
                                ? <ProgressBar type="circular" mode="indeterminate" />
                                : <TooltipIconButton icon={chat.isFavorite ? 'star' : 'star_border'}
                                    onClick={chat.toggleFavoriteState}
                                    className={css({ starred: chat.isFavorite })}
                                    tooltip={t('title_starChat')}
                                    tooltipPosition="bottom"
                                    tooltipDelay={500} />
                            )
                        }
                    </div>
                </div>
                {
                    chat.isChannel || chat.recentFiles.length
                        ? <IconButton icon="chrome_reader_mode" onClick={this.toggleSidebar} />
                        : null
                }
            </div>
        );
    }
    render() {
        const chat = chatStore.activeChat;

        return (
            <div className="messages">
                <ChatList />
                {this.props.children}
                {chat && chat.leaving ? <FullCoverLoader show /> : null}
            </div>
        );
    }
}


module.exports = Chat;
