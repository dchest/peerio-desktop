const React = require('react');
const { action } = require('mobx');
const { observer } = require('mobx-react');

const { fileStore, chatStore, volumeStore } = require('peerio-icebear');
const routerStore = require('~/stores/router-store');
const css = require('classnames');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');

const { Button, MaterialIcon } = require('peer-ui');
const SharedFolderActions = require('./SharedFolderActions');

@observer
class InlineSharedFolder extends React.Component {
    get volume() {
        return fileStore.folderStore.getById(this.props.folderId);
    }

    get isShared() {
        return !!this.volume.allParticipants.find(p => p.username === chatStore.activeChat.dmPartnerUsername);
    }

    click = () => {
        fileStore.folderStore.currentFolder = this.volume;
        routerStore.navigateTo(routerStore.ROUTES.files);
    }

    @action.bound unshareFolder() {
        const contact = chatStore.activeChat.otherParticipants[0];
        this.volume.removeParticipant(contact);
    }

    @action.bound reshareFolder() {
        const contact = chatStore.activeChat.otherParticipants[0];
        this.volume.addParticipants([contact]);
    }

    render() {
        const volume = this.volume;
        if (!volume) {
            if (volumeStore.loaded) {
                return (
                    <div className="inline-files-container inline-shared-folder-container">
                        <div className="unknown-file">
                            {t('title_folderUnshared')}
                        </div>
                    </div>
                );
            }
            return null;
        }
        return (
            <div
                className={css(
                    'inline-files-container',
                    'inline-shared-folder-container',
                    { unshared: !this.isShared }
                )}
            >
                <div className="inline-files">
                    <div className="shared-file inline-files-topbar">
                        <div className="container">
                            <div className="file-name-container clickable"
                                onClick={this.click}
                            >
                                <div className="file-icon">
                                    <MaterialIcon icon={this.isShared ? 'folder_shared' : 'folder'} />
                                </div>
                                <div className="file-name">
                                    {this.isShared
                                        ? volume.name
                                        : <T k="title_folderNameUnshared">{{ folderName: volume.name }}</T>
                                    }
                                </div>
                            </div>
                            {this.props.sharedByMe
                                ? (this.isShared
                                    ? <SharedFolderActions
                                        onShare={null}
                                        onDownload={null}
                                        onUnshare={this.unshareFolder}
                                        onDelete={null}
                                    />
                                    : <Button label={t('button_reshare')} onClick={this.reshareFolder} />
                                )
                                : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = InlineSharedFolder;
