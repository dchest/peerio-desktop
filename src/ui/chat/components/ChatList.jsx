const React = require('react');
const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { chatStore, chatInviteStore, chatNotifier, User, systemMessages } = require('peerio-icebear');
const routerStore = require('~/stores/router-store');

const css = require('classnames');
const FlipMove = require('react-flip-move');
const { Avatar, Button, List, ListItem, ProgressBar, Tooltip } = require('~/peer-ui');
const MaintenanceWarning = require('~/ui/shared-components/MaintenanceWarning');
const { getAttributeInParentChain } = require('~/helpers/dom');

@observer
class ChatList extends React.Component {
    componentDidMount() {
        // TODO: refactor when SDK is there for chat invites
        if (!chatStore.chats.length && !chatInviteStore.activeInvite && chatInviteStore.received.length) {
            this.activateInvite(chatInviteStore.received[0].kegDbId);
        }
    }

    activateChat = (ev) => {
        chatInviteStore.deactivateInvite();
        routerStore.navigateTo(routerStore.ROUTES.chats);
        const id = getAttributeInParentChain(ev.target, 'data-chatid');
        chatStore.activate(id);
    }

    newMessage = () => {
        chatInviteStore.deactivateInvite();
        routerStore.navigateTo(routerStore.ROUTES.newChat);
    };

    newChannel = () => {
        chatStore.deactivateCurrentChat();
        chatInviteStore.deactivateInvite();
        routerStore.navigateTo(routerStore.ROUTES.newChannel);
    }

    inviteOptions(kegDbId) {
        return (<div data-kegdbid={kegDbId}>
            <Button label={t('button_accept')}
                onClick={this.acceptInvite}
                disabled={this.isLimitReached} />
            <Button label={t('button_decline')}
                onClick={this.rejectInvite}
                theme="secondary" />
        </div>
        );
    }

    getProgressBar = loading => {
        return loading ? <ProgressBar type="linear" mode="indeterminate" /> : null;
    };

    getNotificationIcon = chat => {
        const c = chat.unreadCount;
        return c > 0 ? (<div className="notification">{c}</div>) : null;
    };

    renderMostRecentMessage(c) {
        const m = c.mostRecentMessage;
        if (!m) return '';
        if (m.systemData) {
            return <em>{systemMessages.getSystemMessageText(m)}</em>;
        }
        let { username } = m.sender;
        if (username === User.current.username) username = t('title_you');
        return (
            <span><strong>{username}:</strong>&nbsp;
                {m.files && m.files.length
                    ? t('title_filesShared', { count: m.files.length })
                    : m.text}
            </span>
        );
    }

    @observable channelInviteActive;
    @observable selectedInvite;

    @action.bound activateInviteByEvent(ev) {
        const kegDbId = getAttributeInParentChain(ev.target, 'data-kegdbid');
        if (!kegDbId) return;
        this.activateInvite(kegDbId);
    }

    @action.bound activateInvite(kegDbId) {
        chatInviteStore.activateInvite(kegDbId);
        if (chatInviteStore.activeInvite) {
            chatStore.deactivateCurrentChat();
            routerStore.navigateTo(routerStore.ROUTES.channelInvite);
        }
    }

    render() {
        return (
            <div className="feature-navigation-list">
                {/* TODO: use a general full width progress bar instead of this one. */}
                {this.getProgressBar(chatStore.loading)}
                {
                    !chatStore.loaded
                        ? null
                        :
                        <div className="list">
                            <MaintenanceWarning />
                            <List clickable>
                                <div>
                                    <div className="chat-item-add" onClick={this.newChannel} >
                                        <div className="chat-item-title">{t('title_channels')}</div>
                                        <div className="chat-item-add-icon" />
                                    </div>
                                    <Tooltip text={t('title_addRoom')}
                                        position="right" />
                                </div>

                                <FlipMove duration={200} easing="ease-in-out" >
                                    {routerStore.isNewChannel &&
                                        <ListItem key="new channel"
                                            className="room-item new-room-entry active"
                                            caption={`# ${t('title_newRoom')}`}
                                        />
                                    }
                                    {chatNotifier.allRooms.map(r =>
                                        r.isChannel
                                            ? (
                                                <ListItem
                                                    data-chatid={r.id}
                                                    key={r.id || r.tempId}
                                                    className={
                                                        css('room-item',
                                                            {
                                                                active: r.active,
                                                                unread: r.unreadCount > 0
                                                            }
                                                        )
                                                    }
                                                    caption={`# ${r.name}`}
                                                    onClick={this.activateChat}
                                                    rightContent={
                                                        ((!r.active || r.newMessagesMarkerPos) && r.unreadCount > 0)
                                                            ? this.getNotificationIcon(r)
                                                            : null
                                                    } />
                                            )
                                            : (
                                                <ListItem
                                                    data-kegdbid={r.kegDbId}
                                                    key={/* needs different key here so it doesn't disappear
                                                           on accept animation
                                                        */
                                                        `invite:${r.kegDbId}`}
                                                    className={
                                                        css('room-item', 'room-invite-item', 'unread',
                                                            { active: chatInviteStore.activeInvite
                                                                && chatInviteStore.activeInvite.kegDbId === r.kegDbId })
                                                    }
                                                    onClick={this.activateInviteByEvent}
                                                    caption={`# ${r.channelName}`}
                                                    rightContent={
                                                        <T k="title_new" className="room-invite-notification-icon" />
                                                    }
                                                />
                                            )
                                    )}
                                </FlipMove>
                            </List>
                            <List clickable>
                                <div>
                                    <div className="chat-item-add" onClick={this.newMessage}>
                                        <div className="chat-item-title">{t('title_directMessages')}</div>
                                        <div className="chat-item-add-icon" />
                                    </div>
                                    <Tooltip text={t('title_addDirectMessage')}
                                        position="right" />
                                </div>
                                {routerStore.isNewChat &&
                                    <ListItem key="new chat"
                                        className={css(
                                            'dm-item', 'new-dm-list-entry', { active: routerStore.isNewChat }
                                        )}
                                        leftContent={<div className="new-dm-avatar material-icons">help_outline</div>}
                                    >
                                        <i>{t('title_newDirectMessage')}</i>
                                        <Tooltip text={t('title_newDirectMessage')}
                                            position="right" />
                                    </ListItem>
                                }
                                <FlipMove duration={200} easing="ease-in-out">
                                    {chatStore.directMessages.map(c =>
                                        (<ListItem
                                            data-chatid={c.id}
                                            key={c.id || c.tempId}
                                            className={css(
                                                'dm-item',
                                                {
                                                    active: c.active,
                                                    unread: c.unreadCount > 0,
                                                    pinned: c.isFavorite
                                                }
                                            )}
                                            leftContent={
                                                <Avatar
                                                    key="a"
                                                    contact={
                                                        c.otherParticipants.length > 0
                                                            ? c.otherParticipants[0]
                                                            : c.allParticipants[0]
                                                    }
                                                    size="small"
                                                    clickable
                                                    tooltip
                                                />
                                            }

                                            onClick={this.activateChat}
                                            rightContent={
                                                ((!c.active || c.newMessagesMarkerPos) && c.unreadCount > 0)
                                                    ? this.getNotificationIcon(c)
                                                    : null
                                            }
                                        >
                                            {c.name}
                                            {/* this.renderMostRecentMessage(c) */}
                                        </ListItem>
                                        )
                                    )}
                                </FlipMove>
                            </List>
                        </div>
                }
            </div>
        );
    }
}

module.exports = ChatList;
