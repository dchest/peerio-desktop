const React = require('react');
const { observable, action, computed } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const { Button, Dialog, MaterialIcon } = require('~/peer-ui');
const { fileStore } = require('peerio-icebear');
const Breadcrumb = require('./Breadcrumb');
const Search = require('~/ui/shared-components/Search');
const { getAttributeInParentChain } = require('~/helpers/dom');
const css = require('classnames');
const { getFolderByEvent } = require('~/helpers/icebear-dom');

@observer
class MoveFileDialog extends React.Component {
    @observable selectedFolder = null;
    @observable currentFolder = null;

    componentWillMount() {
        this.currentFolder = this.props.currentFolder;
    }

    getFolder(ev) {
        const id = getAttributeInParentChain(ev.target, 'data-folderid');
        const folder = fileStore.folders.getById(id);
        return folder;
    }

    @action.bound selectionChange(ev) {
        this.selectedFolder = this.getFolder(ev);
    }

    @action.bound setCurrentFolder(ev) {
        this.currentFolder = this.getFolder(ev);
    }

    @action.bound handleMove() {
        const { file, folder, onHide } = this.props;
        const target = this.selectedFolder || this.currentFolder;
        target.moveInto(file || folder);
        if (folder) fileStore.folders.save();
        onHide();
    }

    @computed get visibleFolders() {
        return fileStore.folderFilter ?
            fileStore.visibleFolders
            : this.currentFolder.foldersSortedByName;
    }

    @action.bound handleSearch(query) {
        fileStore.folderFilter = query;
    }

    @action.bound changeCurrentFolder(ev) {
        this.currentFolder = getFolderByEvent(ev);
    }

    getFolderRow = (folder) => {
        if (folder === this.props.folder) return null;

        const hasFolders = fileStore.folders.getById(folder.folderId).folders.length > 0;

        return (<div
            key={`folder-${folder.folderId}`}
            data-folderid={folder.folderId}
            className="move-file-row">
            <Button
                icon={this.selectedFolder === folder ?
                    'radio_button_checked' : 'radio_button_unchecked'}
                onClick={this.selectionChange}
                theme="small"
                selected={this.selectedFolder === folder}
            />
            <MaterialIcon icon="folder" className="folder-icon" />
            <div className={css('file-info', { clickable: hasFolders })}
                onClick={this.setCurrentFolder}
            >
                <div className="file-name clickable">{folder.name}</div>
            </div>
            { hasFolders &&
                <Button
                    onClick={this.setCurrentFolder}
                    icon="keyboard_arrow_right"
                    theme="small"
                />
            }
        </div>);
    };

    render() {
        const { onHide, visible } = this.props;

        const actions = [
            { label: t('button_cancel'), onClick: onHide },
            { label: t('button_move'), onClick: this.handleMove }
        ];

        const folders = this.visibleFolders
            .map(this.getFolderRow);

        return (
            <Dialog
                actions={actions}
                onCancel={onHide}
                active={visible}
                title={t('title_moveFileTo')}
                className="move-file-dialog">
                <Search
                    onChange={this.handleSearch}
                    query={fileStore.folderFilter}
                />
                <Breadcrumb
                    currentFolder={this.currentFolder}
                    onSelectFolder={this.changeCurrentFolder}
                    noActions
                />
                <div className="move-folders-container">
                    {folders}
                </div>
            </Dialog>
        );
    }
}

module.exports = MoveFileDialog;
