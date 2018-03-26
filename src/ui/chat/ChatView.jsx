const React = require('react');
const { observable, reaction } = require('mobx');
const { observer } = require('mobx-react');
const { Button, CustomIcon, MaterialIcon, ProgressBar, Tooltip } = require('~/peer-ui');
const MessageInput = require('./components/MessageInput');
const MessageList = require('./components/MessageList');
const { chatStore, chatInviteStore } = require('peerio-icebear');
const routerStore = require('~/stores/router-store');
const sounds = require('~/helpers/sounds');
const uiStore = require('~/stores/ui-store');
const UploadInChatProgress = require('./components/UploadInChatProgress');
const { t } = require('peerio-translator');
const css = require('classnames');
const MessageSideBar = require('./components/sidebar/MessageSideBar');
const ChatSideBar = require('./components/sidebar/ChatSideBar');
const ChannelSideBar = require('./components/sidebar/ChannelSideBar');
const ChatNameEditor = require('./components/ChatNameEditor');
const UserPicker = require('~/ui/shared-components/UserPicker');
const FullCoverLoader = require('~/ui/shared-components/FullCoverLoader');
const { Dialog } = require('~/peer-ui');

@observer
class ChatView extends React.Component {
    @observable chatNameEditorVisible = false;
    @observable showUserPicker = false;

    componentDidMount() {
        this.reactionsToDispose = [
            reaction(() => chatStore.activeChat, () => { this.showUserPicker = false; })

            // TODO: refactor when SDK is there for chat invites
            // reaction(() => !chatStore.chats.length && !chatInviteStore.received.length, () => {
            //     routerStore.navigateTo(routerStore.ROUTES.zeroChats);
            // }, true)
        ];

        if (chatInviteStore.activeInvite) {
            routerStore.navigateTo(routerStore.ROUTES.channelInvite);
        }

        if (!chatStore.chats.length && !chatInviteStore.received.length) {
            routerStore.navigateTo(routerStore.ROUTES.zeroChats);
        }
    }

    componentWillUnmount() {
        this.reactionsToDispose.forEach(dispose => dispose());
    }

