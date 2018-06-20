const React = require('react');
const { observer } = require('mobx-react');
const { Menu, MenuItem, Divider } = require('peer-ui');
const { t } = require('peerio-translator');
const { getDataProps } = require('~/helpers/dom');
const config = require('~/config');

@observer
class FolderActions extends React.Component {
    render() {
        return (
            <Menu
                className="item-actions"
                icon="more_vert"
                position={this.props.position || 'bottom-right'}
                onClick={this.props.onClick}
                disabled={this.props.disabled}
                {...getDataProps(this.props)}
            >
                {this.props.onShare && config.enableVolumes
                    ? <MenuItem caption={t('button_share')}
                        icon="person_add"
                        onClick={this.props.onShare}
                        disabled={this.props.shareDisabled}
                    />
                    : null
                }
                {this.props.onDownload && <MenuItem caption={t('title_download')}
                    icon="file_download"
                    onClick={this.props.onDownload}
                    disabled={this.props.downloadDisabled}
                />}
                {this.props.onMove &&
                    <MenuItem caption={t('button_move')}
                        className="custom-icon-hover-container"
                        customIcon="move"
                        onClick={this.props.onMove}
                    />
                }
                <MenuItem caption={t('button_rename')}
                    icon="mode_edit"
                    onClick={this.props.onRename} />
                <Divider />
                <MenuItem caption={t('button_delete')}
                    icon="delete"
                    onClick={this.props.onDelete}
                    disabled={this.props.deleteDisabled}
                />
            </Menu>
        );
    }
}

module.exports = FolderActions;
