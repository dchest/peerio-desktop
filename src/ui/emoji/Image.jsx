const React = require('react');
const { computed } = require('mobx');
const { observer } = require('mobx-react');

const css = require('classnames');

const emojiMaster = {
    tada: {
        category: 'objects',
        id: '_1f389'
    },
    v: {
        category: 'diversity',
        id: '_270c-1f3fc'
    }
};

@observer
class EmojiImage extends React.Component {
    @computed get category() {
        return emojiMaster[this.props.emoji].category;
    }

    @computed get emojiID() {
        return emojiMaster[this.props.emoji].id;
    }

    render() {
        return (
            <div className={css(
                'emoji-image',
                this.props.size,
                `emojione-32-${this.category}`,
                this.emojiID,
                this.props.className
            )} />
        );
    }
}

module.exports = EmojiImage;
