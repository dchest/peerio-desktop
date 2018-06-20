// @ts-check

/* eslint no-warning-comments: ["error", { "terms": ["!FIX"] }] */

/*

For simplicity, this component's render method returns an array of components,
using React 16's capacity to return unwrapped fragments.
(see https://egghead.io/lessons/react-render-multiple-elements-without-a-wrapping-element-in-a-component-in-react-16)

The parent component, MessageInput, also has its own components to render in a
flex group, so this lets them all mount inline. This could be confusing, so we
might want to revisit this in a later refactor.

Note that all components we return in the array need a unique key (which only
needs to be unique to this particular component, not siblings in other files)
so we give the suggests wrapper, emoji picker button, emoji picker and input
field their own named keys manually.

*/

const React = require('react');
const { observable, observe, action } = require('mobx');
const { observer } = require('mobx-react');

const { Node } = require('prosemirror-model');
const { EditorView } = require('prosemirror-view');
const {
    EditorState,
    Selection,
    Plugin, // eslint-disable-line no-unused-vars, (used for typechecking)
    Transaction // eslint-disable-line no-unused-vars, (used for typechecking)
} = require('prosemirror-state');
const { keymap } = require('prosemirror-keymap');

const { chatSchema, isWhitespaceOnly, emptyState } = require('~/helpers/chat/prosemirror/chat-schema');
const { chatPlugins } = require('~/helpers/chat/prosemirror/chat-plugins');
const { placeholder } = require('~/helpers/chat/prosemirror/placeholder');
const { linkify } = require('~/helpers/chat/prosemirror/linkify-text');
const { ensureMentions } = require('~/helpers/chat/prosemirror/ensure-mentions');

const { t } = require('peerio-translator');
const { Button } = require('peer-ui');
const { chatStore } = require('peerio-icebear');
const uiStore = require('~/stores/ui-store');

const EmojiPicker = require('~/ui/emoji/Picker');
const makeUsernameSuggestions = require('./suggestions/UsernameSuggestions');
const makeEmojiSuggestions = require('./suggestions/EmojiSuggestions');

// eslint-disable-next-line no-unused-vars, (used for typechecking)
const Suggestions = require('./suggestions/Suggestions');


// ---------------------------------
// BEGIN KIND OF JANKY CACHING CODE:

// We cache the emoji picker the first time we need it, and never change it.
// This is not great for testability of the input component; it may be worth
// revisiting later.
let cachedPicker;

// Because we're caching the emoji picker as a global, we need to also keep
// track of its parent input component, which would normally pass down callbacks
// for picking the emoji and handling hiding the picker.
let currentInputInstance;

function onEmojiPicked(emoji) {
    currentInputInstance.hideEmojiPicker();

    /** @type {EditorView} */
    const view = currentInputInstance.editorView;
    if (!view) return;

    insertEmoji(emoji, view.state, view.dispatch);
    view.focus();
}

/**
 * @param {{shortname : string}} emoji
 * @param {EditorState} state
 * @param {(tr : Transaction) => void} dispatch
 */
function insertEmoji(emoji, state, dispatch) {
    const type = chatSchema.nodes.emoji;
    const { $from } = state.selection;
    if (!$from.parent.canReplaceWith($from.index(), $from.index(), type)) return false;
    if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(type.create({
            shortname: emoji.shortname
        })));
    }
    return true;
}
// ---------------------------------


// Reminder that the JSDoc modifiers @private and @readonly below are basically
// for fun, since we're not generating documentation and TypeScript can't
// enforce them in JS files.

/**
 * @augments {React.Component<{
        placeholder : string
        onSend : (richText : Object, legacyText : string) => void
    }, {}>}
 */
@observer
class MessageInputProseMirror extends React.Component {
    @observable emojiPickerVisible = false;

    /**
     * The ProseMirror editor view. Should only be assigned when we get a render
     * ref, and destroyed when the component will unmount.
     * @private
     * @type {EditorView | null}
     */
    editorView = null;

    /**
     * ProseMirror plugins that we won't need to reconfigure.
     * @readonly
     * @private
     * @type {Plugin[]}
     */
    basePlugins;

    /**
     * @readonly
     * @private
     * @type {Suggestions}
     */
    usernameSuggestions;

    /**
     * @readonly
     * @private
     * @type {Suggestions}
     */
    emojiSuggestions;

    getEmptyState() {
        return EditorState.create({
            doc: emptyState,
            plugins: this.getConfiguredPlugins({ placeholderText: this.props.placeholder })
        });
    }

    /**
     * Get the full set of plugins for the ProseMirror editor, including those
     * which can be reconfigured or aren't necessarily known while the
     * constructor is running.
     */
    getConfiguredPlugins(/** @type {{ placeholderText : string }} */{ placeholderText }) {
        return [
            placeholder(placeholderText, emptyState),
            ...this.basePlugins
        ];
    }

