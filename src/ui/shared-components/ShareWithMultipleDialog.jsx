const React = require('react');
const { observable, computed, action } = require('mobx');
const { observer } = require('mobx-react');
const { contactStore, User } = require('peerio-icebear');
const { Avatar, Dialog, Input, List, ListItem, MaterialIcon, Button } = require('peer-ui');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { getContactByEvent } = require('~/helpers/icebear-dom');
const { ModifyShareDialog } = require('./ModifyShareDialog');

/**
 * onSelectContact
 * onSelectChannel
 */
@observer
class ShareWithMultipleDialog extends React.Component {
    @observable query = '';
    @observable visible = false;
    selectedUsers = observable.map();

    @action.bound handleTextChange(newVal) {
        this.query = newVal;
    }

    get existingUsers() {
        return this.props.item ? this.props.item.otherParticipants : [];
    }

    filterExisting = (c) => {
        return !this.existingUsers.find(u => u.username === c.username);
    }
    @computed get contacts() {
        const selectedUsernames = this.selectedUsers.keys();
        let ret = contactStore
            .whitelabel.filter(this.query, this.props.context)
            .filter(c => !c.isDeleted)
            .filter(c => c.username !== User.current.username)
            .sort((c1, c2) => c1.username.localeCompare(c2.username));

        if (this.existingUsers && this.existingUsers.length > 0) {
            ret = ret.filter(this.filterExisting);
        }


        selectedUsernames.forEach(username => {
            if (!ret.find(c => c.username === username)) {
                ret.push(this.selectedUsers.get(username));
            }
        });
        return ret;
    }

    @action.bound async onContactClick(ev) {
        const contact = await getContactByEvent(ev);
        if (this.selectedUsers.has(contact.username)) {
            this.selectedUsers.delete(contact.username);
        } else {
            this.selectedUsers.set(contact.username, contact);
        }
    }

    renderContact = (c) => {
        return (
            <div data-username={c.username} key={c.username}>
                <ListItem
                    leftIcon={this.selectedUsers.has(c.username) ? 'check_box' : 'check_box_outline_blank'}
                    leftContent={<Avatar key="a" contact={c} size="small" />}
                    onClick={this.onContactClick}>
                    <span className="full-name">{c.fullName}</span>
                    <span className="username">@{c.username}</span>
                </ListItem>
            </div>
        );
    }

    @action.bound show() {
        this.selectedUsers.clear();
        this.visible = true;
        return new Promise(resolve => { this.resolve = resolve; });
    }

    @action.bound close() {
        this.visible = false;
        this.resolve(null);
        this.resolve = null;
        this.query = '';
        this.selectedUsers.clear();
    }

    @action.bound share() {
        this.visible = false;
        this.resolve(this.selectedUsers.values());
        this.resolve = null;
        this.query = '';
        this.selectedUsers.clear();
    }

    get sharedWithBlock() {
        return this.existingUsers.map(c => (
            <Avatar
                key={c.username}
                contact={c}
                size="tiny"
                clickable
                tooltip
            />
        ));
    }

    @action.bound modifySharedWith() {
        this.modifyShareDialog.show();
    }

    get usersSelected() {
        return this.selectedUsers.size;
    }

    setModifyShareDialogRef = (ref) => { this.modifyShareDialog = ref; };

    render() {
        if (!this.visible) return false;
        const dialogActions = [
            { label: t('button_cancel'), onClick: this.close },
            { label: t('button_share'), onClick: this.share, disabled: !this.usersSelected }
        ];
        const item = this.props.item;

        return (
            <div>
                {
                    item && item.isFolder
                        ? <ModifyShareDialog ref={this.setModifyShareDialogRef} folder={item}
                            contacts={this.existingUsers} />
                        : null
                }
                <Dialog active noAnimation
                    className="share-with-dialog share-folder"
                    actions={dialogActions}
                    onCancel={this.close}
                    title={t('title_shareWith')}>
                    <div className="share-with-contents">
                        <div className="user-search">
                            <MaterialIcon icon="search" />
                            <div className="chip-wrapper">
                                <Input
                                    placeholder={t('title_userSearch')}
                                    value={this.query}
                                    onChange={this.handleTextChange}
                                    onKeyDown={this.handleKeyDown} />
                            </div>
                        </div>
                        <div className="chat-list-container">
                            <div className="list-dms-container">
                                <div className="p-list-heading">
                                    <T k="title_contacts" />
                                    &nbsp;({this.contacts.length})
                                </div>
                                <List className="list-chats list-dms" clickable>
                                    {this.contacts.map(this.renderContact)}
                                </List>
                            </div>
                        </div>
                        {item && item.isFolder && this.existingUsers.length ?
                            <div className="receipt-wrapper">
                                <Button label={t('title_viewSharedWith')} onClick={this.modifySharedWith} />
                                {this.sharedWithBlock}
                            </div> : null}
                    </div>
                </Dialog>
            </div>
        );
    }
}

module.exports = ShareWithMultipleDialog;
