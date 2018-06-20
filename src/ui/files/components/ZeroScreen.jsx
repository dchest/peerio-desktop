const React = require('react');
const { t } = require('peerio-translator');
const { Button } = require('peer-ui');

function ZeroScreen(props) {
    return (
        <div className="files">
            <div className="zero-file">
                <div className="spacer" />
                <div className="content">
                    <div className="heading">
                        <div className="display-3">{t('title_filesNull1')}</div>
                    </div>
                    <div className="instructions-container">
                        <div className="text-container">
                            <p>
                                {t('title_filesNull2')}
                            </p>
                            <Button
                                onClick={props.onUpload}
                                label={t('button_upload')}
                            />
                        </div>
                        <img src="static/img/file-upload.png" />
                    </div>
                </div>
                <div className="spacer" />
            </div>
        </div>);
}

module.exports = ZeroScreen;
