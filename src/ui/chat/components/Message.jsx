/* eslint no-warning-comments: "warn" */

const React = require('react');
const { observer } = require('mobx-react');
const { observable, action, runInAction } = require('mobx');
const css = require('classnames');
const { t } = require('peerio-translator');
const { contactStore, systemMessages, User } = require('peerio-icebear');
const { Button, MaterialIcon, Menu, MenuItem } = require('peer-ui');
const AvatarWithPopup = require('~/ui/contact/components/AvatarWithPopup');
const ContactProfile = require('~/ui/contact/components/ContactProfile');
const { time } = require('~/helpers/formatter');
const { chatSchema, Renderer } = require('~/helpers/chat/prosemirror/chat-schema');
const urls = require('~/config').translator.urlMap;
const uiStore = require('~/stores/ui-store');
const InlineFiles = require('./InlineFiles');
const UrlPreview = require('./UrlPreview');
const UrlPreviewConsent = require('./UrlPreviewConsent');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');
const InlineSharedFolder = require('../../files/components/InlineSharedFolder');


/** @type {
        (msg : {lastProcessedVersion, version, processedText : { __html : string }, text : string})
            => { __html : string }
    }
*/
let legacyProcessMessageForDisplay;


/**
 * IMPORTANT:
 * MessageList.jsx scroll retention logic relies on root element of this component to have
 * class name 'message-content-wrapper' at the first position in class list
 *
 * @augments {React.Component<{
        /// the active chat, as defined in icebear's chatStore singleton (chatStore.activeChat)
        /// peerio-icebear/src/models/chats/chat.js
        chat : any

        /// the message proper, defined in peerio-icebear/src/models/chats/message.js
        message : any

        /// the message.groupWithPrevious field
        light : boolean

        /// callback injected by MessageList, to ensure we stick to the bottom of the chat view.
        onImageLoaded : () => void
    }, {}>}
 */
@observer
class Message extends React.Component {
    @observable.shallow errorData = null;
    @observable errorMenuVisible = false;
    @observable allowShowSendingState = false;

    componentDidMount() {
        if (!this.props.message.sending) return;
        this.timer = setTimeout(() => {
            if (this.props.message.sending) this.allowShowSendingState = true;
        }, 3000);
    }

    componentWillUnmount() {
        if (this.timer) clearTimeout(this.timer);
    }

    setContactProfileRef = (ref) => {
        if (ref) this.contactProfileRef = ref;
    }

    @observable clickedContact;
    @action.bound onClickContact(ev) {
        this.clickedContact = contactStore.getContact(ev.target.attributes['data-username'].value);
        this.contactProfileRef.openDialog();
    }

    /**
     * Given an Icebear message (which may or may not have a richText field), return the sanitized HTML representation.
     * @param {{
         lastProcessedVersion,
         version,
         processedText : { __html : string },
         text: string,
         richText?: Object
       }} message An Icebear message keg.
    * @returns {JSX.Element} The processed rich text as a DOM fragment if we successfully parsed it, or else an object
    *                        with an HTML string ready to directly be used in `dangerouslySetInnerHTML`.
    */
    getMessageComponent(message) {
        const richText = message.richText;
        if (richText &&
            (typeof richText === 'object') &&
            (richText.type === 'doc') &&
            (richText.content)
        ) {
            try {
                // Creating the ProseMirror node from the JSON may seem like an
                // added step/layer of indirection, but it lets us validate the
                // rich text payload and ensure it conforms to the schema.
                const proseMirrorNode = chatSchema.nodeFromJSON(richText);

                // Note that an error in the renderer component won't get caught
                // by this try-catch -- it's not actually invoked in this stack
                // frame.
                return (<Renderer
                    fragment={proseMirrorNode.content}
                    onClickContact={this.onClickContact}
                    currentUser={User.current.username}
                />);
            } catch (e) {
                console.warn(`Couldn't deserialize message rich text:`, e);
            }
        }


        if (typeof message.text !== 'string') {
            // HACK: React error boundaries only catch errors in children, so we
            // wrap this throw in a createElement.
            return React.createElement(
                () => { throw new Error("Can't render rich text and message has no plaintext!"); }
            );
        }

        // lazily load legacy message processing logic. the emojione file it
        // requires is pretty huge and slows startup, so we should only require
        // it if it's necessary.
        legacyProcessMessageForDisplay = legacyProcessMessageForDisplay ||
            require('~/helpers/chat/legacy-process-message-for-display').processMessageForDisplay;
        // eslint-disable-next-line react/no-danger
        return <p dangerouslySetInnerHTML={legacyProcessMessageForDisplay(message)} className="selectable" />;
    }

