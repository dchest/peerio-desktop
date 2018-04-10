const React = require('react');
const { observer } = require('mobx-react');

/*
    PROPS       type        description
    ----------------------------------------
    className   string
    onChange    function
    value       string      current value (optional in parent component. define this if you want a default selection)
    options     array       each object in array contains "value" and "label"
    ----------------------------------------
*/

@observer
class RadioButtons extends React.Component {
    setValue = (ev) => {
        this.props.onChange(ev.target.getAttribute('data-value'));
    }

    render() {
        const { value, options } = this.props;
        const radioOptions = [];

        for (let i = 0; i < options.length; i++) {
            radioOptions.push(
                <li key={options[i].value}>
                    <span
                        className={value === options[i].value
                            ? 'material-icons clickable selected'
                            : 'material-icons clickable'
                        }
                        data-value={options[i].value}
                        onClick={this.setValue}
                    >
                        {value === options[i].value
                            ? 'radio_button_checked'
                            : 'radio_button_unchecked'
                        }
                    </span>
                    <span className="label">
                        {options[i].label}
                    </span>
                </li>
            );
        }

        const classNames = this.props.className
            ? `p-radio ${this.props.className}`
            : 'p-radio';

        return (
            <ul className={classNames}>
                {radioOptions}
            </ul>
        );
    }
}

module.exports = RadioButtons;