    /**
     * Create a new Message keg with the given plaintext and send it to server as part of this chat.
     * @param {string} text The plaintext of the message.
     */
    sendMessage(text) {
        try {
            chatStore.activeChat.sendMessage(text)
                .catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Create a new Message keg with the given plaintext and send it to server as part of this chat.
     * @param {Object} richText A ProseMirror document tree, in JSON.
     * @param {string} legacyText The rendered HTML of the rich text, for back-compat with older clients
     */
    sendRichTextMessage(richText, legacyText) {
        try {
            chatStore.activeChat.sendRichTextMessage(richText, legacyText)
                .catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    sendAck() {
        try {
            chatStore.activeChat.sendAck()
                .catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    shareFiles = (files) => {
        try {
            chatStore.activeChat.shareFiles(files)
                .catch(() => ChatView.playErrorSound());
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
        uiStore.prefs.chatSideBarIsOpen = !uiStore.prefs.chatSideBarIsOpen;
        uiStore.selectedMessage = null;
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

    @observable jitsiDialogVisible = false;
    toggleJitsiDialog = () => {
        this.jitsiDialogVisible = !this.jitsiDialogVisible;
    };

    postJitsiLink = () => {
        const jitsiLink = chatStore.generateJitsiUrl();
        this.selfNewMessageCounter++;
        chatStore.activeChat && chatStore.activeChat.createVideoCall(jitsiLink);

        this.toggleJitsiDialog();
    };

    // assumes active chat exists, don't render if it doesn't
    renderHeader() {
        const chat = chatStore.activeChat;
        const participants = chat.participantUsernames;

        let listMembers = participants[0];
        for (let i = 1; i < participants.length; i++) {
            if ((`${listMembers}, ${participants[i]}`).length < 100) {
                listMembers += `, ${participants[i]}`;
            } else {
                listMembers += ' ...';
                break;
            }
        }

        return (
            <div className="message-toolbar">
                <div className="message-toolbar-inner" >
                    <div className="title" onClick={this.showChatNameEditor}>
                        {
                            this.chatNameEditorVisible
                                ? <ChatNameEditor showLabel={false} className="name-editor"
                                    readOnly={!chat.canIAdmin}
                                    onBlur={this.hideChatNameEditor} />
                                : <div className="name-editor-inner">
                                    {chat.canIAdmin && chat.isChannel ? <MaterialIcon icon="edit" /> : null}
                                    <div className="title-content">
                                        {chat.name}
                                    </div>
                                </div>
                        }
                    </div>
                    <div className="meta-nav">
                        {chat.isChannel
                            ? <div className="member-count">
                                <MaterialIcon icon="person"
                                    tooltip={listMembers}
                                    tooltipPosition="bottom"
                                />
                                {chat.allParticipants.length || ''}
                            </div>
                            : (chat.changingFavState
                                ? <ProgressBar type="circular" mode="indeterminate" theme="small" />
                                :
                                <div
                                    onClick={chat.toggleFavoriteState}
                                    className={css(
                                        'pin-toggle',
                                        'clickable',
                                        { starred: chat.isFavorite }
                                    )}
                                >
                                    <CustomIcon
                                        icon={chat.isFavorite ? 'pin-on-blue' : 'pin-off'}
                                        className="small"
                                    />
                                    <Tooltip
                                        text={chat.isFavorite
                                            ? t('button_unpinChat')
                                            : t('button_pinChat')
                                        }
                                        position="bottom"
                                    />
                                </div>
                            )
                        }
                    </div>

                </div>
                <div className="message-toolbar-inner-right">
                    <Button
                        icon="videocam"
                        disabled={!chat || !chat.canSendJitsi}
                        onClick={this.toggleJitsiDialog}
                        tooltip={t('button_startVideoCall')}
                        tooltipPosition="bottom"
                        tooltipSize="small"
                    />
                    <Button
                        icon="chrome_reader_mode"
                        onClick={this.toggleSidebar}
                        tooltip={t('button_toggleSidebar')}
                        tooltipPosition="bottom"
                        tooltipSize="small"
                    />
                </div>
            </div>
        );
    }

    get sidebar() {
        if (!chatStore.activeChat) return null;
        if (uiStore.selectedMessage) {
            return <MessageSideBar />;
        }
        return chatStore.activeChat.isChannel ?
            <ChannelSideBar open={uiStore.prefs.chatSideBarIsOpen} onAddParticipants={this.openUserPicker} /> :
            <ChatSideBar open={uiStore.prefs.chatSideBarIsOpen} />;
    }

    render() {
        if (!chatStore.chats.length) return null;

        const chat = chatStore.activeChat;
        if (!chat) return null;

        const jitsiActions = [
            { label: t('button_cancel'), onClick: this.toggleJitsiDialog },
            { label: t('button_startVideoCall'), onClick: this.postJitsiLink }
        ];

        return (
            <div className="message-view">
                {this.renderHeader()}
                <div className="messages-and-sidebar-container">
                    {
                        this.showUserPicker
                            ? <div className="create-new-chat">
                                <UserPicker
                                    closeable
                                    onClose={this.closeUserPicker}
                                    onAccept={this.addParticipants}
                                    exceptContacts={chat.allParticipants}
                                    title={t('title_addParticipants')} noDeleted />
                            </div>
                            : <div className="messages-container">
                                {chatStore.chats.length === 0 && !chatStore.loading ? null : <MessageList />}
                                {
                                    chat && chat.uploadQueue.length
                                        ? <UploadInChatProgress queue={chat.uploadQueue} />
                                        : null
                                }
                                <MessageInput
                                    readonly={!chat || !chat.metaLoaded || chat.isReadOnly}
                                    placeholder={
                                        chat
                                            ? t(
                                                'title_messageInputPlaceholder',
                                                { chatName: `${chat.isChannel ? '# ' : ''}${chat.name}` })
                                            : null
                                    }
                                    onSend={this.sendRichTextMessage}
                                    onAck={this.sendAck}
                                    onFileShare={this.shareFiles}
                                />
                            </div>
                    }
                    {this.sidebar}
                </div>
                {chat.leaving ? <FullCoverLoader show /> : null}
                <Dialog
                    active={this.jitsiDialogVisible}
                    actions={jitsiActions}
                    onCancel={this.toggleJitsiDialog}
                    title={t('title_videoCall')}>
                    {t('dialog_videoCall')}
                </Dialog>
            </div>
        );
    }
}


module.exports = ChatView;
