const React = require('react');

const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const { chatInviteStore, contactStore, User } = require('peerio-icebear');
const urls = require('~/config').translator.urlMap;

const css = require('classnames');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { Avatar, Button, Divider } = require('~/peer-ui');
const routerStore = require('~/stores/router-store');
const { ProgressBar } = require('~/peer-ui');

@observer
class ChannelInvite extends React.Component {
    @observable inProgress = false;

    @action.bound async acceptInvite() {
        const kegDbId = chatInviteStore.activeInvite.kegDbId;
        chatInviteStore.deactivateInvite();
        this.inProgress = true;
        try {
            await chatInviteStore.acceptInvite(kegDbId);
            routerStore.navigateTo(routerStore.ROUTES.chats);
        } catch (e) {
            console.error(e);
        }
        this.inProgress = false;
    }

    @action.bound rejectInvite() {
        chatInviteStore.rejectInvite(chatInviteStore.activeInvite.kegDbId);
    }

    toUpgrade() {
        return window.open(urls.upgrade);
    }

    get declineControl() {
        return (
            <div className={css('channel-invite', this.props.className)}>
                <div className="invite-content decline-content">
                    <div className="emoji-double emojione-32-diversity _270c-1f3fc" alt="✌️" title=":v:" />
                    <div className="text">
                        {t('title_userOut', { name: User.current.username })}
                    </div>
                </div>
            </div>
        );
    }

    render() {
        if (chatInviteStore.activeInvite && chatInviteStore.activeInvite.declined) return this.declineControl;
        if (this.inProgress) return <ProgressBar mode="indeterminate" />;
        const { activeInvite } = chatInviteStore;
        if (!activeInvite) return null;
        const { channelName, username } = activeInvite;
        return (
            <div className={css('channel-invite', this.props.className)}>
                <div className="invite-content">
                    <div className="emoji-double emojione-32-objects _1f389" alt="🎉" title=":tada:" />
                    <div className="text">
                        <T k="title_roomInviteHeading" />&nbsp;
                        <span className="channel-name"># {channelName}</span>
                    </div>

                    {User.current.channelsLeft > 0
                        ? <div className="buttons">
                            <Button label={t('button_decline')}
                                theme="affirmative secondary"
                                onClick={this.rejectInvite}
                            />
                            <Button label={t('button_accept')}
                                theme="affirmative"
                                onClick={this.acceptInvite}
                            />
                        </div>
                        : <div className="upgrade-prompt">
                            <div className="upgrade-content">
                                <span className="upgrade-text">
                                    👋 <T k="title_roomInviteUpgradeNotice" tag="span" />
                                </span>
                                <Button label={t('button_upgrade')}
                                    onClick={this.toUpgrade}
                                />
                            </div>
                            <Button label={t('button_declineInvite')}
                                theme="affirmative secondary"
                                onClick={this.rejectInvite}
                            />
                        </div>
                    }
                </div>

                {User.current.channelsLeft > 0
                    ? <div className="participants">
                        <Divider />
                        <div className="participant-list">
                            <span>
                                <T k="title_hostedBy" className="hosted-by" tag="span" />&nbsp;
                                <span className="host-username">{contactStore.getContact(username).fullName}</span>
                            </span>
                            <div className="avatars">
                                <Avatar username={username} clickable tooltip />
                            </div>
                        </div>
                    </div>
                    : null
                }
            </div>
        );
    }
}

module.exports = ChannelInvite;
