// @ts-check
const fs = require('fs');
const os = require('os');
const path = require('path');

const React = require('react');
const { computed, observable, action } = require('mobx');
const { observer } = require('mobx-react');

const css = require('classnames');
const { t } = require('peerio-translator');
const { fileStore, chatStore, clientApp } = require('peerio-icebear');
const { Button, Menu, MenuItem } = require('~/peer-ui');

const FilePicker = require('~/ui/files/components/FilePicker');
const Snackbar = require('~/ui/shared-components/Snackbar');
const { pickLocalFiles } = require('~/helpers/file');
const UploadDialog = require('~/ui/shared-components/UploadDialog');

const MessageInputProseMirror = require('./MessageInputProseMirror');

/**
 * @augments {React.Component<{
        readonly : boolean
        placeholder : string
        onSend : (richText : Object, legacyText : string) => void
        onAck : () => void
        onFileShare: (files : any) => void
    }, {}>}
 */
@observer
class MessageInput extends React.Component {
    @observable filePickerActive = false;

    @observable uploadDialogActive = false;
    selectedFiles = [];

    @action.bound activateUploadDialog() {
        const chat = chatStore.activeChat;
        if (!chat) return;
        pickLocalFiles()
            .then(paths => {
                if (!paths || !paths.length) return;
                this.selectedFiles = paths;
                this.uploadDialogActive = true;
            });
    }

    @action.bound deactivateUploadDialog() {
        this.uploadDialogActive = false;
        this.selectedFiles = [];
    }

    /**
     * Drag-and-drop is handled by another component higher in the hierarchy,
     * so we use this event handler to ensure drops aren't caught in our input field.
     */
    preventDrop = (e) => {
        e.preventDefault();
        return false;
    };

    handleFilePickerClose = () => {
        this.filePickerActive = false;
    };

    shareFiles = selected => {
        this.props.onFileShare(selected);
        this.handleFilePickerClose();
    };

    showFilePicker = () => {
        fileStore.clearSelection();
        this.filePickerActive = true;
    };

    onPaste = (ev) => {
        const chat = chatStore.activeChat;
        if (!chat) return;
        const { items } = ev.clipboardData;
        for (let i = 0; i < items.length; i++) {
            if (!items[i].type.startsWith('image/')) continue;
            const blob = items[i].getAsFile();
            if (!blob) return;
            ev.preventDefault();
            ev.stopPropagation();
            const reader = new FileReader();
            if (!confirm(t('title_uploadPastedFile'))) break;
            const tmpPath = path.join(os.tmpdir(), `peerio-${Date.now()}.${items[i].type.split('/')[1]}`);

            reader.onloadend = () => {
                const buffer = Buffer.from(reader.result);
                fs.writeFile(tmpPath, buffer, {}, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    chat.uploadAndShareFile(tmpPath, '', true);
                });
            };
            reader.readAsArrayBuffer(blob);
            break;
        }
    }

    renderFilePicker() {
        return (
            <FilePicker
                active={this.filePickerActive}
                onClose={this.handleFilePickerClose}
                onShare={this.shareFiles}
            />
        );
    }

    @observable snackbarRef;
    @action.bound setSnackbarRef(ref) {
        if (ref) this.snackbarRef = ref;
    }

    @computed get snackbarVisible() {
        if (this.snackbarRef) return this.snackbarRef.isVisible;
        return false;
    }

    @computed get jumpToBottomVisible() {
        return this.props.messageListScrolledUp ||
            (!clientApp.isReadingNewestMessages && chatStore.activeChat.unreadCount > 0);
    }

    renderJumpToBottom() {
        if (!this.jumpToBottomVisible) return null;
        const chat = chatStore.activeChat;
        return (
            <div className={css(
                'jump-to-bottom',
                { 'snackbar-visible': this.snackbarVisible }
            )}>
                <Button icon="keyboard_arrow_down" onClick={this.props.onJumpToBottom} />
                {chat.unreadCount > 0 && <div className="unread-badge">{chat.unreadCount}</div>}
            </div>
        );
    }

    render() {
        if (this.uploadDialogActive) {
            return (
                <UploadDialog
                    deactivate={this.deactivateUploadDialog}
                    files={this.selectedFiles}
                />
            );
        }
        const chat = chatStore.activeChat;
        return (
            <div className="message-input-wrapper" >
                <Snackbar className="snackbar-chat" ref={this.setSnackbarRef} />
                <div className="message-input" onDrop={this.preventDrop} onPaste={this.onPaste}>
                    <Menu
                        position="bottom-left"
                        icon="add_circle_outline"
                        tooltip={t('title_shareToChat')}
                    >
                        <MenuItem value="share"
                            caption={t('title_shareFromFiles')}
                            onClick={this.showFilePicker}
                        />
                        <MenuItem value="upload"
                            caption={t('title_uploadAndShare')}
                            onClick={this.activateUploadDialog}
                        />
                    </Menu>
                    {this.props.readonly
                        ? <div className="message-editor-empty" >&nbsp;</div>
                        : <MessageInputProseMirror
                            placeholder={this.props.placeholder}
                            onSend={this.props.onSend}
                        />
                    }
                    <Button
                        disabled={!chat || !chat.canSendAck}
                        icon="thumb_up"
                        onClick={this.props.onAck}
                        className="thumbs-up"
                        tooltip={t('button_thumbsUp')}
                        tooltipSize="small"
                        theme="no-hover"
                    />

                    {this.renderFilePicker()}
                    {this.renderJumpToBottom()}
                </div>
                {this.props.readonly ? <div className="backdrop" /> : null}
            </div>
        );
    }
}

module.exports = MessageInput;
