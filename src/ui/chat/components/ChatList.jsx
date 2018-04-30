const React = require('react');
const { action, computed, observable } = require('mobx');
const { observer } = require('mobx-react');

const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { chatStore, chatInviteStore } = require('peerio-icebear');
const routerStore = require('~/stores/router-store');

const css = require('classnames');
const FlipMove = require('react-flip-move');
const _ = require('lodash');
const { Avatar, Button, List, ListItem, MaterialIcon, ProgressBar, Tooltip } = require('~/peer-ui');
const MaintenanceWarning = require('~/ui/shared-components/MaintenanceWarning');
const { getAttributeInParentChain } = require('~/helpers/dom');

// Variables to calculate position-in-window of unread messages
const paddingTop = 20;
const paddingMiddle = 16;
const paddingBottom = 8;
const buttonHeight = 48;
const roomHeight = 26;
const dmHeight = 44;
const notifHeight = 46;

@observer
class ChatList extends React.Component {
    componentDidMount() {
        // TODO: refactor when SDK is there for chat invites
        if (!chatStore.chats.length && !chatInviteStore.activeInvite && chatInviteStore.received.length) {
            this.activateInvite(chatInviteStore.received[0].kegDbId);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.checkScrollHeight);
        if (this.scrollContainerRef) this.scrollContainerRef.removeEventListener('scroll', this.checkScrollDistance);
        window.removeEventListener('resize', this.checkScrollDistance);
    }

    // Building the rooms & invites list
    @computed get allRooms() {
        return chatInviteStore.received.concat(chatStore.channels).sort((a, b) => {
            const first = a.name || a.channelName;
            const second = b.name || b.channelName;
            return first.localeCompare(second);
        });
    }

