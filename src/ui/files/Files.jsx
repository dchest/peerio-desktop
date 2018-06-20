const React = require('react');
const css = require('classnames');
const { Button, Checkbox, Dialog, Input, ProgressBar } = require('peer-ui');
const { observer } = require('mobx-react');
const { observable, action, computed, reaction } = require('mobx');
const { fileStore, volumeStore, clientApp, chatStore } = require('peerio-icebear');
const Search = require('~/ui/shared-components/Search');
const Breadcrumb = require('./components/Breadcrumb');
const FileLine = require('./components/FileLine');
const FolderLine = require('./components/FolderLine');
const ZeroScreen = require('./components/ZeroScreen');
const { pickLocalFiles, getFileTree, selectDownloadFolder, pickSavePath } = require('~/helpers/file');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const MoveFileDialog = require('./components/MoveFileDialog');
const ShareWithMultipleDialog = require('~/ui/shared-components/ShareWithMultipleDialog');
const ConfirmFolderDeleteDialog = require('~/ui/shared-components/ConfirmFolderDeleteDialog');
const LimitedActionsDialog = require('~/ui/shared-components/LimitedActionsDialog');
const { getFolderByEvent, getFileByEvent } = require('~/helpers/icebear-dom');
const config = require('~/config');
const _ = require('lodash');

const DEFAULT_RENDERED_ITEMS_COUNT = 15;
const CONTEXT_FILES = 'sharefiles';
const CONTEXT_FOLDERS = 'sharefolders';

@observer
class Files extends React.Component {
    constructor() {
        super();
        this.handleUpload = this.handleUpload.bind(this);
    }
    // to pass to shareWithMultipleDialog
    @observable.ref currentDialogFolder;

    @observable renderedItemsCount = DEFAULT_RENDERED_ITEMS_COUNT;
    pageSize = DEFAULT_RENDERED_ITEMS_COUNT;

    @observable shareContext = '';

    componentWillMount() {
        clientApp.isInFilesView = true;
        this.disposer = reaction(() => fileStore.selectedFolders.length, length => {
            if (length > 0) {
                this.shareContext = CONTEXT_FOLDERS;
            } else {
                this.shareContext = fileStore.selectedFiles.length > 0
                    ? CONTEXT_FILES
                    : '';
            }
        });
    }

    componentDidMount() {
        window.addEventListener('resize', this.enqueueCheck, false);
        // icebear will call this function to confirm file deletion
        fileStore.bulk.deleteFilesConfirmator = (files, sharedFiles) => {
            let msg = t('title_confirmRemoveFiles', { count: files.length });
            if (sharedFiles.length) msg += `\n\n${t('title_confirmRemoveSharedFiles')}`;
            return confirm(msg);
        };

        // icebear will call this function to select folder for bulk save
        fileStore.bulk.downloadFolderSelector = selectDownloadFolder;

        // icebear will call this function trying to pick a file or folder name which doesn't overwrite existing file
        fileStore.bulk.pickPathSelector = pickSavePath;
    }

    componentWillUnmount() {
        clientApp.isInFilesView = false;
        window.removeEventListener('resize', this.enqueueCheck);
        fileStore.searchQuery = '';
        fileStore.clearSelection();
        // remove icebear hook for sharing selection
        fileStore.bulk.shareWithSelector = null;
        // remove icebear hook for deletion
        fileStore.bulk.deleteFilesConfirmator = null;
        // remove icebear hook for bulk save
        fileStore.bulk.downloadFolderSelector = null;
        fileStore.bulk.pickPathSelector = null;
        this.disposer();
    }

    @action handleSearch(val) {
        fileStore.searchQuery = val;
    }

    @observable moveFolderVisible = false;

    @action.bound moveFolder(ev) {
        const folder = getFolderByEvent(ev);
        this.folderToMove = folder;
        if (folder) folder.selected = true;
        this.moveFolderVisible = true;
    }

    @action.bound moveToFolder() {
        this.moveFolderVisible = true;
    }

