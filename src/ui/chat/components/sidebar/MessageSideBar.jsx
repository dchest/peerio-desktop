const React = require('react');
const { reaction } = require('mobx');
const { observer } = require('mobx-react');
const { chatStore, systemMessages, contactStore } = require('peerio-icebear');
const uiStore = require('~/stores/ui-store');
const { Avatar, Button, List, ListItem } = require('~/peer-ui');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { getAttributeInParentChain } = require('~/helpers/dom');

@observer
class MessageSideBar extends React.Component {
    validate = (chat) => {
        if (!uiStore.selectedMessage) return false;
        if (!chat || chat.id !== uiStore.selectedMessage.db.id) {
            this.close();
            return false;
        }
        return true;
    };

    componentWillMount() {
        this.reactionsToDispose = [
            reaction(() => chatStore.activeChat, this.validate)
        ];
    }
    componentWillUnmount() {
        this.reactionsToDispose.forEach(d => d());
    }

    openContact(ev) {
        const username = getAttributeInParentChain(ev.target, 'data-username');
        uiStore.contactDialogUsername = username;
    }
    close() {
        setTimeout(() => {
            uiStore.selectedMessage = null;
        });
    }
    renderMessage(m) {
        if (m.systemData) {
            return <em>{systemMessages.getSystemMessageText(m)}</em>;
        }
        return (<span>
            {m.files && m.files.length
                ? t('title_filesShared', { count: m.files.length })
                : m.text}
        </span>
        );
    }
    renderReceipt = (entry) => {
        return !entry || entry[1].signatureError
            ? null
            : <ListItem
                data-username={entry[0].username}
                key={entry[0].username}
                leftContent={<Avatar key="a" contact={entry[0]} size="small" clickable />}
                caption={entry[0].username}
                legend={entry[0].fullName}
                onClick={this.openContact}
            />;
    }
    compareReceipts(r1, r2) {
        if (!r1) return 1;
        if (!r2) return -1;
        return r1[0].fullNameAndUsername.localeCompare(r2[0].fullNameAndUsername);
    }
    getReceipts(msg) {
        const entries = chatStore.activeChat.receipts.entries();
        for (let i = 0; i < entries.length; i++) {
            if (+msg.id > entries[i][1].chatPosition) {
                entries[i] = null;
                continue;
            }
            entries[i][0] = contactStore.getContact(entries[i][0]);
        }
        entries.sort(this.compareReceipts);

        return entries.map(this.renderReceipt);
    }
    render() {
        if (!this.validate(chatStore.activeChat)) return null;
        const msg = uiStore.selectedMessage;
        return (
            <div className="message-sidebar">
                <div className="header">
                    <List theme="large no-hover">
                        <div className="title">
                            <T k="title_messageInfo" tag="div" className="p-list-heading" />
                            <div className="close-button">
                                <Button icon="close" onClick={this.close} />
                            </div>
                        </div>
                        <ListItem
                            leftContent={
                                <Avatar key="a" contact={msg.sender} size="small" clickable tooltip />
                            }
                            caption={msg.sender.fullName}
                            legend={this.renderMessage(msg)}
                        />
                    </List>
                </div>
                <T k="title_readBy" tag="div" className="p-list-heading" />

                <List className="receipts" clickable>
                    {this.getReceipts(msg)}
                </List>
            </div>
        );
    }
}

module.exports = MessageSideBar;
