const React = require('react');
const { autorunAsync, observable } = require('mobx');
const { observer } = require('mobx-react');
const { Avatar, Divider, Menu, MenuItem } = require('~/peer-ui');
const { User, contactStore, chatStore, fileStore, chatNotifier } = require('peerio-icebear');
const UsageCloud = require('~/ui/shared-components/UsageCloud');
const SignoutDialog = require('~/ui/shared-components/SignoutDialog');
const css = require('classnames');
const { remote } = require('electron');
const notificationFactory = require('~/helpers/notifications');
const appControl = require('~/helpers/app-control');
const AppNavButton = require('./AppNavButton');
const { t } = require('peerio-translator');
const routerStore = require('~/stores/router-store');
const urls = require('~/config').translator.urlMap;
const autologin = require('~/helpers/autologin');
const path = require('path');
const config = require('~/config');

const { app, nativeImage } = remote;


// todo: move this somewhere more appropriate
let dockNotifsStarted = false;
function startDockNotifications() {
    // if (dockNotifsStarted || (!app.setBadgeCount && !app.dock && !app.dock.bounce)) return;
    if (dockNotifsStarted) return;
    dockNotifsStarted = true;
    autorunAsync(() => {
        const unreadItems = chatStore.unreadMessages + fileStore.unreadFiles;
        // mac
        if (app.setBadgeCount && app.dock && app.dock.bounce) {
            if (app.setBadgeCount) app.setBadgeCount(unreadItems);
            if (unreadItems > 0) {
                app.dock.bounce();
            }
        }
    }, 250);
}

let taskbarOverlayStarted = false;
function startTaskbarOverlay() {
    // if (dockNotifsStarted || (!app.setBadgeCount && !app.dock && !app.dock.bounce)) return;
    if (taskbarOverlayStarted) return;
    taskbarOverlayStarted = true;
    autorunAsync(() => {
        const unreadItems = chatStore.unreadMessages + fileStore.unreadFiles;
        // windows
        if (typeof remote.getCurrentWindow().setOverlayIcon === 'function') {
            const overlay = nativeImage.createFromPath(
                path.join(app.getAppPath(), 'build/static/img/taskbar-overlay.png')
            );
            remote.getCurrentWindow().setOverlayIcon(unreadItems ? overlay : null, unreadItems ? 'newmessages' : '');
        }
    }, 250);
}

let desktopNotificationsStarted = false;
function startDesktopNotifications() {
    if (desktopNotificationsStarted) return;
    desktopNotificationsStarted = true;
    chatStore.events.on(chatStore.EVENT_TYPES.messagesReceived,
        notificationFactory.sendMessageNotification);
    chatStore.events.on(chatStore.EVENT_TYPES.invitedToChannel,
        notificationFactory.sendInviteNotification);
}

@observer
class AppNav extends React.Component {
    @observable isConfirmSignOutVisible = false;

    constructor() {
        super();
        ['mail', 'chats', 'files', 'contacts', 'profile', 'security', 'prefs', 'account', 'about', 'help', 'onboarding']
            .forEach(route => {
                this[`to${route[0].toUpperCase()}${route.slice(1)}`] = () => {
                    routerStore.navigateTo(routerStore.ROUTES[route]);
                };
            });
    }

    componentWillMount() {
        // since this component shows new items notifications, we also make it show dock icon notifications
        startDockNotifications();
        startDesktopNotifications();
        startTaskbarOverlay();
    }

    _doSignout = async (untrust) => {
        await autologin.disable();
        await User.current.signout(untrust);
        appControl.relaunch();
    }

    signout = async () => {
        this.isConfirmSignOutVisible = true;
    }

    cancelSignout = () => {
        this.isConfirmSignOutVisible = false;
    }

    toUpgrade() {
        return window.open(urls.upgrade);
    }

    render() {
        const contact = contactStore.getContact(User.current.username);
        const { primaryAddressConfirmed } = User.current;

        return (
            <div className="app-nav">
                <div className="avatar-menu-wrapper">
                    <div className={css({ 'avatar-notify': !primaryAddressConfirmed })} />
                    <Menu
                        customButton={<Avatar contact={contact} size="medium" />}
                        position="top-left"
                        theme="wide"
                    >
                        <MenuItem
                            value="profile"
                            icon="person"
                            caption={t('title_settingsProfile')}
                            onClick={this.toProfile}
                            className={css({ 'avatar-notify': !primaryAddressConfirmed })}
                            selected={routerStore.currentRoute === routerStore.ROUTES.profile}
                        />
                        <MenuItem
                            value="security"
                            icon="security"
                            caption={t('title_settingsSecurity')}
                            onClick={this.toSecurity}
                            selected={routerStore.currentRoute === routerStore.ROUTES.security}
                        />
                        <MenuItem
                            value="preferences"
                            icon="settings"
                            caption={t('title_settingsPreferences')}
                            onClick={this.toPrefs}
                            selected={routerStore.currentRoute === routerStore.ROUTES.prefs}
                        />
                        <MenuItem
                            value="account"
                            icon="account_circle"
                            caption={t('title_settingsAccount')}
                            onClick={this.toAccount}
                            selected={routerStore.currentRoute === routerStore.ROUTES.account}
                        />
                        <MenuItem
                            value="about"
                            icon="info"
                            caption={t('title_About')}
                            onClick={this.toAbout}
                            selected={routerStore.currentRoute === routerStore.ROUTES.about}
                        />
                        <MenuItem
                            value="help"
                            icon="help"
                            caption={t('title_help')}
                            onClick={this.toHelp}
                            selected={routerStore.currentRoute === routerStore.ROUTES.help}
                        />
                        {config.disablePayments || User.current.hasActivePlans
                            ? null : (
                                <div key="appnav-nested-container">
                                    <Divider key="appnav-nested-divider" />
                                    <MenuItem key="appnav-nested-menuitem"
                                        value="upgrade"
                                        icon="open_in_browser"
                                        caption={t('button_upgrade')}
                                        onClick={this.toUpgrade}
                                    />
                                </div>
                            )
                        }
                        <Divider />
                        <MenuItem
                            value="signout"
                            icon="power_settings_new"
                            caption={t('button_logout')}
                            onClick={this.signout}
                        />
                    </Menu>
                </div>
                <div className="app-menu">
                    <AppNavButton tooltip={t('title_chats')} icon="forum"
                        active={routerStore.currentRoute.startsWith(routerStore.ROUTES.chats)}
                        showBadge={chatNotifier.badgeCount > 0}
                        badge={chatNotifier.badgeCount}
                        onClick={this.toChats} />

                    <AppNavButton tooltip={t('title_files')} icon="folder"
                        active={routerStore.currentRoute.startsWith(routerStore.ROUTES.files)}
                        showBadge={fileStore.unreadFiles > 0} badge={fileStore.unreadFiles}
                        onClick={this.toFiles} />

                    <AppNavButton tooltip={t('title_contacts')} icon="people"
                        active={routerStore.currentRoute.startsWith(routerStore.ROUTES.contacts)}
                        onClick={this.toContacts} />

                    <UsageCloud onClick={this.toOnboarding} />
                </div>
                <SignoutDialog
                    active={this.isConfirmSignOutVisible}
                    onHide={this.cancelSignout}
                    onSignout={this._doSignout}
                />
            </div>
        );
    }
}

module.exports = AppNav;
