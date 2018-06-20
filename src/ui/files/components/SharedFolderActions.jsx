const React = require('react');
const { observer } = require('mobx-react');
const { Menu, MenuItem, Divider } = require('peer-ui');
const { t } = require('peerio-translator');
const { getDataProps } = require('~/helpers/dom');

@observer
class SharedFolderActions extends React.Component {
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
                {this.props.onShare
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
                <Divider />
                {this.props.onUnshare && <MenuItem caption={t('button_unshare')}
                    icon="remove_circle_outline"
                    onClick={this.props.onUnshare}
                />}
                {this.props.onDelete && <MenuItem caption={t('button_delete')}
                    icon="delete"
                    onClick={this.props.onDelete} />
                }
            </Menu>
        );
    }
}

module.exports = SharedFolderActions;
