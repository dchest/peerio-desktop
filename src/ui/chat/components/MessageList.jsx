const React = require('react');
const { reaction, computed } = require('mobx');
const { observer } = require('mobx-react');
const { Avatar, ProgressBar } = require('~/peer-ui');
const T = require('~/ui/shared-components/T');
const Message = require('./Message');
const { chatStore, clientApp } = require('peerio-icebear');
const { t } = require('peerio-translator');
const PendingDM = require('~/ui/chat/components/PendingDM');
const IdentityVerificationNotice = require('~/ui/chat/components/IdentityVerificationNotice');

@observer
class MessageList extends React.Component {
    loadTriggerDistance = 20;
    stickDistance = 50;
    lastRenderedChatId = null;

    @computed get displayParticipants() {
        const chat = chatStore.activeChat;
        if (!chat) return [];
        if (chat.isChannel) return chat.allParticipants;
        return chat.otherParticipants;
    }

    componentWillMount() {
        this.stickToBottom = true;
        // reaction to fix scroll position when scrolling up
        this._topLoadReaction = reaction(() => chatStore.activeChat && chatStore.activeChat.loadingTopPage,
            (loading) => {
                if (loading) {
                    this.lastTopElement = null;
                    for (let i = 0; i < this.containerRef.childNodes.length; i++) {
                        const el = this.containerRef.childNodes[i];
                        if (el.classList[0] !== 'message-content-wrapper') continue;
                        this.lastTopElement = el;
                        break;
                    }
                    this.lastTopElementOffset = this.lastTopElement ? this.lastTopElement.offsetTop : 0;
                    return;
                }
                if (this.lastTopElement) {
                    if (!this.lastTopElement) return;
                    // todo: animate
                    this.containerRef.scrollTop = this.lastTopElement.offsetTop - this.lastTopElementOffset - 25;
                    this.lastTopElement = null;
                }
            });
        // reaction to jump to recent from history mode
        this._initialLoadReaction = reaction(
            () => chatStore.activeChat && chatStore.activeChat.loadingInitialPage,
            () => {
                this.stickToBottom = true;
                this.lastTopElement = null;
            }
        );
        // reaction to paging down to cancel top scroll fix
        this._botLoadReaction = reaction(
            () => chatStore.activeChat && chatStore.activeChat.loadingBottomPage,
            () => { this.lastTopElement = null; }
        );
    }

    componentWillUnmount() {
        clientApp.isInChatsView = false;
        this._topLoadReaction();
        this._botLoadReaction();
        this._initialLoadReaction();
    }

    componentDidMount() {
        clientApp.isInChatsView = true;
        this.scrollToBottomIfNeeded();
    }

    componentDidUpdate() {
        this.scrollToBottomIfNeeded();
    }

    scrollToBottom = () => {
        window.requestAnimationFrame(this.smoothScrollStep);
    };

    smoothScrollStep = () => {
        const el = this.containerRef;
        if (!el) return;
        const goal = el.scrollHeight - el.clientHeight;
        if (el.scrollTop >= goal - 2) return;
        el.scrollTop += (goal - el.scrollTop) / 2 + 1;
        window.requestAnimationFrame(this.smoothScrollStep);
    }

    instantlyScrollToBottom = () => {
        const el = this.containerRef;
        if (!el) return;
        el.scrollTop = el.scrollHeight - el.clientHeight;
    };

    scrollToBottomIfNeeded() {
        if (!chatStore.activeChat) {
            this.stickToBottom = true;
            return;
        }
        // check if chat has changed since last render
        if (this.lastRenderedChatId !== chatStore.activeChat.id) {
            this.lastRenderedChatId = chatStore.activeChat.id;
            this.stickToBottom = true;
            this.instantlyScrollToBottom();
            return;
        }
        if (this.stickToBottom) setTimeout(this.scrollToBottom);
    }

    onImageLoaded = () => {
        if (this.stickToBottom && !chatStore.activeChat.canGoDown) this.scrollToBottom();
    }