    @action.bound hideMoveFolder() {
        this.moveFolderVisible = false;
        this.folderToMove = null;
        // to re-enable sandwich action bars
        fileStore.clearSelection();
        fileStore.searchQuery = '';
    }

    @action.bound async shareFolder(ev) {
        // IMPORTANT: synthetic events are reused, so cache folder before await
        const folder = getFolderByEvent(ev);
        if (folder.isShared) {
            this.currentDialogFolder = folder;
        } else {
            this.currentDialogFolder = null;
        }

        this.shareContext = CONTEXT_FOLDERS;
        const contacts = await this.shareWithMultipleDialog.show();

        this.currentDialogFolder = null;
        if (!contacts || !contacts.length) return;
        await volumeStore.shareFolder(folder, contacts);

        this.shareContext = '';
    }

    @action.bound async shareFile(ev) {
        const file = getFileByEvent(ev);

        this.shareContext = CONTEXT_FILES;

        const contacts = await this.shareWithMultipleDialog.show();
        if (!contacts || !contacts.length) return;
        contacts.forEach(c => chatStore.startChatAndShareFiles([c], file));

        this.shareContext = '';
    }

    @action.bound async shareSelected() {
        const contacts = await this.shareWithMultipleDialog.show();
        if (!contacts || !contacts.length) return;
        contacts.forEach(c => chatStore.startChatAndShareFiles([c], fileStore.selectedFiles.slice()));
        fileStore.selectedFolders.forEach(f => f.canShare && volumeStore.shareFolder(f, contacts));
        fileStore.clearSelection();
    }

    @observable triggerAddFolderPopup = false;
    @observable addFolderPopupVisible = false;
    @observable triggerRenameFolderPopup = false;
    @observable renameFolderPopupVisible = false;
    @observable folderName = '';
    @observable folderToRename;
    @observable folderToMove;
    @observable folderToDelete;

    @action.bound showAddFolderPopup() {
        this.folderName = '';
        this.triggerAddFolderPopup = true;
    }

    @action.bound showRenameFolderPopup(ev) {
        const folder = getFolderByEvent(ev);
        this.folderName = folder.name;
        this.folderToRename = folder;
        this.triggerRenameFolderPopup = true;
    }

    @action.bound handleFolderNameChange(val) {
        this.folderName = val;
    }

    @action.bound handleAddFolder() {
        this.addFolderPopupVisible = false;
        this.triggerAddFolderPopup = false;
        const { folderName } = this;
        if (folderName && folderName.trim()) {
            fileStore.folderStore.currentFolder.createFolder(folderName);
        }
        this.folderName = '';
    }

    @action.bound handleKeyDownAddFolder(ev) {
        if (ev.key === 'Enter' && this.folderName.trim()) {
            this.handleAddFolder();
        }
    }

    @action.bound handleRenameFolder() {
        this.renameFolderPopupVisible = false;
        this.triggerRenameFolderPopup = null;
        const { folderName, folderToRename } = this;
        this.folderName = '';
        this.folderToRename = null;
        folderToRename.rename(folderName);
    }

    handleKeyDownRenameFolder = (ev) => {
        if (ev.key === 'Enter' && this.folderName.trim()) {
            this.handleRenameFolder();
        }
    }

    @action.bound async downloadFolder(ev) {
        const folder = getFolderByEvent(ev);
        const path = await selectDownloadFolder();
        if (!path) return;
        fileStore.bulk.downloadOne(folder, path);
    }

    @action.bound deleteFolder(ev) {
        const folder = getFolderByEvent(ev);
        fileStore.bulk.removeOne(folder);
    }

    onAddPopupRef = (ref) => {
        if (ref) this.addFolderPopupVisible = true;
    };

    onRenamePopupRef = (ref) => {
        if (ref) this.renameFolderPopupVisible = true;
    };

