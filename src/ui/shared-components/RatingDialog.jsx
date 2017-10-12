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
        this.setState({ textContent: value });
    };

    render() {
        return (
            <div className="rating-dialog-content">
                <T k="dialog_ratingInstructions" />

                <div className="star-rating-input">
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.numStars >= 1 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(1)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.numStars >= 2 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(2)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.numStars >= 3 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(3)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.numStars >= 4 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(4)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.numStars >= 5 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(5)} />
                    </div>
                </div>
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
