const React = require('react');
const { fileStore, User, chatStore } = require('peerio-icebear');
const { Button, Dialog, MaterialIcon, ProgressBar, RadioButtons } = require('peer-ui');
const FileSpriteIcon = require('~/ui/shared-components/FileSpriteIcon');
const { downloadFile } = require('~/helpers/file');
const { action, observable, when } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');
const uiStore = require('~/stores/ui-store');
const routerStore = require('~/stores/router-store');
const css = require('classnames');
const FileActions = require('~/ui/files/components/FileActions');
const LimitedActionsDialog = require('~/ui/shared-components/LimitedActionsDialog');
const ShareWithMultipleDialog = require('~/ui/shared-components/ShareWithMultipleDialog');

const ALL_IMAGES = 'all_images';
const UNDER_LIMIT_ONLY = 'under_limit_only';
const DISABLED = 'disabled';

@observer
class InlineFile extends React.Component {
    @observable isExpanded;
    @observable currentImageSrc;
    @observable imagePopupVisible = false;

    @observable selectedMode = ALL_IMAGES;
    @observable firstSave = false;

    @observable errorLoading = false;

    // TODO: test cases where file is getting deleted from chat and then reshared
    // most likely there will be this.props.file instance change which messes up visibleCounter
    componentWillMount() {
        const file = this.props.file;
        // In this component we can rely on props.file to be fully ready to consume.
        if (file.isImage) {
            // if user sets the preference later, the image would be shown
            // if it's already enabled, the when would be executed immediately
            this._reactionToDispose = when(
                () => uiStore.prefs.peerioContentEnabled && uiStore.prefs.peerioContentConsented,
                () => {
                    this.isExpanded = true;
                    if (!file.tmpCached && !file.isOverInlineSizeLimit && !file.isOversizeCutoff) {
                        file.tryToCacheTemporarily();
                    }
                });
        }
        // When this image is mounted, increase the visibility counter
        // to prevent it being deleted
        file.visibleCounter++;
    }


    componentWillUnmount() {
        if (this.timer) clearTimeout(this.timer);
        if (this._reactionToDispose) this._reactionToDispose();

        // When this image is mounted, increase the visibility counter
        // to prevent it being deleted
        this.props.file.visibleCounter--;
    }

    radioOptions = [
        { value: ALL_IMAGES, label: t('title_forAllImages') },
        { value: UNDER_LIMIT_ONLY, label: t('title_forImagesUnder10') },
        { value: DISABLED, label: t('title_disable') }
    ];

    get downloadDisabled() {
        return !this.props.file.readyForDownload || this.props.file.downloading;
    }

    get shareDisabled() {
        return !this.props.file.readyForDownload || !this.props.file.canShare;
    }

    get deleteable() {
        return this.props.file.fileOwner === User.current.username;
    }

    download = () => {
        if (this.downloadDisabled) return;
        downloadFile(this.props.file);
    }

    deleteFile = async () => {
        const id = this.props.file.fileId;
        let file = fileStore.getById(id);
        if (!file) {
            file = await fileStore.loadKegByFileId(id);
            if (!file) return;
        }
        let msg = t('title_confirmRemoveFilename', { name: file.name });
        if (file.shared) {
            msg += `\n\n${t('title_confirmRemoveSharedFiles')}`;
        }
        if (confirm(msg)) {
            file.remove();
        }
    }

    unshareFile = () => {
        this.props.file.remove();
    }

    onSelectedModeChange = (value) => {
        this.selectedMode = value;
    }

    onDismiss = () => {
        this.firstSave = true;
        this.selectedMode = DISABLED;
        this.onSubmitConsent();
    }

    onSubmitConsent = () => {
        this.firstSave = true;
        uiStore.prefs.peerioContentConsented = true;

        switch (this.selectedMode) {
            case ALL_IMAGES:
                uiStore.prefs.peerioContentEnabled = true;
                uiStore.prefs.limitInlineImageSize = false;
                break;
            case UNDER_LIMIT_ONLY:
                uiStore.prefs.peerioContentEnabled = true;
                uiStore.prefs.limitInlineImageSize = true;
                break;
            default:
                uiStore.prefs.peerioContentEnabled = false;
                break;
        }
    }

    onErrorLoadingImage = () => {
        this.errorLoading = true;
    }

    toggleExpand = () => {
        this.isExpanded = !this.isExpanded;
    }