    get addFolderPopup() {
        const hide = () => {
            this.addFolderPopupVisible = false;
            this.triggerAddFolderPopup = false;
        };
        const dialogActions = [
            { label: t('button_cancel'), onClick: hide },
            { label: t('button_create'), disabled: !this.folderName.trim(), onClick: this.handleAddFolder }
        ];
        return (
            <Dialog title={t('button_newFolder')}
                active={this.addFolderPopupVisible} theme="small" ref={this.onAddPopupRef}
                actions={dialogActions}
                onCancel={hide}
                className="add-folder-popup">
                <Input placeholder={t('title_folderName')}
                    value={this.folderName} onChange={this.handleFolderNameChange}
                    onKeyDown={this.handleKeyDownAddFolder}
                    autoFocus
                />
            </Dialog>);
    }

    get renameFolderPopup() {
        const hide = () => {
            this.renameFolderPopupVisible = false;
            this.triggerRenameFolderPopup = false;
        };
        const dialogActions = [
            { label: t('button_cancel'), onClick: hide },
            { label: t('button_rename'), disabled: !this.folderName.trim(), onClick: this.handleRenameFolder }
        ];
        return (
            <Dialog title={t('button_rename')}
                active={this.renameFolderPopupVisible} theme="small" ref={this.onRenamePopupRef}
                actions={dialogActions} onKeyDown={this.keyDownRenameFolder}
                onCancel={hide}
                className="add-folder-popup">
                <Input placeholder={t('title_folderName')}
                    value={this.folderName} onChange={this.handleFolderNameChange}
                    onKeyDown={this.handleKeyDownRenameFolder}
                    autoFocus
                />
            </Dialog>);
    }

    async handleUpload() {
        const paths = await pickLocalFiles();
        if (!paths || !paths.length) return;
        const trees = paths.map(getFileTree);
        await Promise.map(trees, tree => {
            if (typeof tree === 'string') {
                return fileStore.upload(
                    tree, null,
                    fileStore.folderStore.currentFolder
                );
            }
            return fileStore.uploadFolder(tree, fileStore.folderStore.currentFolder);
        });
    }

    toggleSelectAll = ev => {
        this.items.forEach(item => {
            if (item.isShared) return;
            item.selected = !!ev.target.checked;
        });
    };

    @computed get allAreSelected() {
        return this.items.length && !this.items.some(i => !i.selected && !i.isShared);
    }

    checkScrollPosition = () => {
        if (!this.container) return;
        if (this.renderedItemsCount >= this.items.length) {
            this.renderedItemsCount = this.items.length;
            return;
        }

        const distanceToBottom = this.container.scrollHeight - this.container.scrollTop - this.container.clientHeight;
        if (distanceToBottom < 250) {
            this.renderedItemsCount += this.pageSize;
        }
    };

    enqueueCheck = _.debounce(() => {
        window.requestAnimationFrame(this.checkScrollPosition);
    }, 100, { leading: true, maxWait: 400 });

    setContainerRef = (ref) => {
        this.container = ref;
        this.enqueueCheck();
    }

    @action.bound changeFolder(ev) {
        const folder = getFolderByEvent(ev);
        if (folder !== fileStore.folderStore.currentFolder) {
            this.renderedItemsCount = DEFAULT_RENDERED_ITEMS_COUNT;
            fileStore.folderStore.currentFolder = folder;
            fileStore.searchQuery = '';
            fileStore.clearSelection();
        }
    }

    @computed get items() {
        return fileStore.searchQuery ?
            fileStore.filesAndFoldersSearchResult
            : fileStore.folderStore.currentFolder.filesAndFoldersDefaultSorting;
    }

    @computed get selectedCount() {
        return fileStore.selectedFilesOrFolders.length;
    }

