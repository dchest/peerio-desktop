const React = require('react');
const { observer } = require('mobx-react');

const { Avatar } = require('peer-ui');
const ContactProfile = require('./ContactProfile');

@observer
class AvatarWithPopup extends React.Component {
    setDialogRef = (ref) => {
        if (ref) this.dialogRef = ref;
    }

    openDialog = (ev) => {
        ev.stopPropagation();
        this.dialogRef.openDialog();
    }

    render() {
        const popup = (
            <ContactProfile
                key={`avatarwithpopup-dialog-${this.props.contact.username}`}
                ref={this.setDialogRef}
                contact={this.props.contact}
            />
        );

        const avatar = (
            <Avatar
                key={`avatarwithpopup-avatar-${this.props.contact.username}`}
                contact={this.props.contact}
                size={this.props.size}
                tooltip={this.props.tooltip}
                clickable
                onClick={this.openDialog}
            />
        );

        return [
            avatar,
            popup
        ];
    }
}

module.exports = AvatarWithPopup;
