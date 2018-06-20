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
const { Button, List, ListItem, MaterialIcon, ProgressBar, Tooltip } = require('peer-ui');
const AvatarWithPopup = require('~/ui/contact/components/AvatarWithPopup');
const PlusIcon = require('~/ui/shared-components/PlusIcon');
const MaintenanceWarning = require('~/ui/shared-components/MaintenanceWarning');
const { getAttributeInParentChain } = require('~/helpers/dom');
const PatientList = require('~/whitelabel/components/PatientList');
const ELEMENTS = require('~/whitelabel/helpers/elements');

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
        return ELEMENTS.chatList.allRooms;
    }

    @computed get allRoomsMap() {
        return this.allRooms.map((r) => {
            if (!r.metaLoaded) return null;
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
                                ? <div className="notification">{r.unreadCount < 100 ? r.unreadCount : '99+'}</div>
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
                                {
                                    active: chatInviteStore.activeInvite
                                        && chatInviteStore.activeInvite.kegDbId === r.kegDbId
                                })
                        }
                        onClick={this.activateInviteByEvent}
                        caption={`# ${r.channelName}`}
                        rightContent={
                            <T k="title_new" className="badge-new" />
                        }
                    />
                );
        });
    }

    // Building the DM list
    @computed get dmMap() {
        return chatStore.directMessages.map(c => {
            if (!c.metaLoaded) return null;
            let rightContent = null;
            let contact = c.otherParticipants.length > 0
                ? c.otherParticipants[0]
                : c.allParticipants[0];
            if (c.isInvite) {
                rightContent = <T k="title_new" className="badge-new" />;
                contact = c.contact;
            } else if ((!c.active || c.newMessagesMarkerPos) && c.unreadCount > 0) {
                rightContent = <div className="notification">{c.unreadCount < 100 ? c.unreadCount : '99+'}</div>;
            }
            return (
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
                        <AvatarWithPopup
                            key="a"
                            contact={contact}
                            size="small"
                            clickable
                            tooltip
                        />
                    }

                    onClick={this.activateChat}
                    rightContent={rightContent}
                >
                    {c.name}
                </ListItem>
            );
        });
    }

    // Calculating the positions of unread messages relative to scroll container
    // TODO: this will be thrown off by PatientList
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
    activateChat = async (ev) => {
        chatInviteStore.deactivateInvite();
        const id = getAttributeInParentChain(ev.target, 'data-chatid');
        routerStore.navigateTo(routerStore.ROUTES.chats);
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
                                    <PlusIcon onClick={this.newChannel} label={t('title_channels')} />
                                    <Tooltip text={t('title_addRoom')} position="right" />
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

                            <PatientList />

                            <List clickable>
                                <div>
                                    <PlusIcon onClick={this.newMessage} label={t('title_directMessages')} />
                                    <Tooltip text={t('title_addDirectMessage')} position="right" />
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
