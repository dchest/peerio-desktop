/*
    NOTE: this component encompasses the Medcryptor version of NewChannel view
    as well as new patient space, new patient room, and new internal room
*/

const React = require('react');
const { observable, when } = require('mobx');
const { observer } = require('mobx-react');
const { chatStore, config } = require('peerio-icebear');
const UserPicker = require('~/ui/shared-components/UserPicker');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');
const { Input, ProgressBar } = require('peer-ui');
const ELEMENTS = require('~/whitelabel/helpers/elements');
const SPACE = require('~/whitelabel/helpers/space');
const STRINGS = require('~/whitelabel/helpers/strings');
const routerStore = require('~/stores/router-store');

@observer
class NewChannel extends React.Component {
    @observable waiting = false;
    @observable channelName = '';
    @observable purpose = '';
    internalRoomName = t('mcr_title_general');

    handleAccept = () => {
        this.waiting = true;
        this[ELEMENTS.newChannel.acceptFunction]();
    };

    createNewChannel = async () => {
        const chat = await chatStore.startChat(this.userPicker.selected, true, this.channelName, this.purpose);
        if (!chat) {
            this.waiting = false;
            return;
        }
        when(() => chat.added === true, () => {
            routerStore.navigateTo(routerStore.ROUTES.chats);
        });
    }

    createNewPatientSpace = async () => {
        const newSpaceProperties = {
            spaceId: null,
            spaceName: this.channelName,
            spaceDescription: '',
            spaceRoomType: 'patient',
            nameInSpace: t('mcr_title_consultation')
        };

        const patientRoom = await chatStore.startChat(
            this.userPicker.selected,
            true,
            `${this.channelName} - ${t('mcr_title_consultation')}`,
            '',
            true,
            newSpaceProperties
        );

        newSpaceProperties.spaceRoomType = 'internal';
        newSpaceProperties.nameInSpace = this.internalRoomName;
        const internalRoom = await chatStore.startChat(
            [],
            true,
            `${this.channelName} - ${this.internalRoomName}`,
            '',
            true,
            newSpaceProperties);

        if (!internalRoom || !patientRoom) {
            this.waiting = false;
            return;
        }

        when(() => internalRoom.added && patientRoom.added, () => {
            this.waiting = false;

            const created = chatStore.spaces.find(x => x.spaceName === newSpaceProperties.spaceName);
            created.isNew = true;
            internalRoom.isNew = true;
            patientRoom.isNew = true;
        });
    }

    createNewInternalRoom = () => { this.createRoomInPatientSpace('internal'); }
    createNewPatientRoom = () => { this.createRoomInPatientSpace('patient'); }

    createRoomInPatientSpace = async (type) => {
        const roomSpaceProperties = {
            spaceId: SPACE.currentSpace.spaceId,
            spaceName: SPACE.currentSpace.spaceName,
            nameInSpace: this.channelName,
            spaceDescription: SPACE.currentSpace.spaceDescription,
            spaceRoomType: type
        };

        const name = `${SPACE.currentSpace.spaceName} - ${this.channelName}`;
        const chat = await chatStore.startChat(this.userPicker.selected, true, name, '', true, roomSpaceProperties);
        if (!chat) {
            this.waiting = false;
            return;
        }
        when(() => chat.added === true, () => {
            routerStore.navigateTo(routerStore.ROUTES.patients);
        });
    }

    handleNameChange = val => {
        this.channelName = val;
    }

    handlePurposeChange = val => {
        this.purpose = val;
    }

    setUserPickerRef = ref => {
        this.userPicker = ref;
    };

    setNameInputRef = ref => {
        if (!ref) return;
        ref.focus();
    };

    render() {
        if (this.waiting) {
            return (<div className="new-channel create-new-chat">
                <div className="create-channel-loading"><ProgressBar type="circular" /></div>
            </div>);
        }
        return (
            <div className="new-channel create-new-chat">
                <div className="chat-creation-header">
                    <div className="title">
                        {ELEMENTS.newChannel.title}
                    </div>
                    <div className="description">
                        {ELEMENTS.newChannel.description}
                    </div>
                </div>
                <div className="new-channel-inputs">
                    <div className="message-search-wrapper-new-channel message-search-wrapper">
                        <div className="new-chat-search">
                            <div className="chip-wrapper">
                                <Input placeholder={t(STRINGS.newChannel.channelName)} innerRef={this.setNameInputRef}
                                    value={this.channelName}
                                    onChange={this.handleNameChange}
                                    maxLength={config.chat.maxChatNameLength}
                                />
                            </div>
                        </div>
                        <div className="helper-text" />
                    </div>
                    {routerStore.isPatientSpace || routerStore.isNewPatient
                        ? null
                        : <div className="message-search-wrapper-new-channel message-search-wrapper">
                            <div className="new-chat-search">
                                <div className="chip-wrapper">
                                    <Input placeholder={t(STRINGS.newChannel.channelPurpose)}
                                        value={this.purpose}
                                        onChange={this.handlePurposeChange}
                                        maxLength={config.chat.maxChatPurposeLength}
                                    />
                                </div>
                            </div>
                            <T k={STRINGS.newChannel.purposeHelper} tag="div" className="helper-text" />
                        </div>
                    }
                    <div className="user-picker-container">
                        <UserPicker ref={this.setUserPickerRef} title={t(STRINGS.newChannel.userPickerTitle)}
                            noHeader onlyPick noAutoFocus
                            onAccept={this.handleAccept}
                            noSubmit={!this.channelName.length}
                            context={ELEMENTS.newChannel.context}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


module.exports = NewChannel;