    get breadCrumbsHeader() {
        let bulkButtons = [
            {
                label: t('button_download'),
                icon: 'file_download',
                onClick: fileStore.bulk.download
            },
            {
                label: t('button_move'),
                customIcon: 'move',
                onClick: this.moveToFolder,
                disabled: !fileStore.bulk.canMove
            },
            {
                label: t('button_delete'),
                icon: 'delete',
                onClick: fileStore.bulk.remove
            }
        ];
        if (config.enableVolumes) {
            bulkButtons.unshift(
                {
                    label: t('button_share'),
                    icon: 'person_add',
                    onClick: this.shareSelected,
                    disabled: !fileStore.bulk.canShare
                });
        }
        bulkButtons = bulkButtons.map(props => {
            return (
                <Button
                    key={props.label}
                    {...props} />
            );
        });

        return (
            <div className="files-header"
                data-folderid={fileStore.folderStore.currentFolder.id}
                data-storeid={fileStore.folderStore.currentFolder.store.id}>
                <Breadcrumb currentFolder={fileStore.folderStore.currentFolder}
                    onSelectFolder={this.changeFolder}
                    onMove={this.moveFolder}
                    onDelete={this.deleteFolder}
                    onRename={this.showRenameFolderPopup}
                    onShare={this.shareFolder}
                    onDownload={this.downloadFolder}
                    bulkSelected={this.selectedCount}
                />
                {this.selectedCount > 0
                    ? <div className="buttons-container bulk-buttons">
                        {bulkButtons}
                    </div>
                    : <div className="buttons-container file-buttons">
                        <Button
                            label={t('button_newFolder')}
                            className="new-folder"
                            onClick={this.showAddFolderPopup}
                            theme="affirmative secondary"
                        />
                        <Button className="button-affirmative"
                            label={t('button_upload')}
                            onClick={this.handleUpload}
                            theme="affirmative"
                        />
                    </div>
                }
            </div>
        );
    }

    get searchResultsHeader() {
        return (
            <div className="files-header">
                <div className="search-results-header">
                    {t('title_searchResults')}
                </div>
            </div>
        );
    }

    @observable removedFolderNotifVisible = false;
    @observable removedFolderNotifToHide = false;

    @action.bound dismissRemovedFolderNotif() {
        this.removedFolderNotifToHide = true;

        setTimeout(() => {
            this.removedFolderNotifVisible = false;
        }, 250);
    }

    get removedFolderNotif() {
        return (
            <div className={css(
                'removed-folder-notif',
                { 'hide-in-progress': this.removedFolderNotifToHide }
            )}>
                <T k="title_removedFromFolder">{{ folderName: 'Design files' }}</T>
                <Button icon="close" onClick={this.dismissRemovedFolderNotif} />
            </div>
        );
    }

    toggleSelectFile(ev) {
        const file = getFileByEvent(ev);
        file.selected = !file.selected;
    }

    toggleSelectFolder(ev) {
        const folder = getFolderByEvent(ev);
        folder.selected = !folder.selected;
    }

    @observable limitedActionsDialogVisible = false;
    @action.bound openLimitedActions() {
        this.limitedActionsDialog.show();
    }


    refShareWithMultipleDialog = ref => { this.shareWithMultipleDialog = ref; };
    refConfirmFolderDeleteDialog = ref => { fileStore.bulk.deleteFolderConfirmator = ref && ref.show; };
    refLimitedActionsDialog = ref => { this.limitedActionsDialog = ref; };


