const React = require('react');
const { observer } = require('mobx-react');
const { Divider, Menu, MenuItem } = require('peer-ui');
const { t } = require('peerio-translator');
const { getDataProps } = require('~/helpers/dom');

@observer
class FileActions extends React.Component {
    /* available props
        shareable: is file allowed to be shared
        shareDisabled: file download in progress, disable share button
        downloadDisabled: file download in progress, disable download button
        moveable: is file allowed to be moved
        renameable: is file allowed to be renamed
        deleteable: is file not allowed to be deleted
    */

    render() {
        return (
            <Menu
                className="item-actions"
                icon="more_vert"
                position="bottom-right"
                onClick={this.props.onMenuClick}
                disabled={this.props.disabled}
                {...getDataProps(this.props)}
            >
                {this.props.limitedActions
                    ? <MenuItem caption={t('button_learnMore')}
                        icon="info"
                        onClick={this.props.onClickMoreInfo}
                    />
                    : null
                }

                {this.props.shareable
                    ? <MenuItem caption={t('button_share')}
                        icon="person_add"
                        onClick={this.props.onShare}
                        disabled={this.props.shareDisabled || this.props.limitedActions}
                    />
                    : null
                }
                <MenuItem caption={t('title_download')}
                    icon="file_download"
                    onClick={this.props.onDownload}
                    disabled={this.props.downloadDisabled}
                />
                {this.props.moveable
                    ? <MenuItem caption={t('button_move')}
                        className="custom-icon-hover-container"
                        customIcon="move"
                        onClick={this.props.onMove}
                    />
                    : null
                }
                {this.props.renameable
                    ? <MenuItem caption={t('button_rename')}
                        icon="mode_edit"
                        onClick={this.props.onRename}
                    />
                    : null
                }
                {this.props.deleteable ? <Divider /> : null}
                {this.props.deleteable
                    ? <MenuItem caption={t('button_delete')}
                        icon="delete"
                        onClick={this.props.onDelete}
                    />
                    : null
                }
                {this.props.unshareable
                    ? <MenuItem caption={t('button_unshare')}
                        icon="remove_circle_outline"
                        onClick={this.props.onUnshare}
                    />
                    : null
                }
            </Menu>
        );
    }
}

module.exports = FileActions;
