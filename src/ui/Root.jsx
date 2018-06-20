const React = require('react');
const isDevEnv = require('~/helpers/is-dev-env');
const { Button, ProgressBar } = require('peer-ui');
const DropTarget = require('./shared-components/DropTarget');
const { ipcRenderer } = require('electron');
const { socket, clientApp, warnings, chatStore } = require('peerio-icebear');
const { computed, reaction, observable, when } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const SystemWarningDialog = require('~/ui/shared-components/SystemWarningDialog');
const TwoFADialog = require('~/ui/shared-components/TwoFADialog');
const Snackbar = require('~/ui/shared-components/Snackbar');
const UpdateFailedDialog = require('./updater/UpdateFailedDialog');
const InstallingUpdateDialog = require('./updater/InstallingUpdateDialog');
const ReadyToInstallUpdateDialog = require('./updater/ReadyToInstallUpdateDialog');
const appState = require('~/stores/app-state');
const appControl = require('~/helpers/app-control');
const routerStore = require('~/stores/router-store');

@observer
class Root extends React.Component {
    /*
        Snackbar exists in root because snackbar warnings appears everywhere in app.
        However, root snackbar interferes with MessageInput in any currently active chat.
        So we need to only show root snackbar on non-chat screens.

        The rule is:
            * show if not in either `/app/chats/` or `/app/patients/` view
            * or, show snackbar if there is no current activeChat.
                This covers the case where we are in `chats` or `patients` view but without MessageInput
                e.g. zero states, new DM, new room
    */
    @computed get snackbarVisible() {
        return (
            !routerStore.currentRoute.startsWith(routerStore.ROUTES.chats)
            && !routerStore.currentRoute.startsWith(routerStore.ROUTES.patients)
        ) || !chatStore.activeChat;
    }

    @observable showOfflineNotification = false;

    constructor() {
        super();
        if (isDevEnv) {
            appState.devModeEnabled = true;
        }

        // events from main process
        ipcRenderer.on('warning', (ev, key) => warnings.add(key)); // TODO: not needed anymore?
        ipcRenderer.on('console_log', (ev, arg) => console.log(arg));
        ipcRenderer.on('activate_dev_mode', () => {
            appState.devModeEnabled = true;
        });

        reaction(() => socket.connected, (connected) => {
            if (connected) {
                this.showOfflineNotification = false;
                return;
            }
            setTimeout(() => {
                this.showOfflineNotification = !socket.connected;
            }, 5000);
        }, { fireImmediately: true });

        when(() => clientApp.clientSessionExpired, () => appControl.relaunch());
    }

    componentWillMount() {
        clientApp.isFocused = appState.isFocused;
        reaction(() => appState.isFocused, (focused) => {
            clientApp.isFocused = focused;
        });
    }
    renderReconnectSection() {
        return (<span>
            {socket.reconnectTimer.counter || ' '}&nbsp;
            <Button
                className="reconnect"
                label={t('button_retry')}
                onClick={socket.resetReconnectTimer}
                theme="inverted"
            />
        </span>);
    }

    render() {
        return (
            <div>
                <div className={`status-bar ${this.showOfflineNotification ? 'visible' : ''}`}>
                    {this.showOfflineNotification
                        ? <ProgressBar type="circular" mode="indeterminate" theme="light" size="small" />
                        : null
                    }
                    #{socket.reconnectAttempt}&nbsp;{t('error_connecting')}&nbsp;
                    {appState.isOnline && this.renderReconnectSection()}
                </div>
                {this.props.children}

                {this.devtools}
                {this.snackbarVisible ? <Snackbar /> : null}
                <SystemWarningDialog />
                <TwoFADialog />
                <UpdateFailedDialog />
                <ReadyToInstallUpdateDialog />
                <InstallingUpdateDialog />
                <DropTarget />
            </div>
        );
    }
}

module.exports = Root;
