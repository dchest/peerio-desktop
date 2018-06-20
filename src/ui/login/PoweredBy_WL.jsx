const React = require('react');

class PoweredBy extends React.Component {
    render() {
        return (
            <img
                className="poweredBy"
                alt="Powered by Peerio"
                src="static/img/poweredByPeerio_white.png" />
        );
    }
}

module.exports = PoweredBy;
