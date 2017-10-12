const React = require('react');
const { Button, Input } = require('~/react-toolbox');
const { observable } = require('mobx');
const { observer } = require('mobx-react');

@observer
class RatingDialog extends React.Component {
    @observable state = {
        numStars: 0,
        textContent: ''
    };

    updateNumStars = (n) => {
        this.state.numStars = n;
    };

    handleTextChange = (value) => {
        this.setState({ textContent: value });
    };

    render() {
        return (
            <div className="rating-dialog-content">
                <p>Select how many stars you'd give us on a scale of 1-5.<br />
                We read all comments and feedback ☺️
                </p>

                <div className="star-rating-input">
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.state.numStars >= 1 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(1)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.state.numStars >= 2 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(2)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.state.numStars >= 3 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(3)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.state.numStars >= 4 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(4)} />
                    </div>
                    <div className="star-container">
                        <Button className="nowripple"
                            icon={this.state.numStars >= 5 ? 'star' : 'star_border'}
                            onClick={() => this.updateNumStars(5)} />
                    </div>
                </div>
                <p className="star-text">
                It's okay.
                </p>
                <Input type="text" multiline
                    placeholder="Tell us"
                    value={this.state.textContent}
                    rows="4"
                    onChange={() => this.handleTextChange(this.value)} />

            </div>
        );
    }
}

module.exports = RatingDialog;
