const React = require('react');
const { Button, Input } = require('~/react-toolbox');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const T = require('~/ui/shared-components/T');

@observer
class RatingDialog extends React.Component {
    @observable numStars = 0;
    @observable currentRatingText;
    @observable textContent = '';

    updateNumStars = (n) => {
        this.numStars = n;
        this.currentRatingText = t(`dialog_rating${n}Star`);
    };

    handleTextChange = (value) => {
        this.textContent = value;
    };


    render() {
        const starArray = [];
        for (let i = 1; i <= 5; i++) {
            starArray.push(
                <div className="star-container">
                    <Button className="nowripple"
                        icon={this.numStars >= i ? 'star' : 'star_border'}
                        onClick={() => this.updateNumStars(i)} />
                </div>);
        }

        return (
            <div className="rating-dialog-content">
                <p><T k="dialog_ratingInstructions" /></p>
                <div className="star-rating-input">{starArray}</div>
                <div className="rating-text">
                    <p>{this.currentRatingText}</p>
                </div>
                <Input type="text" multiline
                    placeholder={t('dialog_suggestionsPlaceholder')}
                    value={this.textContent}
                    rows={4}
                    onChange={() => this.handleTextChange(this.value)} />

            </div>
        );
    }
}

module.exports = RatingDialog;