    forceDownload = () => {
        this.props.file.tryToCacheTemporarily(true);
    }

    hideImagePopup = () => {
        this.imagePopupVisible = false;
        this.currentImageSrc = '';
    }

    imageClick = (ev) => {
        this.currentImageSrc = ev.target.src;
    }

    onPopupRef = (ref) => {
        if (ref) this.imagePopupVisible = true;
    };

    goToSettings = () => {
        routerStore.navigateTo(routerStore.ROUTES.prefs);
    }

    get imagePopup() {
        const file = this.props.file;

        return (
            <Dialog active={this.imagePopupVisible} ref={this.onPopupRef}
                onCancel={this.hideImagePopup}
                className="image-popup">
                <img src={this.currentImageSrc} />
                <Button onClick={this.hideImagePopup} icon="close" className="button-close" theme="small" />
                <div className="info-bar">
                    <div className="left">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{file.sizeFormatted}</div>
                    </div>
                    <div className="right">
                        <Button caption={t('title_download')}
                            icon="file_download"
                            onClick={this.download}
                            disabled={this.downloadDisabled}
                            theme="small"
                        />
                        <Button caption={t('button_share')}
                            icon="person_add"
                            onClick={this.share}
                            disabled={this.shareDisabled}
                            theme="small"
                        />
                        {this.deleteable &&
                            <Button
                                caption={t('button_delete')}
                                icon="delete"
                                onClick={this.deleteFile}
                                theme="small"
                            />
                        }
                        {this.deleteable &&
                            <Button
                                caption={t('button_unshare')}
                                icon="remove_circle_outline"
                                onClick={this.unshareFile}
                                theme="small"
                            />
                        }
                    </div>
                </div>
            </Dialog>);
    }

    renderConsent() {
        return (
            <div className="first-time">
                <div className="warning-header">
                    <MaterialIcon icon="security" />
                    <T k="title_enableImagePreviews" className="text" />
                </div>
                <div className="warning-body">
                    <p className="text"><T k="title_imagePreviewWarning" /></p>
                    <RadioButtons
                        value={this.selectedMode}
                        onChange={this.onSelectedModeChange}
                        options={this.radioOptions}
                    />
                    <div className="buttons-container">
                        <Button
                            className="notnow"
                            onClick={this.onDismiss}
                            theme="secondary"
                        >
                            {t('button_notNow')}
                        </Button>
                        <Button className="save" onClick={this.onSubmitConsent}>{t('button_save')}</Button>
                    </div>
                </div>
            </div>
        );
    }


    renderOversizeWarning() {
        return (
            <div className="image-over-limit-warning">
                <T k="title_imageSizeWarning" className="text">
                    {{ size: fileStore.inlineImageSizeLimitFormatted }}
                </T>&nbsp;
                <Button className="display-this-image display-over-limit-image"
                    onClick={this.forceDownload}>
                    {t('button_displayThisImageAfterWarning')}
                </Button>
            </div>
        );
    }
    renderOversizeCutoffWarning() {
        return (
            <div className="image-over-limit-warning">
                <T k="title_imageTooBigCutoff" className="text" >
                    {{ size: fileStore.inlineImageSizeLimitCutoffFormatted }}
                </T>
            </div>
        );
    }
    settingsLinkSegment = {
        toSettings: text => <a className="clickable" onClick={this.goToSettings}>{text}</a>
    };

    refLimitedActionsDialog = ref => { this.limitedActionsDialog = ref; };
    @action.bound openLimitedActions() {
        this.limitedActionsDialog.show();
    }

    refShareWithMultipleDialog = ref => { this.shareWithMultipleDialog = ref; };
    share = async () => {
        const contacts = await this.shareWithMultipleDialog.show();
        if (!contacts || !contacts.length) return;
        contacts.forEach(c => chatStore.startChatAndShareFiles([c], this.props.file));
    };

