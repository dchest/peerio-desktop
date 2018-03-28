const React = require('react');
const { computed, observable, reaction } = require('mobx');
const { observer } = require('mobx-react');
const { MaterialIcon } = require('~/peer-ui');
const { t } = require('peerio-translator');
const FolderActions = require('./FolderActions');

@observer
class Breadcrumb extends React.Component {
    @computed get folderPath() {
        const folderPath = [];
        let iterator = this.props.currentFolder;
        do {
            folderPath.unshift(iterator);
            iterator = iterator.parent;
        } while (iterator);
        return folderPath;
    }

    componentDidMount() {
        this._watchFolder = reaction(() => this.props.currentFolder, this.ellipsizeFolderNames, true);
        window.addEventListener('resize', this.ellipsizeFolderNames, false);
    }

    componentWillUnmount() {
        this._watchFolder();
        window.removeEventListener('resize', this.ellipsizeFolderNames);
    }

    // Total combined current widths of text, before replacing folder names with ellipses
    @computed get folderWidths() {
        const array = [];
        this.folderPath.forEach((folder) => {
            folder.name
                ? array.push(folder.name)
                : array.push(t('title_files'));
        });

        return this.calcTextWidths(array);
    }

    // Folders, by index, that will be ellipsized
    @observable foldersToEllipsize = -1;

    // Actual current widths, after replacing folder names with ellipses
    @computed get folderWidthsWithEllipsized() {
        const array = [];
        this.folderPath.forEach((folder) => {
            folder.name
                ? array.push(folder.name)
                : array.push(t('title_files'));
        });

        for (let i = 0; i <= this.foldersToEllipsize; i++) {
            array[i] = '...';
        }

        return this.calcTextWidths(array);
    }

    // Takes array of folder names, return array of the widths of those names
    calcTextWidths(array) {
        this.element = document.createElement('canvas');
        this.context = this.element.getContext('2d');
        this.context.font = '600 20px Open Sans'; // hardcoded, need to change if font stack changes!

        const widthArray = [];
        const folderMaxWidth = 120;

        array.forEach((folder) => {
            const thisWidth = this.context.measureText(folder).width;
            widthArray.push(
                thisWidth < folderMaxWidth
                    ? thisWidth
                    : folderMaxWidth
            );
        });

        return widthArray;
    }

    // Used to calculate total actual width of folder names, including ellipsized names
    @computed get totalWidth() {
        this.element = document.createElement('canvas');
        this.context = this.element.getContext('2d');
        this.context.font = '600 20px Open Sans'; // hardcoded, need to change if font stack changes!

        let totalWidth = 0;
        const folderMaxWidth = 120;

        this.folderWidthsWithEllipsized.forEach((width) => {
            totalWidth += width < folderMaxWidth
                ? width
                : folderMaxWidth;
        });

        // Add width of icons (hardcoded at 32px right now)
        totalWidth += 32 * (this.folderWidthsWithEllipsized.length - 1);

        return totalWidth;
    }

    ellipsizeFolderNames = () => {
        const breadcrumbContainer = document.getElementsByClassName('breadcrumb-container')[0];

        // 48px subtracted to take into account the width of the three-dots button
        // 32px subtracted to take into account the left margin of the breadcrumb
        const containerWidth =
            parseInt(window.getComputedStyle(breadcrumbContainer).getPropertyValue('width'), 10) - 48 - 32;

        while (this.totalWidth > containerWidth && this.foldersToEllipsize < this.folderPath.length) {
            this.foldersToEllipsize++;
        }

        // A "catch" for navigating up the folderPath, so that the folderWidth[] below doesn't end up undefined
        if (this.folderPath.length - 1 < this.foldersToEllipsize) {
            this.foldersToEllipsize = this.folderPath.length - 1;
        }

        /* Compare folder name width vs ellipsis width. Compare breadcrumb container width vs current breadcrumb width.
         * If folder name will not overflow breadcrumb container, then replace ellipsis with folder name.
         * Repeat until the folder name WOULD overflow breadcrumb container.
         */
        while ((this.folderWidths[this.foldersToEllipsize] - this.folderWidthsWithEllipsized[this.foldersToEllipsize])
            < (containerWidth - this.totalWidth)) {
            this.foldersToEllipsize--;
        }
    }

    render() {
        const { folderPath } = this;
        // TODO: add unique id for root folder
        return (
            <div className="breadcrumb-container">
                <div className="breadcrumb">
                    {this.folderPath.map((folder, i) => (
                        <div key={`${folder.folderId}-${folder.name}`}
                            data-folderid={folder.folderId || 'root'}
                            className="breadcrumb-entry">
                            <a className="folder-link clickable"
                                onClick={this.props.onSelectFolder}>
                                {i > this.foldersToEllipsize
                                    ? folder.name || t('title_files')
                                    : '...'
                                }
                            </a>
                            {i !== folderPath.length - 1 && <MaterialIcon icon="keyboard_arrow_right" />}
                        </div>
                    ))}
                </div>
                {!this.props.currentFolder.isRoot && !this.props.noActions &&
                    <FolderActions
                        data-folderid={this.props.currentFolder.folderId}
                        moveable
                        onMove={this.props.onMove}
                        onDelete={this.props.onDelete}
                        onRename={this.props.onRename}
                        position="top-right"
                    />
                }
            </div>
        );
    }
}

module.exports = Breadcrumb;
