const React = require('react');
const { action, observable } = require('mobx');
const { observer } = require('mobx-react');
const { Avatar, List, ListHeading, ListItem, Menu, MenuItem } = require('peer-ui');
const ContactProfile = require('~/ui/contact/components/ContactProfile');
const { chatStore, contactStore, chatInviteStore, User } = require('peerio-icebear');
const { t } = require('peerio-translator');
const { getAttributeInParentChain } = require('~/helpers/dom');
const T = require('~/ui/shared-components/T');
const SideBarSection = require('./SideBarSection');
const css = require('classnames');
const ELEMENTS = require('~/whitelabel/helpers/elements');

@observer
class MembersSection extends React.Component {
    setContactProfileRef = (ref) => {
        if (ref) this.contactProfileRef = ref;
    }

    @observable clickedContact;
    @action.bound openContact(ev) {
        this.clickedContact = contactStore.getContact(ev.currentTarget.attributes['data-username'].value);
        this.contactProfileRef.openDialog();
    }

    deleteInvite(ev) {
        ev.stopPropagation();
        const username = getAttributeInParentChain(ev.target, 'data-username');
        chatInviteStore.revokeInvite(chatStore.activeChat.id, username);
    }

    deleteParticipant(ev) {
        ev.stopPropagation();
        const username = getAttributeInParentChain(ev.target, 'data-username');
        chatStore.activeChat.removeParticipant(username);
    }

    makeAdmin(ev) {
        ev.stopPropagation();
        const username = getAttributeInParentChain(ev.target, 'data-username');
        chatStore.activeChat.promoteToAdmin(contactStore.getContact(username));
    }

    demoteAdmin(ev) {
        ev.stopPropagation();
        const username = getAttributeInParentChain(ev.target, 'data-username');
        chatStore.activeChat.demoteAdmin(contactStore.getContact(username));
    }

    stopPropagation(ev) {
        ev.stopPropagation();
    }

    handleClickUserMenu = () => {

    }

    userMenu(username) {
        const menuItems = [];

        ELEMENTS.membersSection.userMenuItems(username).forEach(item => {
            menuItems.push(
                <MenuItem
                    key={item.key}
                    value={item.value}
                    icon={item.icon}
                    caption={t(item.caption)}
                    onClick={this[item.onClick]}
                />
            );
        });

        return (
            <Menu
                icon="more_vert"
                position="bottom-right"
                onClick={this.stopPropagation}
                data-username={username}
            >
                {menuItems}
            </Menu>
        );
    }

    adminMenu(username) {
        return (
            <Menu
                icon="more_vert"
                position="bottom-right"
                onClick={this.stopPropagation}
                data-username={username}
            >
                <MenuItem value="demote_admin" icon="highlight_off" caption={t('button_demoteAdmin')}
                    onClick={this.demoteAdmin} />
                <MenuItem value="delete" icon="remove_circle_outline" caption={t('button_remove')}
                    onClick={this.deleteParticipant} />
            </Menu>
        );
    }

    inviteMenu(username) {
        return (
            <Menu
                icon="more_vert"
                position="bottom-right"
                onClick={this.stopPropagation}
                data-username={username}
            >
                <MenuItem
                    icon="remove_circle_outline"
                    caption={t('button_remove')}
                    onClick={this.deleteInvite}
                />
            </Menu>
        );
    }

    renderJoinedParticipant = (c, chat, showAdmin) => {
        return (
            <ListItem
                data-username={c.username}
                key={c.username}
                leftContent={<Avatar key="a" contact={c} size="small" clickable />}
                caption={
                    <div className="user-caption">
                        <span className="username">{c.username}</span>
                        {chat.isAdmin(c) ? <T k="title_admin" className="tag" /> : null}
                    </div>
                }
                legend={c.fullName}
                rightContent={
                    (showAdmin && User.current.username !== c.username)
                        ? (chat.isAdmin(c)
                            ? this.adminMenu(c.username)
                            : this.userMenu(c.username)
                        )
                        : null
                }
                onClick={this.openContact}
            />
        );
    }

    renderInvitedParticipant = (c, showAdmin) => {
        return (
            <ListItem
                data-username={c.username}
                key={`invited--${c.username}`}
                caption={c.username}
                rightContent={showAdmin && this.inviteMenu(c.username)}
                onClick={this.openContact}
            />
        );
    };

    render() {
        const chat = chatStore.activeChat;
        if (!chat) return null;
        const invited = chatInviteStore.sent.get(chat.id);
        const { isChannel, canIAdmin } = chat;
        const showAdmin = isChannel && canIAdmin;

        if (!isChannel && !chat.otherParticipants.length) {
            // this removes member section from DM chat with self
            return null;
        }

        return (
            <SideBarSection title={t('title_Members')} onToggle={this.props.onToggle} open={this.props.open}>
                <div className={css('member-list', 'scrollable', { 'with-admin-controls': isChannel && canIAdmin })}>
                    {isChannel && canIAdmin
                        ? <List className="action-list" clickable>
                            <ListItem
                                className="admin-controls"
                                leftIcon="person_add"
                                caption={t('button_inviteToChannel')}
                                onClick={this.props.onAddParticipants} />
                        </List>
                        : null
                    }
                    <List clickable>
                        {chat.allJoinedParticipants.map(
                            (c) => this.renderJoinedParticipant(c, chat, showAdmin))
                        }
                        {invited && invited.length
                            ? <ListHeading caption={t('title_invited')} />
                            : null}
                        {invited
                            ? invited.map((c) => this.renderInvitedParticipant(c, showAdmin))
                            : null}
                    </List>
                </div>
                <ContactProfile
                    ref={this.setContactProfileRef}
                    contact={this.clickedContact}
                />
            </SideBarSection>
        );
    }
}

module.exports = MembersSection;
