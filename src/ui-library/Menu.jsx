const React = require('react');
const ReactDOM = require('react-dom');

const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

const css = require('classnames');
const { getDataProps, getParentWithClass } = require('~/helpers/dom');

const Button = require('./Button');
const Tooltip = require('./Tooltip');

const appRoot = document.getElementById('root');

/*
    PROPS           type        description
    ----------------------------------------
    className       string

    position        string      the starting point where <MenuGlobal> will be drawn
                                'top-left' (default), 'top-right', 'bottom-left', 'bottom-right'

    icon            string      * Material Icon name
    customIcon      string      * Custom Icon name
    customButton                * any HTML
                                * (use one of the above for the Menu button)

    tooltip         string
    tooltipPosition string      default 'top'
    theme           string      so far only 'wide' exists

    onClick         function    use this very rarely, e.g. to stopPropagation of other click events
    ----------------------------------------
*/

@observer
class Menu extends React.Component {
    @observable menuActive;
    @observable menuVisible

    @observable style = {
        top: 'inherit',
        bottom: 'inherit',
        left: 'inherit',
        right: 'inherit'
    };

    menuButtonRef;
    scrollContainer;

    @action.bound setMenuButtonRef(ref) {
        if (ref) {
            this.menuButtonRef = ref;
            this.scrollContainer = getParentWithClass(ref, 'scrollable');
        }
    }

    @action.bound setMenuContentRef(ref) {
        if (ref) this.menuVisible = true;
    }

    @action.bound handleMenuClick() {
        if (this.hideMenuTimeout) {
            this.menuActive = false;
            clearTimeout(this.hideMenuTimeout);
            this.hideMenuTimeout = null;
        }

        this.setStyle();
        this.menuActive = true;

        window.addEventListener('click', this.hideMenu, true);
        window.addEventListener('keyup', this.handleKeyUp);

        if (this.scrollContainer) {
            this.scrollContainer.addEventListener('scroll', this.hideMenu);
        }
    }

    @action.bound handleKeyUp(ev) {
        if (ev.keyCode === 27) this.hideMenu();
    }

    @action.bound hideMenu() {
        // Need this timeout to delay menu hide so that the hide animation fires
        this.menuVisible = false;
        this.hideMenuTimeout = setTimeout(() => {
            this.menuActive = false;
            this.hideMenuTimeout = null;
        }, 250);

        window.removeEventListener('click', this.hideMenu, true);
        window.removeEventListener('keyup', this.handleKeyUp);

        if (this.scrollContainer) {
            this.scrollContainer.removeEventListener('scroll', this.hideMenu);
        }
    }

    setStyle() {
        const { width, height, left, top } = this.menuButtonRef.getBoundingClientRect();
        const windowX = window.innerWidth;
        const windowY = window.innerHeight;

        const [posY, posX] = this.props.position.split('-');
        if (posY === 'top') this.style.top = `${top}px`;
        if (posY === 'bottom') this.style.bottom = `${windowY - top - height}px`;
        if (posX === 'left') this.style.left = `${left}px`;
        if (posX === 'right') this.style.right = `${windowX - left - width}px`;
    }

    render() {
        const menuButton = (
            <div
                key="p-menu"
                className={css(
                    'p-menu',
                    this.props.className,
                    { clickable: this.menuactive }
                )}
                ref={this.setMenuButtonRef}
                onClick={this.props.onClick}
            >
                <Button
                    icon={this.props.icon}
                    customIcon={this.props.customIcon}
                    onClick={this.handleMenuClick}
                    disabled={this.menuActive}
                >
                    {this.props.customButton}
                </Button>

                {this.props.tooltip
                    ? <Tooltip
                        text={this.props.tooltip}
                        position={this.props.tooltipPosition || 'top-left'}
                    />
                    : null
                }
            </div>
        );

        if (!this.menuActive) return menuButton;

        const menuContent = (
            <div
                key="p-menu-content"
                className={css(
                    'p-menu-content',
                    this.props.theme,
                    { visible: this.menuVisible }
                )}
                style={this.style}
                ref={this.setMenuContentRef}
                {...getDataProps(this.props)}
            >
                {this.props.children}
            </div>
        );

        return [
            menuButton,
            ReactDOM.createPortal(
                menuContent,
                appRoot
            )
        ];
    }
}

module.exports = Menu;
