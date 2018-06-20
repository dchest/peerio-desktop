const React = require('react');
const { MaterialIcon } = require('peer-ui');

function FileLoading(props) {
    return (
        <div className="file-loading" onClick={props.onCancel}>
            <MaterialIcon icon={props.loading} />
            <MaterialIcon icon="close" />
        </div>
    );
}

module.exports = FileLoading;
