const React = require('react');

const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const EmojiImage = require('~/ui/emoji/Image');
const { contactStore } = require('peerio-icebear');

@observer
class PendingDM extends React.Component {
    // Testing var
    // @observable activePendingDM = contactStore.getContact('ltest1').id;

    render() {
        console.log(contactStore.getContact('ltest1'));

        return (
            <div className="pending-dm">
                <EmojiImage emoji="tada" size="large" />
            </div>
        );
    }
}

module.exports = PendingDM;
