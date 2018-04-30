const React = require('react');

const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const EmojiImage = require('~/ui/emoji/Image');

@observer
class PendingDM extends React.Component {
    render() {
        return (
            <div className="pending-dm">
                <EmojiImage emoji="tada" size="large" />
            </div>
        );
    }
}

module.exports = PendingDM;
