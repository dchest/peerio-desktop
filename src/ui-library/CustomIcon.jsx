const React = require('react');
const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const css = require('classnames');
const { getParentWithClass } = require('~/helpers/dom');

/*
    PROPS       type        description
    ----------------------------------------
    className   string
    icon        string      icon name, no ext (see static/img/custom-icons)
    size        string      small, medium (default)

    hover       bool        default false. set true to enable hover icon.
                            * Requires parent w/ .custom-icon-hover-container

    active      bool        default. set to true to force "active" style (opacity: 1)
    ----------------------------------------
*/

@observer
class CustomIcon extends React.Component {
    @observable hovered;

    hoverContainer;
    @action.bound setIconRef(ref) {
        if (ref) {
            this.hoverContainer = getParentWithClass(ref, 'custom-icon-hover-container');

            if (this.hoverContainer) {
                this.hoverContainer.addEventListener('mouseenter', this.handleMouseEnter, false);
                this.hoverContainer.addEventListener('mouseleave', this.handleMouseLeave, false);
            }
        }
    }

    @action.bound handleMouseEnter() { this.hovered = true; }
    @action.bound handleMouseLeave() { this.hovered = false; }

    componentWillUnmount() {
        if (this.hoverContainer) {
            this.hoverContainer.removeEventListener('mouseenter', this.handleMouseEnter, false);
            this.hoverContainer.removeEventListener('mouseleave', this.handleMouseLeave, false);
        }
    }

    render() {
        return (
            <div
                className={css(
                    'p-custom-icon',
                    this.props.size,
                    this.props.className,
                    {
                        hovered: this.hovered,
                        active: this.props.active
                    }
                )}
                ref={this.props.hover ? this.setIconRef : null}
            >
                <img className="default" src={`./static/custom-icons/${this.props.icon}.svg`} />
                {this.props.hover
                    ? <img className="hover" src={`./static/custom-icons/${this.props.icon}-hover.svg`} />
                    : null
                }
            </div>
        );
    }
}

module.exports = CustomIcon;
