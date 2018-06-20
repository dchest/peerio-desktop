// @ts-check
const React = require('react');
const { chatStore, contactStore } = require('peerio-icebear');
const Suggestions = require('./Suggestions');
const { Avatar } = require('peer-ui');
const { chatSchema } = require('~/helpers/chat/prosemirror/chat-schema');

const { EditorView } = require('prosemirror-view'); // eslint-disable-line no-unused-vars, (for typechecking)
const { Node } = require('prosemirror-model'); // eslint-disable-line no-unused-vars, (for typechecking)

/**
 * @param {() => EditorView} getView
 */
function makeUsernameSuggestions(getView) {
    return new Suggestions({
        // Match (but don't include) the start of the input, or any kind of
        // whitespace, or the unicode object replacement character (which we use
        // in the Suggestions to replace leaf nodes that don't contain text),
        // then an @ optionally followed by characters in a valid username
        matchers: [/(?<=^|\s|\u{fffc})@([a-zA-Z_]{0,32})$/u],
        source(matchData) {
            const chat = chatStore.activeChat;
            if (!chat || !chat.otherParticipants.length) return null;
            return contactStore.filter(matchData.match[1].toLocaleLowerCase(), chat.otherParticipants);
        },
        formatter: contact => (
            <span>
                <Avatar size="tiny" contact={contact} />
                <span className="semibold">@{contact.username}</span> - {contact.fullName}
            </span>
        ),
        keySource: 'username',
        onAcceptSuggestion: (matchData, acceptedSuggestion) => {
            const view = getView();
            if (view) {
                view.dispatch(view.state.tr.replaceWith(
                    matchData.from,
                    matchData.to,
                    [
                        chatSchema.node('mention', { username: acceptedSuggestion.username }),
                        chatSchema.text(' ')
                    ]
                ));
            }
        }
    });
}

module.exports = makeUsernameSuggestions;
