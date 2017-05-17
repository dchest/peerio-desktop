const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { Input } = require('~/react-toolbox');
const { t } = require('peerio-translator');

@observer
class BetterInput extends React.Component {

    @observable value = '';
    @observable isValid = true;
    accepted = false;
    rejected = false;
    focused = false;

    componentWillMount() {
        this.value = this.props.value || '';
    }
    componentWillReceiveProps(props) {
        this.value = props.value || '';
    }

    onChange = val => {
        this.value = val;
        if (this.props.validator) {
            const res = this.props.validator(val);
            if (res instanceof Promise) {
                res.then(valid => {
                    this.isValid = valid;
                    this.emitConsumerOnChange(val, valid);
                });
            } else {
                this.isValid = res;
                this.emitConsumerOnChange(val, res);
            }
        } else this.emitConsumerOnChange(val, true);
    };

    emitConsumerOnChange = (val, valid) => {
        if (!this.props.onChange) return;
        this.props.onChange(val, valid);
    };

    onFocus = () => {
        this.accepted = false;
        this.rejected = false;
        this.focused = true;
        if (this.props.onFocus) this.props.onFocus();
    };

    onBlur = () => {
        // WORKAROUND: under some circumstances like calling focus() on message input react calls false blur event
        if (!this.focused) return;
        if (this.props.acceptOnBlur === 'false' || !this.isValid) return;
        this.focused = false;
        if (this.props.onBlur) this.props.onBlur();
        if (this.accepted || this.rejected) return;
        this.props.onAccept(this.inputRef.getWrappedInstance().inputNode.value, this.isValid);
        this.accepted = true;
    };

    onKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (!this.isValid) return;
            this.accepted = true;
            this.props.onAccept(this.value, this.isValid);
            this.inputRef.getWrappedInstance().blur();
        } if (e.key === 'Escape') {
            this.rejected = true;
            if (this.props.onReject) this.props.onReject();
            this.value = this.props.value || '';
            this.inputRef.getWrappedInstance().blur();
        }
    };

    cancel() {
        this.rejected = true;
    }

    setRef = (ref) => {
        if (ref) {
            this.inputRef = ref;
        }
    }

    focus() {
        if (this.inputRef) this.inputRef.getWrappedInstance().focus();
    }


    render() {
        const { onFocus, onBlur, onChange, onKeyDown, onAccept, onReject,
            value, acceptOnBlur, validator, error, ...props } = this.props;
        props.onFocus = this.onFocus;
        props.onBlur = this.onBlur;
        props.onChange = this.onChange;
        props.onKeyDown = this.onKeyDown;
        props.ref = this.setRef;
        props.value = this.value;
        props.type = 'text';
        props.error = this.isValid ? '' : t(error);
        return React.createElement(Input, props);
    }

}

module.exports = BetterInput;