    @computed get allRoomsMap() {
        return this.allRooms.map((r) => {
            return r.isChannel
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
                                ? <div className="notification">{r.unreadCount}</div>
                                : null
                        }
                    />
                )
                : (
                    <ListItem
                        data-kegdbid={r.kegDbId}
                        key={`invite:${r.kegDbId}`}
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
                );
        });
    }

    // Building the DM list
    @computed get dmMap() {
        // Testing vars
        const acceptedInvites = [{
            isInvite: true,
            username: 'ltest1',
            name: 'Jane Walters',
            id: 123,
            viewed: false
        }];
        const directMessagesAndPending = acceptedInvites.concat(chatStore.directMessages);
        //

        return directMessagesAndPending.map(c => {
            return c.isInvite
                ? (
                    <ListItem
                        data-chatid={c.id}
                        key={c.id || c.tempId}
                        className={css(
                            'dm-item'
                        )}
                        leftContent={
                            <Avatar
                                key="a"
                                username="ltest1"
                                size="small"
                                clickable
                                tooltip
                            />
                        }

                        onClick={this.activatePendingDM}
                        rightContent={c.viewed ? null : <T k="title_new" className="room-invite-notification-icon" />}
                    >
                        {c.name}
                    </ListItem>
                )
                : (
                    <ListItem
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
                                ? <div className="notification">{c.unreadCount}</div>
                                : null
                        }
                    >
                        {c.name}
                    </ListItem>
                );
        });
    }

    // Calculating the positions of unread messages relative to scroll container
    @computed get unreadPositions() {
        const positionsArray = [];

        const unreadRooms = this.allRooms.reduce((acc, room, i) => {
            if (!room.active && room.unreadCount > 0) {
                acc.push(i);
            }
            return acc;
        }, []);

        const roomsOffset = paddingTop + buttonHeight;
        unreadRooms.forEach(i => {
            positionsArray.push(
                roomsOffset + i * roomHeight
            );
        });

        const unreadDMs = chatStore.directMessages.reduce((acc, chat, i) => {
            if (!chat.active && chat.unreadCount > 0) {
                acc.push(i);
            }
            return acc;
        }, []);

        const dmsOffset = roomsOffset + this.allRooms.length * roomHeight + paddingMiddle + buttonHeight;
        unreadDMs.forEach(i => {
            positionsArray.push(
                dmsOffset + i * dmHeight
            );
        });

        return positionsArray;
    }

    // Calculations to determine if unread messages are out of view
    @observable scrollContainerRef;
    @action.bound setScrollContainerRef(ref) {
        if (!ref) {
            this.scrollContainerRef = null;
            return;
        }

        this.scrollContainerRef = ref;
        this.checkScrollHeight();
        window.addEventListener('resize', this.checkScrollHeight);

        this.checkScrollDistance();
        ref.addEventListener('scroll', this.checkScrollDistance);
        window.addEventListener('resize', this.checkScrollDistance);
    }

    @observable scrollContainerHeight;
    @action.bound checkScrollHeight() {
        this.scrollContainerHeight = this.scrollContainerRef.clientHeight;
    }

    @observable scrollDistance;
    @action.bound checkScrollDistance = _.throttle(() => {
        this.scrollDistance = this.scrollContainerRef.scrollTop;
    }, 250);

    // Calculate the next and previous unread message that's offscreen
    @computed get containerTotalHeight() {
        return (
            paddingTop + paddingMiddle + paddingBottom + 2 * buttonHeight
            + this.allRooms.length * roomHeight
            + chatStore.directMessages.length * dmHeight
        );
    }

    @computed get nextUnread() {
        let next;
        for (let i = this.unreadPositions.length - 1; i >= 0; i--) {
            if (this.scrollDistance + this.scrollContainerHeight - dmHeight > this.unreadPositions[i]) break;
            next = this.unreadPositions[i] - notifHeight;
        }
        return next;
    }

    @computed get prevUnread() {
        let prev;
        for (let i = 0; i < this.unreadPositions.length; i++) {
            if (this.scrollDistance < this.unreadPositions[i]) break;
            prev = this.unreadPositions[i] - notifHeight;
        }
        return prev;
    }

    // Scroll-to-position when clicking "unread messages" notification
    @observable goToUnread;
    @action.bound onClickUnreadNotify() {
        if (this.prevUnread) {
            this.goToUnread = this.prevUnread;
            window.requestAnimationFrame(this.smoothScrollUp);
        } else {
            this.goToUnread = this.nextUnread;
            window.requestAnimationFrame(this.smoothScrollDown);
        }
    }

    smoothScrollUp = () => {
        const el = this.scrollContainerRef;
        if (!el) return;

        const goal = this.goToUnread;
        if (el.scrollTop <= goal || el.scrollTop === 0) {
            return;
        }

        el.scrollTop -= (el.scrollTop - goal) / 8 + 1;
        window.requestAnimationFrame(this.smoothScrollUp);
    }

    smoothScrollDown = () => {
        const el = this.scrollContainerRef;
        if (!el) return;

        const goal = this.goToUnread;
        if (el.scrollTop >= goal || el.scrollTop + el.clientHeight >= this.containerTotalHeight) {
            return;
        }

        el.scrollTop += (goal - el.scrollTop) / 8 + 1;
        window.requestAnimationFrame(this.smoothScrollDown);
    }

    // Room, DM, and button click events
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

    // Room invites click events
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

    // Accepted invite 'pending DM' click events
    activatePendingDM = (ev) => {
        chatStore.deactivateCurrentChat();
        chatInviteStore.deactivateInvite();
        routerStore.navigateTo(routerStore.ROUTES.pendingDM);

        // const id = getAttributeInParentChain(ev.target, 'data-chatid');
        console.log(ev.target);
    }

    render() {
        return (
            <div className="feature-navigation-list messages-list">
                {/* TODO: use a general full width progress bar instead of this one. */}
                {chatStore.loading ? <ProgressBar type="linear" mode="indeterminate" /> : null}
                {
                    !chatStore.loaded
                        ? null
                        :
                        <div className="list" ref={this.setScrollContainerRef}>
                            <MaintenanceWarning />
                            <List>
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
                                    {this.allRoomsMap}
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
                                    {this.dmMap}
                                </FlipMove>
                            </List>

                            <Button
                                className={css(
                                    'unread-notification',
                                    {
                                        banish: !this.prevUnread && !this.nextUnread,
                                        top: !!this.prevUnread
                                    }
                                )}
                                onClick={this.onClickUnreadNotify}
                            >
                                <span className="text">Unread messages</span>
                                <MaterialIcon icon={this.prevUnread
                                    ? 'keyboard_arrow_up'
                                    : 'keyboard_arrow_down'
                                } />
                            </Button>
                        </div>
                }
            </div>
        );
    }
}

module.exports = ChatList;
