const React = require('react');
const { observable, action } = require('mobx');
const { observer } = require('mobx-react');
const css = require('classnames');
const FolderActions = require('./FolderActions');
const { Checkbox, CustomIcon, MaterialIcon, ProgressBar } = require('peer-ui');
const ContactProfile = require('~/ui/contact/components/ContactProfile');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');
const { contactStore, User } = require('peerio-icebear');

// TESTING
const { volumeStore } = require('peerio-icebear');

@observer
class FolderLine extends React.Component {
    @observable showActions = false;

    @action.bound onShowActions() {
        this.showActions = true;
    }

    @action.bound onHideActions() {
        this.showActions = false;
    }

    testClick = () => {
        volumeStore.mockProgress(this.props.folder);
    }

    setContactProfileRef = (ref) => {
        if (ref) this.contactProfileRef = ref;
    }

    @observable clickedContact;
    @action.bound openContact() {
        this.clickedContact = contactStore.getContact(this.props.folder.owner);
        this.contactProfileRef.openDialog();
    }

    render() {
        const { folder } = this.props;
        const selectDisabled = this.props.disabledCheckbox;
        const { progress, progressMax, progressPercentage } = folder;
        const shareInProgress = folder.convertingToVolume || folder.convertingFromFolder;
        return (
            <div data-folderid={folder.id}
                data-storeid={folder.store.id}
                className={css(
                    'row-container',
                    'folder-row-container',
                    'custom-icon-hover-container',
                    this.props.className,
                    {
                        'selected-row': this.props.selected,
                        'share-in-progress': shareInProgress
                    }
                )}
                onMouseEnter={this.onShowActions}
                onMouseLeave={this.onHideActions}>

                <div className="row">
                    {shareInProgress
                        ? <div className="file-checkbox percent-progress">
                            {`${progressPercentage}%`}
                        </div>
                        : this.props.checkbox
                            ? <Checkbox
                                className={css('file-checkbox', { disabled: selectDisabled })}
                                checked={this.props.selected}
                                onChange={selectDisabled ? null : this.props.onToggleSelect}
                            />
                            : <div className="file-checkbox" />
                    }

                    <div className="file-icon"
                        onClick={this.props.onChangeFolder} >
                        {folder.canShare
                            ? <MaterialIcon icon="folder" />
                            : <CustomIcon icon="folder-shared" hover selected={this.props.selected} />
                        }
                    </div>

                    <div className="file-name clickable selectable"
                        onClick={this.props.onChangeFolder} >
                        {folder.name}
                    </div>

                    {this.props.folderDetails &&
                        <div className="file-owner clickable" onClick={this.openContact}>
                            {shareInProgress
                                ? <T k="title_convertingToShared" />
                                : folder.owner === User.current.username ? t('title_you') : folder.owner
                            }
                        </div>
                    }

                    {this.props.folderDetails && <div className="file-uploaded" />}

                    {this.props.folderDetails && <div className="file-size" />}

                    { /* TODO: use spread operator */
                        this.props.folderActions &&
                        <div className="file-actions">
                            <FolderActions
                                onClick={this.props.onClick}
                                onRename={this.props.onRenameFolder}
                                onDownload={this.props.onDownload}
                                onMove={folder.isShared ? null : this.props.onMoveFolder}
                                onDelete={this.props.onDeleteFolder}
                                deleteDisabled={shareInProgress}
                                onShare={(folder.isShared || folder.canShare) ? this.props.onShare : null}
                                data-folderid={folder.id}
                                data-storeid={folder.store.id}
                                disabled={this.props.selected}
                            />
                        </div>
                    }
                </div>

                {shareInProgress &&
                    <div className="row sub-row">
                        <div className="file-checkbox" />

                        <div className="file-icon">
                            <CustomIcon icon="stacked-files" hover />
                        </div>

                        <div className="file-name">
                            <T k="title_filesInQueue" />
                        </div>

                        <div className="file-owner">
                            <T k="title_sharingFiles" />
                        </div>

                        <div className="file-uploaded" />
                        <div className="file-size" />
                        <div className="file-actions" />
                    </div>
                }

                {shareInProgress && <ProgressBar value={progress} max={progressMax} />}
                {this.props.folderDetails &&
                    <ContactProfile
                        ref={this.setContactProfileRef}
                        contact={this.clickedContact}
                    />
                }
            </div>
        );
    }
}

module.exports = FolderLine;