    renderSystemData(m) {
        // !! SECURITY: sanitize if you move this to something that renders dangerouslySetInnerHTML
        if (!m.systemData) return null;

        if (m.systemData.action === 'videoCall' && m.systemData.link) {
            const { link } = m.systemData;
            const shortLink = link.replace('https://', '');
            const videoCallMsg = systemMessages.getSystemMessageText(m);
            return (
                <div>
                    <p className="video-system-message">{videoCallMsg}</p>
                    <p>
                        <MaterialIcon icon="videocam" className="video-icon" />
                        <a href={link}>{shortLink}</a>
                    </p>
                </div>
            );
        }
        return (
            <div className="system-message selectable">
                <p>{systemMessages.getSystemMessageText(m)}</p>
                {
                    m.systemData.action === 'join' &&
                    <IdentityVerificationNotice extraMargin />
                }
            </div>
        );
    }
    openMessageInfo = () => {
        uiStore.selectedMessage = this.props.message;
        uiStore.prefs.chatSideBarIsOpen = false;
    };
    renderReceipts(m) {
        if (!m.receipts || !m.receipts.length) {
            return <div key={`${m.tempId || m.id}receipts`} className="receipt-wrapper" />;
        }
        // yeah, we skip receipts signature errors so the 3 + X math won't really work that well in some cases
        // but it's ok, signature error is not a common thing, and there's a task in tracker to deal with this someday
        const renderMe = [];
        // if there's 1-6 receipts, we just render them
        // if more then 6 - we render 3 and (+X) number
        const limit = m.receipts.length > 6 ? 3 : m.receipts.length;
        for (let i = 0; i < limit && m.receipts.length > i; i++) {
            const r = m.receipts[i];
            if (r.receipt.signatureError) continue;
            renderMe.push(<AvatarWithPopup
                key={r.username}
                contact={contactStore.getContact(r.username)}
                size="tiny"
                tooltip
            />);
        }

        return (
            <div key={`${m.tempId || m.id}receipts`} className="receipt-wrapper">
                {renderMe}
                {m.receipts.length > 6
                    && <div onClick={this.openMessageInfo} className="plus-receipts">+{m.receipts.length - 3}</div>}
            </div>
        );
    }

    componentDidCatch(error, info) {
        runInAction(() => { this.errorData = { error, info }; });
    }