    // todo: investigate why throttling causes lags when scrolling with trackpad at big velocity
    handleScroll = // _.throttle(
        () => {
            // console.log('SCROLL');
            // we can't handle scroll if content height is too small
            if (this.containerRef.scrollHeight <= this.containerRef.clientHeight) return;

            const distanceToBottom = this.containerRef.scrollHeight - this.containerRef.scrollTop
                - this.containerRef.clientHeight;
            const distanceToTop = this.containerRef.scrollTop;
            // console.log(distanceToTop, distanceToBottom);
            // detecting sticking state
            this.stickToBottom = distanceToBottom < this.stickDistance && !chatStore.activeChat.canGoDown;
            // triggering page load
            if (distanceToBottom < this.loadTriggerDistance) {
                //  console.log('TRIGGER');
                chatStore.activeChat.loadNextPage();
            }
            if (distanceToTop < this.loadTriggerDistance) {
                // console.log('TRIGGER');
                chatStore.activeChat.loadPreviousPage();
            }
        }// , 150, { leading: true, trailing: true });

    setContainerRef = (r) => {
        this.containerRef = r;
    };

    /**
     * IMPORTANT:
     * Scroll position retention logic counts on
     * 1. Message items to have className "message-content-wrapper"as their FIRST class mentioned
     * 2. No OTHER type of items to have the same class name at the first position
     */
    renderMessages() {
        const chat = chatStore.activeChat;
        const ret = [];
        if (chat.canGoUp) {
            ret.push(<div key="top-progress-bar" className="progress-wrapper">
                {chat.loadingTopPage
                    ? <ProgressBar type="circular" mode="indeterminate"
                        theme="multicolor"
                        className="messages-inline-progress-bar" />
                    : null}
            </div>);
        }
        const msgs = chat.messages;
        const limboMsgs = chat.limboMessages;
        const totalLength = msgs.length + limboMsgs.length;
        for (let i = 0; i < totalLength; i++) {
            const m = i < msgs.length ? msgs[i] : limboMsgs[i - msgs.length];
            if (m.firstOfTheDay) {
                const ts = m.timestamp.toLocaleDateString();
                ret.push(<div key={`marker${i}${ts}${m.id}`} className="marker-wrapper">
                    <div className="marker" />
                    <div className="content">{ts === new Date().toLocaleDateString() ? t('title_today') : ts}</div>
                    <div className="marker" />
                </div>);
            }
            let key = m.tempId || m.id;
            if (i >= msgs.length) {
                key += 'limbo';
            }
            ret.push(<Message key={key} message={m} chat={chat} light={m.groupWithPrevious}
                onImageLoaded={this.onImageLoaded} />);
            if (i < (msgs.length - 1) && chat.newMessagesMarkerPos === m.id && chat.showNewMessagesMarker) {
                ret.push(<div key={`newmsgsmarker${i}${m.id}`} className="marker-wrapper new-messages">
                    <div className="marker" />
                    <div className="content">{t('title_newMessages')}</div>
                </div>);
            }
        }

        if (chat.canGoDown) {
            ret.push(<div key="bot-progress-bar" className="progress-wrapper">
                {chat.loadingBottomPage
                    ? <ProgressBar type="circular" mode="indeterminate"
                        theme="multicolor"
                        className="messages-inline-progress-bar" />
                    : null}
            </div>);
        }

        return ret;
    }

    renderChatStart() {
        const chat = chatStore.activeChat;

        if (chat.isChatCreatedFromPendingDM) {
            return (
                <div className="messages-start">
                    <PendingDM buttonsHidden />
                </div>
            );
        }

        if (chat.canGoUp || !chat.initialPageLoaded) return null;
        return (
            <div className="messages-start">
                <div className="avatars">
                    {this.displayParticipants.map(
                        c => <Avatar size="large" key={c.username} contact={c} tooltip clickable />
                    )}
                </div>
                <T k={chat.isChannel ? 'title_chatBeginningRoom' : 'title_chatBeginning'} tag="div" className="title">
                    {{
                        chatName: chat.name
                    }}
                </T>
                <IdentityVerificationNotice />
            </div>
        );
    }

    render() {
        if (!chatStore.activeChat) return null;
        return (
            <div className="messages-current scrollable"
                onScroll={this.handleScroll}
                ref={this.setContainerRef}
            >
                {this.renderChatStart()}
                {chatStore.activeChat.loadingInitialPage
                    ? <ProgressBar type="circular" mode="indeterminate"
                        theme="multicolor"
                        className="messages-progress-bar" />
                    : this.renderMessages()
                }
            </div>
        );
    }
}


module.exports = MessageList;
