const React = require('react');
const { observer } = require('mobx-react');
const { MaterialIcon } = require('peer-ui');
const css = require('classnames');

@observer
class SideBarSection extends React.Component {
    render() {
        return (
            <div className={css('sidebar-section', { closed: !this.props.open, open: this.props.open })} >
                <div
                    className={css(
                        'p-list-heading', { clickable: this.props.onToggle }
                    )}
                    onClick={this.props.onToggle}>
                    <div className="section-title">{this.props.title}</div>
                    {this.props.onToggle &&
                        <MaterialIcon icon={this.props.open ? 'arrow_drop_up' : 'arrow_drop_down'} />
                    }
                </div>
                <div className="section-content">
                    {this.props.open ? this.props.children : null}
                </div>
            </div>
        );
    }
}

module.exports = SideBarSection;
