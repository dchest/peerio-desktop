import React from 'react';
import { action, observable, reaction, IReactionDisposer, entries } from 'mobx';
import { observer } from 'mobx-react';

import { chatStore, systemMessages, contactStore } from 'peerio-icebear';
import { t } from 'peerio-translator';
import { Avatar, Button, List, ListItem } from 'peer-ui';

import uiStore from '~/stores/ui-store';
import AvatarWithPopup from '~/ui/contact/components/AvatarWithPopup';
import ContactProfile from '~/ui/contact/components/ContactProfile';
import T from '~/ui/shared-components/T';

@observer
export default class MessageSideBar extends React.Component {
    readonly contactProfileRef = React.createRef<ContactProfile>();

    @observable clickedContact: unknown; // TODO/TS icebear model

    disposer!: IReactionDisposer;

    componentWillMount() {
        this.disposer = reaction(() => chatStore.activeChat, this.validate);
    }
    componentWillUnmount() {
        this.disposer();
    }

    readonly validate = chat => {
        if (!uiStore.selectedMessage) return false;
        if (!chat || chat.id !== uiStore.selectedMessage.db.id) {
            this.close();
            return false;
        }
        return true;
    };

    @action.bound
    openContact(ev: React.MouseEvent) {
        this.clickedContact = contactStore.getContact(
            ev.currentTarget.attributes['data-username'].value
        );
        this.contactProfileRef.current!.openDialog();
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
        return (
            <span>
                {m.files && m.files.length
                    ? t('title_filesShared', { count: m.files.length })
                    : m.text}
            </span>
        );
    }
    renderReceipt = entry => {
        return !entry || entry[1].signatureError ? null : (
            <ListItem
                data-username={entry[0].username}
                key={entry[0].username}
                leftContent={
                    <Avatar key="a" contact={entry[0]} size="small" clickable />
                }
                caption={entry[0].username}
                legend={entry[0].fullName}
                onClick={this.openContact}
            />
        );
    };
    compareReceipts(r1, r2) {
        if (!r1) return 1;
        if (!r2) return -1;
        return r1[0].fullNameAndUsername.localeCompare(
            r2[0].fullNameAndUsername
        );
    }
    getReceipts(msg) {
        const rEntries = entries(chatStore.activeChat.receipts).slice();
        for (let i = 0; i < rEntries.length; i++) {
            if (+msg.id > rEntries[i][1].chatPosition) {
                rEntries[i] = null;
                continue;
            }
            rEntries[i][0] = contactStore.getContact(rEntries[i][0]);
        }
        rEntries.sort(this.compareReceipts);

        return rEntries.map(this.renderReceipt);
    }
    render() {
        if (!this.validate(chatStore.activeChat)) return null;
        const msg = uiStore.selectedMessage;
        return (
            <div className="message-sidebar">
                <div className="header">
                    <List theme="large no-hover">
                        <div className="title">
                            <T
                                k="title_messageInfo"
                                tag="div"
                                className="p-list-heading"
                            />
                            <Button icon="close" onClick={this.close} />
                        </div>
                        <ListItem
                            leftContent={
                                <AvatarWithPopup
                                    key="a"
                                    contact={msg.sender}
                                    size="small"
                                    tooltip
                                />
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

                <ContactProfile
                    ref={this.contactProfileRef}
                    contact={this.clickedContact}
                />
            </div>
        );
    }
}
