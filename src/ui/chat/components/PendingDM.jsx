const React = require('react');

const { action, observable } = require('mobx');
const { observer } = require('mobx-react');

@observer
class PendingDM extends React.Component {
    render() {
        return (
            <div>
                Pending invite
            </div>
        );
    }
}

module.exports = PendingDM;
