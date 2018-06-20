/*
    SPACE consists of regularly used helper functions related to patient spaces
    e.g. finding the current space ID, or determining whether the current room is Patient or Internal
*/

const { chatStore, contactStore, User } = require('peerio-icebear');

class SPACE {
    get currentSpaceDeleted() {
        return !this.currentSpace;
    }

    get currentSpace() {
        if (!chatStore.spaces || !chatStore.activeSpace) return null;
        return chatStore.spaces.find(x => x.spaceId === chatStore.activeSpace);
    }

    get isPatientRoomOpen() {
        if (!chatStore.activeChat || !this.currentSpace || !this.currentSpace.patientRooms) return null;
        return this.currentSpace.patientRooms.find(r => r.id === chatStore.activeChat.id);
    }

    get isInternalRoomOpen() {
        if (!chatStore.activeChat || !this.currentSpace || !this.currentSpace.internalRooms) return null;
        return this.currentSpace.internalRooms.find(r => r.id === chatStore.activeChat.id);
    }

    get roomType() {
        if (this.isPatientRoomOpen) return 'patientroom';
        if (this.isInternalRoomOpen) return 'internalroom';
        return null;
    }

    get isMCAdmin() {
        if (!User.current.props || !User.current.props.mcrRoles) return null;
        return User.current.props.mcrRoles.some(x => x.includes('admin'));
    }

    checkMCAdmin(username) {
        const c = contactStore.getContact(username);
        if (!c || !c.mcrRoles) return null;
        return c.mcrRoles.some(x => x.includes('admin'));
    }

    checkMCDoctor(username) {
        const c = contactStore.getContact(username);
        if (!c || !c.mcrRoles) return null;
        return c.mcrRoles.includes('doctor');
    }
}

module.exports = new SPACE();