    render() {
        const file = this.props.file;
        return (
            <div className="inline-files-container">
                <div className="inline-files">
                    <div className="inline-files-topbar">
                        <div className="shared-file">
                            <div className="container">
                                <div className="clickable file-name-container" onClick={this.download}>
                                    <div className="file-icon">
                                        <FileSpriteIcon type={file.iconType} size="small" />
                                    </div>
                                    <div className="file-name">
                                        {file.nameWithoutExtension}
                                    </div>
                                    <div className="file-ext">
                                        .{file.ext}
                                    </div>
                                </div>
                                {(file.isImage && uiStore.prefs.peerioContentConsented) &&
                                    <Button
                                        icon={this.isExpanded ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        onClick={this.toggleExpand}
                                        theme="no-hover"
                                    />
                                }
                                <FileActions shareable newFolderDisabled
                                    deleteable={this.deleteable}
                                    unshareable={this.deleteable}
                                    downloadDisabled={this.downloadDisabled}
                                    shareDisabled={this.shareDisabled}
                                    onDownload={this.download}
                                    onShare={this.share}
                                    onDelete={this.deleteFile}
                                    onUnshare={this.unshareFile}
                                    limitedActions={file.isLegacy}
                                    onClickMoreInfo={this.openLimitedActions}
                                    {...this.props}
                                />
                            </div>
                            {!file.cachingFailed && file.downloading
                                ? <ProgressBar type="linear" mode="determinate" value={file.progress}
                                    max={file.progressMax} />
                                : null
                            }
                        </div>
                    </div>
                    {this.isExpanded && uiStore.prefs.peerioContentConsented &&
                        <div className={css('inline-files-expanded',
                            {
                                'display-image': uiStore.prefs.peerioContentEnabled &&
                                    (file.tmpCached || !file.isOverInlineSizeLimit)
                            })}>
                            {file.tmpCached || uiStore.prefs.peerioContentEnabled
                                ? <div className="inline-files-dropdown">
                                    {file.tmpCached &&
                                        (this.errorLoading
                                            ? <span>{t('error_loadingImage')}</span>
                                            : <img src={file.tmpCachePath}
                                                onLoad={this.props.onImageLoaded}
                                                onError={this.onErrorLoadingImage}
                                                onClick={this.imageClick} />)}
                                    {!file.tmpCached && !file.downloading && file.isOverInlineSizeLimit
                                        && !file.isOversizeCutoff
                                        && this.renderOversizeWarning()}
                                    {file.isOversizeCutoff
                                        && this.renderOversizeCutoffWarning()}
                                    {file.cachingFailed ? <span>{t('error_downloadFailed')}</span> : null}
                                </div>
                                : <Button className="display-this-image" onClick={this.forceDownload}>
                                    {t('button_displayThisImage')}
                                </Button>
                            }
                        </div>
                    }
                    {this.currentImageSrc && this.imagePopup}
                </div>
                <div>{!uiStore.prefs.peerioContentConsented && file.isImage &&
                    this.renderConsent()
                }
                </div>
                <div>
                    {this.firstSave &&
                        <div className="update-settings">
                            <MaterialIcon icon="check_circle" />
                            <T k="title_updateSettingsAnyTime" className="text">{this.settingsLinkSegment}</T>
                        </div>
                    }
                </div>
                <LimitedActionsDialog ref={this.refLimitedActionsDialog} />
                <ShareWithMultipleDialog ref={this.refShareWithMultipleDialog} context="sharefiles" />
            </div>
        );
    }
}


@observer
class InlineFiles extends React.Component {
    renderNoFile(fileId) {
        return (
            <div className="inline-files-container" key={fileId}>
                <div className="unknown-file">
                    {t('error_fileRemoved')}
                </div>
            </div>
        );
    }
    renderProgress(fileId) {
        return (
            <div className="inline-files-container" key={fileId}>
                <ProgressBar type="linear" mode="indeterminate" className="unknown-file-progress-bar" />
            </div>
        );
    }

    renderNoSignature(fileId) {
        return (
            <div className="invalid-file" key={fileId}
                onClick={uiStore.showFileSignatureErrorDialog}>
                <div className="container">
                    <MaterialIcon icon="info_outline" />
                    <div className="file-name">{t('error_invalidFileSignature')}</div>
                </div>
            </div>
        );
    }

    render() {
        if (!this.props.files.map) return null;
        return (
            <div>
                {
                    this.props.files.map(fileId => {
                        const file = fileStore.getByIdInChat(fileId, chatStore.activeChat.id);
                        if (file.deleted) return this.renderNoFile(fileId);
                        if (file.signatureError) return this.renderNoSignature(fileId);
                        if (!file.loaded) return this.renderProgress(fileId);

                        return (<InlineFile
                            key={fileId}
                            file={file}
                            onImageLoaded={this.props.onImageLoaded}
                            {...this.props}
                        />);
                    })
                }
            </div>
        );
    }
}

module.exports = InlineFiles;
