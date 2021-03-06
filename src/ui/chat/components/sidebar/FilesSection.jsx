const React = require('react');
const { observer } = require('mobx-react');
const { List, ListItem, Menu, MenuItem } = require('~/peer-ui');
const { chatStore, fileStore } = require('peerio-icebear');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');
const { getAttributeInParentChain } = require('~/helpers/dom');
const SideBarSection = require('./SideBarSection');
const { downloadFile, pickLocalFiles } = require('~/helpers/file');
const moment = require('moment');
const FileSpriteIcon = require('~/ui/shared-components/FileSpriteIcon');

@observer
class FilesSection extends React.Component {
    share(ev) {
        ev.stopPropagation();
        const fileId = getAttributeInParentChain(ev.target, 'data-fileid');
        const file = fileStore.getById(fileId);
        if (!file) return;
        fileStore.clearSelection();
        file.selected = true;
        window.router.push('/app/sharefiles');
    }

    download(ev) {
        ev.stopPropagation();
        const fileId = getAttributeInParentChain(ev.target, 'data-fileid');
        const file = fileStore.getById(fileId);
        if (!file) return;
        downloadFile(file);
    }

    stopPropagation(ev) {
        ev.stopPropagation();
    }

    handleUpload = () => {
        const chat = chatStore.activeChat;
        if (!chat) return;
        pickLocalFiles().then(paths => {
            if (!paths || !paths.length) return Promise.resolve();
            return Promise.all(paths.map(i => chat.uploadAndShareFile(i)));
        });
    };

    menu(fileId) {
        return (
            <Menu
                icon="more_vert"
                position="bottom-right"
                onClick={this.stopPropagation}
                data-fileid={fileId}
            >
                <MenuItem
                    caption={t('title_download')}
                    icon="file_download"
                    onClick={this.download}
                />
                <MenuItem
                    caption={t('button_share')}
                    icon="reply"
                    onClick={this.share}
                />
            </Menu>
        );
    }

    renderFileItem = id => {
        const file = fileStore.getById(id);
        if (!file) return null;

        return (
            <ListItem key={id} data-fileid={id}
                className="sidebar-file-container"
                onClick={this.download}
                leftContent={<FileSpriteIcon type={file.iconType} size="large" />}
                rightContent={this.menu(id)}
            >
                <div className="meta">
                    <div className="file-name-container">
                        <span className="file-name">
                            {file.nameWithoutExtension}
                        </span>
                        <span className="file-ext">.{file.ext}</span>
                    </div>
                    <div className="file-shared-by">{file.fileOwner}</div>
                    <div className="file-shared-date">
                        {moment(file.uploadedAt).format(
                            Date.now() - file.uploadedAt > 24 * 60 * 60 * 1000
                                ? 'll'
                                : 'll [|] h:mmA'
                        )}
                    </div>
                </div>
            </ListItem>
        );
    }

    render() {
        const chat = chatStore.activeChat;
        if (!chat) return null;
        const textParser = {
            clickHere: text => (
                <a className="clickable" onClick={this.handleUpload}>{text}</a>
            )
        };
        return (
            <SideBarSection title={t('title_recentFiles')} onToggle={this.props.onToggle} open={this.props.open}>
                <div className="member-list scrollable">
                    <List className="sidebar-file-list" clickable>
                        {chat.recentFiles.map(this.renderFileItem)}
                    </List>
                </div>
                {!chat.recentFiles || !chat.recentFiles.length &&
                    <div className="sidebar-zero-files">
                        <T k="title_noRecentFiles">{textParser}</T>
                    </div>
                }
            </SideBarSection>
        );
    }
}

module.exports = FilesSection;