    constructor() {
        super();

        currentInputInstance = this;
        if (!cachedPicker) {
            cachedPicker = (<EmojiPicker
                key="emoji-picker"
                onPicked={onEmojiPicked}
                onBlur={() => { currentInputInstance.hideEmojiPicker(); }}
            />);
        }

        this.usernameSuggestions = makeUsernameSuggestions(() => this.editorView);
        this.emojiSuggestions = makeEmojiSuggestions(() => this.editorView);

        // Note the ordering: the suggestions plugin has to come before the
        // general Enter key handling, since we want the former to handle Enter
        // when suggestions are visible.
        this.basePlugins = [
            this.usernameSuggestions.plugin,
            this.emojiSuggestions.plugin,
            keymap({
                // we have to declare this command in the class body since we're
                // using `this.props.onSend` and `this.clearEditor`.
                Enter: (
                    // TODO/TS: these can be added to the PM typings on definitelytyped
                    /** @type {EditorState} */state,
                    /** @type {(tr : Transaction) => void} */dispatch,
                    /** @type {EditorView} */view
                ) => {
                    if (isWhitespaceOnly(state.doc)) return false;

                    if (dispatch) {
                        const linkifiedState = linkify(state);
                        const mentionifiedState = ensureMentions(linkifiedState);

                        // For the plaintext version of our message, we grab the
                        // view element's `textContent` -- ProseMirror nodes
                        // offer their own `textContent` getter, but they only
                        // concatenate the _text_ nodes underneath them, not
                        // anything else -- so stuff like emoji and mentions
                        // wouldn't get included.

                        // Incidentally, getting the DOM `textContent` correctly
                        // retrieves emoji even though they're rendered as <img>
                        // tags in the view, because we add the emoji text as a
                        // child of the <img>, ie.
                        // <img src="{emojione image}">{emoji unicode chars}</img>.
                        //
                        // This is (probably) valid DOM; the tag's contents
                        // aren't rendered, just the image proper. (That said,
                        // React forbids doing this.) We could alternately use
                        // <spans> with a background-image or pseudo-element,
                        // similar to eg. Slack.
                        this.props.onSend(mentionifiedState.doc.toJSON(), view.dom.textContent);
                        this.clearEditor();
                    }

                    return true;
                }
            }),
            ...chatPlugins
        ];
    }

    componentDidMount() {
        this.disposer = observe(chatStore, 'activeChat', change => {
            this.backupUnsentMessage(change.oldValue);
            this.restoreUnsentMessage(change.newValue);
        }, true);
    }

    componentWillUnmount() {
        this.backupUnsentMessage(chatStore.activeChat);
        this.disposer();
        uiStore.messageInputEditorView = null;
        if (this.editorView) {
            this.editorView.destroy();
        }
        this.usernameSuggestions.cleanup();
        this.emojiSuggestions.cleanup();
    }

    componentWillReceiveProps(newProps) {
        if (this.props.placeholder !== newProps.placeholder) {
            this.editorView.updateState(this.editorView.state.reconfigure({
                plugins: this.getConfiguredPlugins({
                    placeholderText: newProps.placeholder
                })
            }));
        }
    }

    @action.bound
    showEmojiPicker() {
        this.usernameSuggestions.dismiss();
        this.emojiSuggestions.dismiss();
        this.emojiPickerVisible = true;
    }

    @action.bound
    hideEmojiPicker() {
        this.emojiPickerVisible = false;
    }

    clearEditor = () => {
        this.usernameSuggestions.dismiss();
        this.emojiSuggestions.dismiss();
        if (this.editorView) this.editorView.updateState(this.getEmptyState());
    };

    backupUnsentMessage(chat) {
        if (!chat || !this.editorView) return;
        uiStore.unsentMessages[chat.id] = this.editorView.state.doc.toJSON();
    }

    restoreUnsentMessage(chat) {
        // TODO: revisit the need for this try/catch? it's a holdover from Quill
        try {
            const view = this.editorView;
            if (!view) return;

            if (!chat) {
                this.clearEditor();
                return;
            }

            const savedState = uiStore.unsentMessages[chat.id];
            if (!savedState) {
                this.clearEditor();
                return;
            }

            view.state.doc = Node.fromJSON(chatSchema, savedState);
            view.setProps({ state: view.state.apply(view.state.tr.setSelection(Selection.atEnd(view.state.doc))) });
            view.focus();
        } catch (err) {
            console.error(`Can't restore unsent message:`, err);
            // don't care, swallowing errors because don't want to deal with all the mounted/unmounted/created states
        }
    }

    /**
     * @param {HTMLDivElement} el
     */
    @action.bound
    mountProseMirror(el) {
        if (!el) {
            uiStore.messageInputEditorView = null;
            return;
        }
        this.editorView = new EditorView(el, { state: this.getEmptyState() });
        uiStore.messageInputEditorView = this.editorView;
    }

    onInputBlur = () => {
        this.usernameSuggestions.dismiss();
        this.emojiSuggestions.dismiss();
    }

    render() {
        /*
         * In theory, we might want to enforce that only one suggestions
         * component is visible at a time; in practice, this shouldn't really
         * come up, assuming the conditions (regex patterns) to show them are
         * mutually exclusive. If need be, we could pick one to show -- maybe
         * with a computed that will find() the first suggestion instance for
         * which suggestion.visible is true.
         */
        const UsernameSuggestions = this.usernameSuggestions.Component;
        const EmojiSuggestions = this.emojiSuggestions.Component;

        return [
            <UsernameSuggestions key="username-suggestions" />,
            <EmojiSuggestions key="emoji-suggestions" />,
            <div
                key="editor"
                id="messageEditor"
                className="message-editor-container-prosemirror"
                onBlur={this.onInputBlur}
                ref={this.mountProseMirror}
            />,
            <Button
                key="emoji-picker-open-button"
                icon="mood"
                disabled={this.emojiPickerVisible}
                onClick={this.showEmojiPicker}
                tooltip={t('button_emojis')}
                tooltipSize="small"
                theme="no-hover"
            />,
            this.emojiPickerVisible ? cachedPicker : null
        ];
    }
}

module.exports = MessageInputProseMirror;
