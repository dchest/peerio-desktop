const React = require('react');
const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const { contactStore, User } = require('peerio-icebear');
const { downloadFile } = require('~/helpers/file');
const moment = require('moment');
const css = require('classnames');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const uiStore = require('~/stores/ui-store');

const { Checkbox, ProgressBar } = require('peer-ui');

const ContactProfile = require('~/ui/contact/components/ContactProfile');
const FileActions = require('./FileActions');
const FileSpriteIcon = require('~/ui/shared-components/FileSpriteIcon');
const MoveFileDialog = require('./MoveFileDialog');

@observer
class FileLine extends React.Component {
    // 21 hour limit for displaying relative timestamp (because moment.js says '1 day' starting from 21h)
    static relativeTimeDisplayLimit = 21 * 60 * 60 * 1000;

    @observable showActions = false;

    deleteFile = () => {
        let msg = t('title_confirmRemoveFilename', { name: this.props.file.name });
        if (this.props.file.shared) {
            msg += `\n\n${t('title_confirmRemoveSharedFiles')}`;
        }
        if (confirm(msg)) {
            this.props.file.remove();
        }
    };

    cancelUploadOrDownload = () => {
        this.props.file.cancelUpload();
        this.props.file.cancelDownload();
    };

    download = () => {
        downloadFile(this.props.file);
    };

    goToFolder = () => {
        // navigate to clicked folder
    }

    renameFile = () => {

    }

    @observable moveFileVisible = false;
    moveFile = () => {
        this.moveFileVisible = true;
    }

    hideMoveFile = () => {
        this.moveFileVisible = false;
    }

    onShowActions = () => {
        this.showActions = true;
    };

    onHideActions = () => {
        this.showActions = false;
    };

    setContactProfileRef = (ref) => {
        if (ref) this.contactProfileRef = ref;
    }

    @observable clickedContact;
    @action.bound openContact() {
        this.clickedContact = contactStore.getContact(this.props.file.fileOwner);
        this.contactProfileRef.openDialog();
    }

    render() {
        const { file } = this.props;

        // We want relative timestamp in case it's not older then 1 day.
        // In case of relative timestamp we also want to re-render periodically to update it
        let uploadedAt, uploadedAtTooltip;

        if (file.uploadedAt) {
            // if file timestamp is past the limit...
            if (Date.now() - file.uploadedAt > FileLine.relativeTimeDisplayLimit) {
                uploadedAt = file.uploadedAt.toLocaleString();
                // this condition is always true and we need it only to subscribe to clock updates
            } else if (uiStore.minuteClock.now) {
                uploadedAt = moment(file.uploadedAt).fromNow();
                uploadedAtTooltip = file.uploadedAt.toLocaleString();
            }
        }

        return (
            /*
                This superfluous row-container is needed to make styles consistent with FolderLine,
                which *does* need the container to hold elements other than .row
            */
            <div className={css(
                'row-container',
                'file-row-container',
                this.props.className,
                {
                    selected: this.props.selected,
                    'selected-row': this.props.selected,
                    'waiting-3rd-party': !file.uploading && !file.readyForDownload
                }
            )}>
                <div
                    data-fileid={file.fileId}
                    data-storeid={file.store.id}
                    className="row"
                    onMouseEnter={this.onShowActions}
                    onMouseLeave={this.onHideActions}>

                    {this.props.checkbox ?
                        <Checkbox
                            className="file-checkbox"
                            checked={this.props.selected}
                            onChange={this.props.onToggleSelect}
                        />
                        : <div className="file-checkbox" />
                    }

                    <div className="file-icon selectable"
                        onClick={this.props.clickToSelect
                            ? this.props.onToggleSelect
                            : this.download
                        } >
                        <FileSpriteIcon
                            type={file.iconType}
                            size="medium"
                        />
                    </div>

                    <div className="file-name selectable"
                        onClick={this.props.clickToSelect
                            ? this.props.onToggleSelect
                            : this.download
                        } >
                        {file.name}
                    </div>

                    {this.props.fileDetails &&
                        <div className="file-owner clickable" onClick={this.openContact}>
                            {file.fileOwner === User.current.username ? `${t('title_you')}` : file.fileOwner}
                        </div>
                    }

                    {this.props.fileDetails &&
                        <div className="file-uploaded" title={uploadedAtTooltip}>
                            {uploadedAt}
                            {file.isLegacy &&
                                <T k="title_pending" className="badge-old-version" />
                            }
                        </div>
                    }

                    {this.props.fileDetails &&

                        <div className="file-size">{file.sizeFormatted}</div>
                    }

                    {this.props.fileActions &&
                        <div className="file-actions">
                            <FileActions
                                data-fileid={file.fileId}
                                data-storeid={file.store.id}
                                downloadDisabled={!file.readyForDownload || file.downloading} onDownload={this.download}
                                shareable
                                shareDisabled={!file.readyForDownload || !file.canShare} onShare={this.props.onShare}
                                newFolderDisabled
                                onRename={this.renameFile}
                                moveable={this.props.moveable}
                                onMove={this.moveFile}
                                deleteable onDelete={this.deleteFile}
                                disabled={this.props.selected}
                                limitedActions={file.isLegacy}
                                onClickMoreInfo={this.props.onClickMoreInfo}
                            />
                            {this.moveFileVisible && this.props.currentFolder &&
                                <MoveFileDialog
                                    file={file}
                                    currentFolder={this.props.currentFolder}
                                    visible={this.moveFileVisible}
                                    onHide={this.hideMoveFile}
                                />
                            }
                        </div>
                    }

                    {(file.downloading || file.uploading)
                        ? <div className="loading">
                            <ProgressBar type="linear" mode="determinate" value={file.progress}
                                max={file.progressMax} />
                        </div>
                        : null}
                </div>

                {this.props.fileDetails &&
                    <ContactProfile
                        ref={this.setContactProfileRef}
                        contact={this.clickedContact}
                    />
                }
            </div>
        );
    }
}

module.exports = FileLine;
