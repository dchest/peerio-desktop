const React = require('react');
const { Component } = require('react');
const { observable, reaction } = require('mobx');
const { observer } = require('mobx-react');
const { Dialog } = require('peer-ui');
const AvatarEditor = require('~/ui/settings/components/AvatarEditor');

@observer class AvatarDialog extends Component {
    @observable static show = false;

    static hideDialog() {
        AvatarDialog.show = false;
        AvatarEditor.close();
    }

    static showDialog() {
        reaction(() => AvatarEditor.state.showEditor, show => { AvatarDialog.show = show; });
        AvatarEditor.selectFile();
    }

    saveAvatar = async (blobs) => {
        this.props.onSave(await AvatarEditor.closeAndReturnBuffers(blobs), blobs);
    };

    render() {
        const { hideDialog, show } = AvatarDialog;
        return (
            <Dialog active={show}
                onCancel={hideDialog}
                className="avatar-editor">
                <section className="save-avatar-container">
                    <AvatarEditor onSave={this.saveAvatar} />
                </section>
            </Dialog>
        );
    }
}

module.exports = AvatarDialog;
