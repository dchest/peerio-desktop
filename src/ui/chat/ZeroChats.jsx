const React = require('react');
const { when } = require('mobx');
const { observer } = require('mobx-react');
const { chatStore, chatInviteStore } = require('peerio-icebear');
const routerStore = require('~/stores/router-store');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const PlusIcon = require('~/ui/shared-components/PlusIcon');

@observer
class ZeroChats extends React.Component {
    componentDidMount() {
        this.disposer = when(
            // TODO: refactor when SDK is there for chat invites
            () => !!chatStore.chats.length || !!chatInviteStore.received.length,
            () => {
                routerStore.navigateTo(routerStore.ROUTES.chats);
                this.disposer = null;
            }
        );
    }

    componentWillUnmount() {
        if (this.disposer) this.disposer();
    }

    goToAddChat() {
        routerStore.navigateTo(routerStore.ROUTES.newChat);
    }

    goToAddChannel() {
        routerStore.navigateTo(routerStore.ROUTES.newChannel);
    }

    render() {
        return (
            <div className="zero-chats-container">
                <div className="zero-chats-content">
                    <div className="header">
                        <T k="title_zeroChat" tag="div" className="welcome-title" />
                        <T k="title_zeroChatSubtitle" tag="div" className="subtitle" />
                    </div>

                    <div className="instructions-container">
                        <div className="instructions create-rooms">
                            <div className="text">
                                <div className="text-header">
                                    <PlusIcon onClick={this.goToAddChannel} label={t('button_createRooms')} />
                                </div>
                                <div className="text-description">
                                    <T k="title_roomsDescription1" tag="div" className="description-large" />
                                    <T k="title_roomsDescription2" tag="div" className="description-small" />
                                    <T k="title_roomsDescription3" tag="div" className="description-small" />
                                </div>
                            </div>
                            <div className="image">
                                <img src="./static/img/zero-state-rooms.png" />
                                <img src="./static/img/zero-state-bg-rooms.png" className="background" />
                            </div>
                        </div>

                        <div className="instructions create-dms">
                            <div className="image">
                                <img src="./static/img/zero-state-dms.png" />
                                <img src="./static/img/zero-state-bg-dms.png" className="background" />
                            </div>
                            <div className="text">
                                <div className="text-header">
                                    <PlusIcon onClick={this.goToAddChat} label={t('button_createDMs')} />
                                </div>
                                <div className="text-description">
                                    <T k="title_dmDescription1" tag="div" className="description-large" />
                                    <T k="title_dmDescription2" tag="div" className="description-small" />
                                    <T k="title_dmDescription3" tag="div" className="description-small" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = ZeroChats;