    render() {
        if (!fileStore.files.length && !fileStore.folderStore.root.folders.length
            && fileStore.loaded) return <ZeroScreen onUpload={this.handleUpload} />;

        const currentFolder = fileStore.folderStore.currentFolder;
        const items = [];
        const data = this.items;
        for (let i = 0; i < this.renderedItemsCount && i < data.length; i++) {
            const f = data[i];
            if (f.isFolder && currentFolder.isRoot && !currentFolder.isShared && f.convertingToVolume) continue;
            items.push(f.isFolder ?
                <FolderLine
                    key={f.id}
                    folder={f}
                    moveable={fileStore.folderStore.root.hasNested}
                    onDownload={this.downloadFolder}
                    onMoveFolder={this.moveFolder}
                    onRenameFolder={this.showRenameFolderPopup}
                    onDeleteFolder={this.deleteFolder}
                    onChangeFolder={this.changeFolder}
                    folderActions
                    folderDetails
                    checkbox
                    onToggleSelect={this.toggleSelectFolder}
                    selected={f.selected}
                    onShare={this.shareFolder}
                /> :
                <FileLine
                    key={f.fileId}
                    file={f}
                    currentFolder={currentFolder}
                    moveable={fileStore.folderStore.root.hasNested}
                    fileActions
                    fileDetails
                    checkbox
                    onToggleSelect={this.toggleSelectFile}
                    selected={f.selected}
                    onClickMoreInfo={this.openLimitedActions}
                    onShare={this.shareFile}
                />);
        }

        // items.push(
        //     <div className="row-container placeholder-file" key="placeholder1">
        //         <div className="row">
        //             <div className="file-checkbox" />
        //             <div className="file-icon"><div className="placeholder-square" /></div>
        //             <div className="file-name"><div className="placeholder-square" /></div>
        //             <div className="file-owner"><div className="placeholder-square" /></div>
        //             <div className="file-uploaded"><div className="placeholder-square" /></div>
        //             <div className="file-size"><div className="placeholder-square" /></div>
        //             <div className="file-actions"><div className="placeholder-square" /></div>
        //             <ProgressBar mode="indeterminate" />
        //         </div>
        //     </div>
        // );

        this.enqueueCheck();
        return (
            <div className="files">
                <div className="files-header-container">
                    <Search onChange={this.handleSearch} query={fileStore.searchQuery} />
                    {fileStore.searchQuery ? this.searchResultsHeader : this.breadCrumbsHeader}
                </div>
                <div className="file-wrapper">
                    <div className="file-table-wrapper scrollable"
                        ref={this.setContainerRef}
                        onScroll={this.enqueueCheck}
                    >
                        <div className="file-table-header row-container">
                            <Checkbox
                                className="file-checkbox"
                                onChange={this.toggleSelectAll}
                                checked={this.allAreSelected}
                            />
                            <div className="file-icon" />{/* blank space for file icon image */}
                            <div className="file-name">{t('title_name')}</div>
                            <div className="file-owner">{t('title_owner')}</div>
                            <div className="file-uploaded">{t('title_uploaded')}</div>
                            <div className="file-size">{t('title_size')}</div>
                            <div className="file-actions" />
                        </div>
                        {currentFolder.isRoot && this.removedFolderNotifVisible && this.removedFolderNotif}
                        {(currentFolder.convertingToVolume || currentFolder.convertingFromFolder) &&
                            <div className={css(
                                'file-ui-subheader',
                                'row',
                                {
                                    'volume-in-progress': currentFolder.convertingFromFolder,
                                    'converting-to-volume': currentFolder.convertingToVolume
                                }
                            )}>
                                <div className="file-checkbox percent-in-progress">
                                    {currentFolder.progressPercentage}
                                </div>

                                <div className="file-share-info">
                                    {currentFolder.convertingFromFolder &&
                                        <T k="title_convertingFolderNameToShared">
                                            {{ folderName: currentFolder.name }}
                                        </T>
                                    }
                                    {currentFolder.convertingToVolume &&
                                        <span>
                                            <T k="title_filesInQueue" tag="span" />&nbsp;
                                            {/* } (34 <T k="title_filesLeftCount" tag="span" />) */}
                                        </span>
                                    }
                                </div>
                                <ProgressBar value={currentFolder.progress} max={currentFolder.progressMax} />
                            </div>
                        }
                        <div className={css(
                            'file-table-body',
                            { 'hide-checkboxes': this.selectedCount === 0 }
                        )}>
                            {items}
                        </div>
                        <div className="file-bottom-filler" />
                    </div>
                </div>
                <MoveFileDialog
                    handleMove={fileStore.bulk.move}
                    folder={this.folderToMove}
                    currentFolder={currentFolder.parent || currentFolder}
                    visible={this.moveFolderVisible}
                    onHide={this.hideMoveFolder}
                />
                {this.triggerAddFolderPopup && this.addFolderPopup}
                {this.triggerRenameFolderPopup && this.renameFolderPopup}
                <LimitedActionsDialog ref={this.refLimitedActionsDialog} />
                <ConfirmFolderDeleteDialog ref={this.refConfirmFolderDeleteDialog} />
                <ShareWithMultipleDialog ref={this.refShareWithMultipleDialog}
                    item={this.currentDialogFolder}
                    context={this.shareContext}
                />
            </div>
        );
    }
}

module.exports = Files;
