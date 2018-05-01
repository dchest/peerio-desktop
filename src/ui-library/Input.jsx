const React = require('react');
const { action, observable } = require('mobx');
const { observer } = require('mobx-react');
const css = require('classnames');

/*
    PROPS       type        description
    ----------------------------------------
    * allows most standard html <input> props:
    autofocus   bool
    disabled    bool
    maxLength   int
    placeholder string
    readOnly    bool
    type        string      text (default), password are the only ones accepted
    value       string

    * plus React props: className, onBlur, onFocus, onChange, onKey* ...
    ----------------------------------------
*/

@observer
class Input extends React.Component {
    @observable isFocused;

    handleChange = (ev) => {
        this.props.onChange(ev.target.value);
    }

    @action.bound handleFocus() {
        this.isFocused = true;
        if (this.props.onFocus) this.props.onFocus();
    }

    @action.bound handleBlur() {
        this.isFocused = false;
        if (this.props.onBlur) this.props.onBlur();
    }

    render() {
        return (
            <div
                className={css(
                    'p-input',
                    this.props.className,
                    {
                        'has-error': !!this.props.error,
                        focused: this.isFocused
                    }
                )}
            >
                {this.props.multiline
                    ? <textarea
                        placeholder={this.props.placeholder}
                        value={this.props.value}
                        maxLength={this.props.maxLength}

                        onChange={this.props.onChange ? this.handleChange : null}
                        onKeyPress={this.props.onKeyPress}
                        onKeyDown={this.props.onKeyDown}
                        onKeyUp={this.props.onKeyUp}

                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}

                        ref={this.props.ref || this.props.innerRef}
                    />
                    : <input
                        placeholder={this.props.placeholder}
                        value={this.props.value}
                        maxLength={this.props.maxLength}

                        onChange={this.props.onChange ? this.handleChange : null}
                        onKeyPress={this.props.onKeyPress}
                        onKeyDown={this.props.onKeyDown}
                        onKeyUp={this.props.onKeyUp}

                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}

                        type={this.props.type || 'text'}
                        autoFocus={this.props.autoFocus} // eslint-disable-line
                        readOnly={this.props.readOnly}
                        disabled={this.props.disabled}

                        ref={this.props.ref || this.props.innerRef}
                    />
                }
                {this.props.label
                    ? <div
                        className={css(
                            'label',
                            { shrink: this.props.value !== '' || this.isFocused }
                        )}
                    >
                        {this.props.label}
                    </div>
                    : null
                }
                {this.props.hint
                    ? <div
                        className={css(
                            'hint',
                            { visible: this.props.value === '' }
                        )}
                    >
                        {this.props.hint}
                    </div>
                    : null
                }
                {this.props.error ? <div className="error">{this.props.error}</div> : null}
            </div>
        );
    }
}

module.exports = Input;