    render() {
        const m = this.props.message;

        if (this.errorData) { return renderError(this.errorData, m); }

        const invalidSign = m.signatureError === true;

        const MessageComponent = this.getMessageComponent(m);

        return (
            <div className={
                css('message-content-wrapper', {
                    'invalid-sign': invalidSign,
                    'send-error': m.sendError,
                    light: this.props.light,
                    selected: m === uiStore.selectedMessage
                })}>
                <div className="message-content-wrapper-inner">
                    {this.props.light
                        ? <div className="timestamp">{time.format(m.timestamp).split(' ')[0]}</div>
                        : <AvatarWithPopup contact={m.sender} size="medium" tooltip />}
                    <div className="message-content">
                        {
                            this.props.light
                                ? null
                                : <div className="meta-data">
                                    <div className="user selectable">
                                        {m.sender.fullName}&nbsp;
                                        <span className="username selectable">
                                            {m.sender.username}
                                        </span>
                                    </div>
                                    <div className="timestamp selectable">{time.format(m.timestamp)}</div>
                                </div>
                        }
                        <div className="message-body">
                            {m.systemData || m.files || m.folders
                                ? null
                                : MessageComponent}
                            {m.files || m.folders ? (
                                <div className="inline-files-and-optional-message">
                                    {m.folders
                                        ? m.folders.map(f => {
                                            return (<InlineSharedFolder
                                                key={f} folderId={f}
                                                sharedByMe={m.sender.username === User.current.username} />);
                                        })
                                        : null}
                                    {m.files ?
                                        <InlineFiles
                                            files={m.files}
                                            onImageLoaded={this.props.onImageLoaded} />
                                        : null}
                                    {!!m.text &&
                                        <div className="optional-message">
                                            {MessageComponent}
                                        </div>}
                                </div>
                            ) : null}
                            {
                                /* SECURITY: sanitize if you change this to  render in dangerouslySetInnerHTML */
                                this.renderSystemData(m)
                            }
                            {m.hasUrls
                                ? m.externalImages.map(
                                    (urlData, ind) => (<UrlPreview
                                        key={ind} // eslint-disable-line react/no-array-index-key
                                        urlData={urlData}
                                        onImageLoaded={this.props.onImageLoaded}
                                    />)
                                ) : null}
                            {!uiStore.prefs.externalContentConsented && m.hasUrls &&
                                <UrlPreviewConsent />
                            }
                        </div>
                        {/* m.inlineImages.map(url => (
                            <img key={url} className="inline-image" onLoad={this.props.onImageLoaded} src={url} />)) */}
                        {m.sendError ?
                            <Menu
                                className="send-error-menu"
                                customButton={
                                    <div className="send-error-text-container">
                                        <MaterialIcon icon="error" />
                                        <span className="send-error-message">
                                            {t('error_messageSendFail')}
                                        </span>
                                    </div>
                                }
                                position="top-right">
                                <MenuItem
                                    caption={t('button_retry')}
                                    onClick={() => m.send()} />
                                <MenuItem
                                    caption={t('button_delete')}
                                    onClick={() => this.props.chat.removeMessage(m)} />
                            </Menu>
                            : null
                        }
                    </div>
                    {invalidSign ? <MaterialIcon icon="error_outline_circle" className="warning-icon" /> : null}
                    {this.renderReceipts(m)}

                </div>
                {invalidSign ?
                    <div className="invalid-sign-warning">
                        <div className="content">{t('error_invalidMessageSignature')}</div>
                        <Button
                            href={urls.msgSignature}
                            label={t('title_readMore')}
                        />
                    </div>
                    : null
                }

                {this.allowShowSendingState && m.sending ? <div className="sending-overlay" /> : null}

                <ContactProfile
                    ref={this.setContactProfileRef}
                    contact={this.clickedContact}
                />
            </div>
        );
    }
}

/**
 *
 * @param {{ error : Error, info : { componentStack : string }}} errorData
 * @param {*} msg TODO/TS: icebear message
 */
function renderError(errorData, msg) {
    console.error('Error rendering the following message:');
    console.dir(msg);
    // If you change any tags or styles in here, make sure all text remains selectable
    // (The CSS property "user-select" isn't inherited!)
    return (
        <div className="message-content-wrapper render-error">
            <div className="message-content-wrapper-inner">
                <div className="message-content">
                    <div className="message-body">
                        <p><strong>{t('error_messageErrorHeader')}:</strong></p>
                        <p>{errorData.error.toString()}</p><br />
                        <p><strong>{t('error_messageErrorMessageInfo')}:</strong></p>
                        { // We can't just stringify the message keg, it's not plain data and can be circular
                            /* eslint-disable prefer-template, react/no-array-index-key */
                            msg ?
                                <ul>
                                    {[
                                        `${t('error_messageErrorSenderName')}: ` +
                                        (msg.sender && msg.sender.username),
                                        `${t('error_messageErrorMessageId')}: ${msg.id}`,
                                        `${t('error_messageErrorTimestamp')}: ` +
                                        (msg.timestamp && msg.timestamp.toLocaleString()),
                                        `${t('error_messageErrorMessagePlaintext')}: ${msg.text}`,
                                        `${t('error_messageErrorMessageRichtext')}: ` +
                                        (msg.richText && JSON.stringify(msg.richText, undefined, 2))
                                    ].map((l, i) => <li key={i}>{l}</li>)}
                                </ul>
                                : t('error_messageErrorNotAvailable')
                            /* eslint-enable prefer-template, react/no-array-index-key */
                        }<br />
                        <p><strong>{t('error_messageErrorAdditionalInfo')}:</strong></p>
                        <p>{errorData.info && errorData.info.componentStack}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

module.exports = Message;
