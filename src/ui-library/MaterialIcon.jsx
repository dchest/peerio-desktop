const React = require('react');
const css = require('classnames');
const Tooltip = require('./Tooltip');

/*
    PROPS           type        description
    ----------------------------------------
    className       string
    icon            string      Material Icon name with underscores for spaces

    tooltip         string
    tooltipPosition string

    active          bool        default false. set to true to enable 'active' style (e.g. $peerio-teal)
    ----------------------------------------

    TODO: size (rarely deviates from 24px, currently handled at CSS level)
*/

class MaterialIcon extends React.Component {
    render() {
        return (
            <span className={css(
                'material-icons',
                this.props.className,
                { active: this.props.active }
            )}>
                {this.props.icon}
                {this.props.tooltip
                    ? <Tooltip text={this.props.tooltip}
                        position={this.props.tooltipPosition}
                    />
                    : null
                }
            </span>
        );
    }
}

module.exports = MaterialIcon;
