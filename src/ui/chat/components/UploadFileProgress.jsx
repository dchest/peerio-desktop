const React = require('react');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const { MaterialIcon, ProgressBar, Button } = require('peer-ui');

@observer
class UploadFileProgress extends React.Component {
    cancelUpload = () => {
        if (confirm('Cancel upload?')) {
            this.props.file.cancelUpload();
        }
    };

    render() {
        const { file, remaining } = this.props;

        return (
            <div className="chat-upload-progress">
                <div className="progress-content">
                    <MaterialIcon value="cloud_upload" />
                    <div className="progress-title">
                        {remaining ? t('title_queuedFiles', { name: file.name, remaining })
                            : t('title_uploading', { name: file.name })}
                    </div>
                    <Button icon="cancel" onClick={this.cancelUpload} />
                </div>
                <ProgressBar type="linear" mode="determinate" value={file.progress}
                    max={file.progressMax} />
            </div>
        );
    }
}

module.exports = UploadFileProgress;
