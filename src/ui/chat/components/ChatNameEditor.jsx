const React = require('react');
const { action } = require('mobx');
const { observer } = require('mobx-react');
const BetterInput = require('~/ui/shared-components/BetterInput');
const { chatStore, config } = require('peerio-icebear');
const { t } = require('peerio-translator');

@observer
class ChatNameEditor extends React.Component {
    @action.bound setRef(ref) {
        if (ref) this.inputRef = ref;
        if (this.props.innerRef) this.props.innerRef(ref);
    }

    acceptNameEdit = (val) => {
        try {
            if (this.props.purpose) {
                chatStore.activeChat.changePurpose(val);
            } else {
                chatStore.activeChat.rename(val);
            }
        } catch (err) {
            console.error(err);
        }
    };

    render() {
        const chat = chatStore.activeChat;
        if (!chat || !chat.chatHead) return null;

        const hint = this.props.purpose ? 'title_chatPurposeHint' : 'title_chatNameHint';
        const label = this.props.purpose ? 'title_purpose' : 'title_title';
        const value = this.props.purpose ? chat.chatHead.purpose : chat.chatHead.chatName;
        const displayValue = this.props.purpose ? chat.purpose : chat.name;
        return (
            <BetterInput label={this.props.showLabel ? t(label) : null}
                hint={t(hint)}
                className={this.props.className}
                onFocus={this.props.onFocus}
                onBlur={this.props.onBlur}
                onReject={null}
                onAccept={this.acceptNameEdit}
                onKeyDown={this.props.onKeyDown}
                innerRef={this.setRef}
                value={value}
                displayValue={displayValue}
                tabIndex={this.props.tabIndex}
                readOnly={this.props.readOnly}
                multiline={this.props.multiline}
                maxLength={this.props.purpose ? config.chat.maxChatPurposeLength : config.chat.maxChatNameLength}
            />

        );
    }
}

module.exports = ChatNameEditor;
