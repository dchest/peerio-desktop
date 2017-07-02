const React = require('react');
const { Route, IndexRoute, IndexRedirect } = require('react-router');
const App = require('./App');
const Root = require('./Root');
const Login = require('./login/Login');
const Signup = require('./signup/Signup');
const Chat = require('./chat/Chat');
const NewChat = require('./chat/NewChat');
const Files = require('./files/Files');
const ShareFiles = require('./files/ShareFiles');
const Mail = require('./mail/Mail');
const Settings = require('./settings/Settings');
const Profile = require('./settings/components/ProfileSettings');
const Security = require('./settings/components/SecuritySettings');
const Preferences = require('./settings/components/Preferences');
const Account = require('./settings/components/Account');
const About = require('./settings/components/About');
const Help = require('./settings/components/Help');
const DevTools = require('./dev-tools/DevTools');
const DTDashboard = require('./dev-tools/Dashboard');
const KegEditor = require('./dev-tools/KegEditor');
const NewDevice = require('./login/NewDevice');
const AutoLogin = require('~/ui/login/AutoLogin');
const Contacts = require('./contact/Contacts');
const InvitedContacts = require('./contact/InvitedContacts');
const ContactList = require('./contact/ContactList');
const NewContact = require('./contact/NewContact');
const DevSettings = require('./settings/components/Dev');

module.exports = (
    <Route path="/" component={Root}>
        <IndexRoute component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/new-device" component={NewDevice} />
        <Route path="autologin" component={AutoLogin} />
        <Route path="/app" component={App} >
            <IndexRedirect to="/app/chats" />
            <Route path="chats" component={Chat} />
            <Route path="new-chat" component={NewChat} />
            <Route path="files" component={Files} />
            <Route path="sharefiles" component={ShareFiles} />
            <Route path="contacts" component={Contacts} >
                <IndexRoute component={ContactList} />
                <Route path="invited" component={InvitedContacts} />
                <Route path="new-contact" component={NewContact} />
                <Route path="new-invite" component={NewContact} />
            </Route>
            <Route path="mail" component={Mail} />
            <Route path="settings" component={Settings}>
                <Route path="profile" component={Profile} />
                <Route path="security" component={Security} />
                <Route path="preferences" component={Preferences} />
                <Route path="account" component={Account} />
                <Route path="about" component={About} />
                <Route path="help" component={Help} />
                <Route path="dev" component={DevSettings} />
            </Route>
        </Route>
        <Route path="/dev-tools" component={DevTools} >
            <IndexRoute component={DTDashboard} />
            <Route path="kegs" component={KegEditor} />
        </Route>
    </Route>
);
