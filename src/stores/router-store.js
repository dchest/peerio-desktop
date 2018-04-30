// global UI store
const { observable } = require('mobx');

class RouterStore {
    @observable currentRoute = window.router.getCurrentLocation().pathname;

    constructor() {
        window.router.listen(this.handleRouteChange);
    }

    handleRouteChange = route => {
        this.currentRoute = route.pathname;
    };

    navigateTo(path) {
        if (this.currentRoute === path) return;
        window.router.push(path);
    }

    navigateToAsync(path) {
        setTimeout(() => {
            if (this.currentRoute === path) return;
            window.router.push(path);
        });
    }

    get isNewChat() { return this.currentRoute === this.ROUTES.newChat; }
    get isNewChannel() { return this.currentRoute === this.ROUTES.newChannel; }

    get ROUTES() {
        return {
            loading: '/app',
            chats: '/app/chats',
            zeroChats: '/app/zero-chats',
            newChat: '/app/chats/new-chat',
            newChannel: '/app/chats/new-channel',
            channelInvite: '/app/chats/channel-invite',
            pendingDM: '/app/chats/pending-dm',
            onboarding: '/app/onboarding',
            mail: '/app/mail',
            files: '/app/files',
            contacts: '/app/contacts',
            invitedContacts: '/app/contacts/invited',
            newContact: '/app/contacts/new-contact',
            newInvite: '/app/contacts/new-invite',
            profile: '/app/settings/profile',
            security: '/app/settings/security',
            prefs: '/app/settings/preferences',
            account: '/app/settings/account',
            about: '/app/settings/about',
            help: '/app/settings/help',
            devSettings: '/app/settings/dev'
        };
    }
}

module.exports = new RouterStore();
