const React = require('react');
const { observable, computed, when, transaction } = require('mobx');
const { observer } = require('mobx-react');
const { Avatar, Button, Chip, Input, List, ListHeading, ListItem, MaterialIcon, ProgressBar } = require('~/peer-ui');
const { t } = require('peerio-translator');
const { fileStore, contactStore, User } = require('peerio-icebear');
const css = require('classnames');
const T = require('~/ui/shared-components/T');
const { getAttributeInParentChain } = require('~/helpers/dom');
const routerStore = require('~/stores/router-store');

@observer
class UserPicker extends React.Component {
    @observable selected = [];
    @observable query = '';
    accepted = false;
    @observable suggestInviteEmail = '';
    @observable showNotFoundError;
    @observable userAlreadyAdded = '';
    @observable foundContact;
    legacyContactError = false; // not observable bcs changes only with showNotFoundError
    @observable contactLoading = false;
    @observable _searchUsernameTimeout = false;

    @computed get showSearchError() {
        return this.suggestInviteEmail || this.showNotFoundError || this.userAlreadyAdded;
    }

    componentDidMount() {
        if (this.props.onChange) {
            this.selected.observe(() => this.props.onChange(this.selected));
        }
    }

    @computed get options() {
        const ret = contactStore.filter(this.query).filter(this.filterOptions);
        const favorites = ret.filter(s => s.isAdded);
        const normal = ret.filter(s => !s.isAdded);
        return {
            favorites,
            normal
        };
    }

    @computed get isValid() {
        return !this.selected.find(s => s.loading || s.notFound);
    }

    @computed get selectedSelfless() {
        return this.selected.filter(this.selfFilter);
    }

    @computed get queryIsEmpty() {
        return !this.query.trim().length;
    }

    filterOptions = (item) => {
        if (this.selected.find(s => s.username === item.username)) return false;
        if (this.props.noDeleted && item.isDeleted) return false;
        if (item.isMe) return false;
        if (this.isExcluded(item)) return false;

        return true;
    }

    isExcluded(contact) {
        if (this.props.exceptContacts && this.props.exceptContacts.includes(contact)) return true;
        return false;
    }

    selfFilter(contact) {
        return contact.username !== User.current.username;
    }

    reset() {
        this.legacyContactError = false;
        this.showNotFoundError = false;
        this.userAlreadyAdded = '';
        this.suggestInviteEmail = '';
        this.foundContact = null;
    }

    handleTextChange = newVal => {
        this.reset();
        const newValLower = newVal.toLocaleLowerCase();
        if (this.props.limit === 1) {
            this.query = newValLower.trim();
            this.searchUsernameTimeout(this.query);
            return;
        }
        if (newValLower.length > 1 && ', '.includes(newValLower[newValLower.length - 1])) {
            this.query = newValLower.substr(0, newValLower.length - 1).trim();
            this.tryAcceptUsername();
            return;
        }
        this.query = newValLower.trim();
    };

    // Don't use onKeyPress it won't catch backspace
    // Don't use onKeyUp - text change fires earlier
    handleKeyDown = e => {
        if (e.key === 'Enter' && this.query !== '') {
            // if we are in 1-1 DM selection and user hits enter
            if (this.props.limit === 1) {
                const c = this.foundContact || this.searchUsername(this.query);
                // if we know for sure contact is there, then go to DM immediately
                if (c && !c.loading && !c.notFound) {
                    this.query = '';
                    this.selected = [c];
                    this.accept();
                }
                return;
            }
            this.tryAcceptUsername();
        }
        if (e.key === 'Backspace' && this.query === '' && this.selected.length > 0) {
            this.selected.remove(this.selected[this.selected.length - 1]);
        }
    };

    searchUsernameTimeout(q) {
        if (this._searchUsernameTimeout) {
            clearTimeout(this._searchUsernameTimeout);
            this._searchUsernameTimeout = null;
        }
        if (!q) return;
        this._searchUsernameTimeout = setTimeout(() => {
            transaction(() => {
                this._searchUsernameTimeout = null;
                this.searchUsername(q);
            });
        }, 1000);
    }

    searchUsername(q) {
        if (!q) return null;
        const c = contactStore.getContact(q);
        if (this.isExcluded(c)) {
            this.userAlreadyAdded = this.query;
            return null;
        }
        this.contactLoading = true;
        when(() => !c.loading, () => {
            const atInd = q.indexOf('@');
            const isEmail = atInd > -1 && atInd === q.lastIndexOf('@');
            this.userNotFound = c.notFound ? q : '';
            this.suggestInviteEmail = (c.notFound && isEmail && !this.props.noInvite) ? q : '';
            this.legacyContactError = c.isLegacy;
            this.showNotFoundError = c.notFound;
            this.foundContact = !c.notFound && c;
            this.contactLoading = false;
        });
        return c;
    }

    async tryAcceptUsername() {
        this.reset();
        const c = this.searchUsername(this.query);
        if (c === null || this.selected.find(s => s.username === this.query)) {
            return;
        }
        this.query = '';
        if (this.isExcluded(c)) {
            return;
        }
        this.selected.push(c);
        when(() => !c.loading, () => {
            setTimeout(() => {
                if (c.notFound) this.selected.remove(c);
            }, 1000);
        });
    }

    accept = () => {
        if (this.query) {
            this.tryAcceptUsername();
            return;
        }
        if (this.props.onlyPick || this.accepted || !this.isValid) return;
        this.accepted = true;
        this.selected.forEach(s => {
            if (s.notFound) this.selected.remove(s);
        });
        this.props.onAccept(this.selected);
    };

    onInputMount = (input) => {
        if (!input || this.props.noAutoFocus) return;
        input.focus();
    };

    handleClose = () => {
        this.props.onClose();
    };

    onContactClick = (ev) => {
        const username = getAttributeInParentChain(ev.target, 'data-id');
        // avoiding incorrect setState because of computed options
        setTimeout(() => {
            const c = contactStore.getContact(username);
            if (this.props.limit === 1) {
                this.selected.clear();
                this.selected.push(c);
                this.query = '';
                this.accept();
                return;
            }
            this.query = '';
            if (this.isExcluded(c)) return;
            if (this.selected.find(i => i.username === c.username)) return;
            this.selected.push(c);
        });
    };

    invite = () => {
        contactStore.invite(this.suggestInviteEmail);
        this.query = '';
        this.reset();
    }

    renderList(subTitle, items) {
        if (!items.length) return null;
        return (
            <div key={subTitle} className="user-list">
                {!!subTitle &&
                    <ListHeading key={subTitle}
                        caption={this.foundContact
                            ? t(subTitle)
                            : `${t(subTitle)} (${items.length})`
                        }
                    />
                }
                {items.map(c => (
                    <span key={c.username} data-id={c.username}>
                        <ListItem
                            leftContent={<Avatar key="a" contact={c} size="medium" />}
                            caption={c.username}
                            legend={`${c.firstName} ${c.lastName}`}
                            onClick={this.onContactClick} />
                    </span>
                ))}
            </div>
        );
    }

    render() {
        const selectedFiles = fileStore.getSelectedFiles();

        return (
            <div className="user-picker">
                <div className={css('selected-items', { banish: !this.props.sharing })} >
                    <List clickable>
                        <ListHeading key="header" caption={t('title_selectedFiles')} />
                        {
                            selectedFiles.map(f => (<ListItem
                                key={f.id}
                                leftIcon="insert_drive_file"
                                caption={f.name}
                                rightIcon={selectedFiles.length > 1 ? 'remove_circle_outline' : undefined} />))
                        }

                    </List>
                </div>
                <div className="inputs-container">
                    <div className="inputs-container-inner">
                        <div className="chat-creation-header-container">
                            {this.props.noHeader
                                ? null
                                : <div className="chat-creation-header">
                                    <div className="title">
                                        {this.props.title}
                                        {this.props.description &&
                                            <span className="description">{this.props.description}</span>
                                        }
                                    </div>
                                    {this.props.closeable &&
                                        <Button icon="close" onClick={this.handleClose} className="button-close" />
                                    }
                                </div>
                            }
                            <div className="message-search-wrapper">
                                <div className="message-search-inner">
                                    {this.props.isDM && <T k="title_to" className="title-to" />}
                                    <div className="new-chat-search">
                                        <MaterialIcon icon="search" />
                                        <div className="chip-wrapper">
                                            {this.selected.map(c =>
                                                (<Chip key={c.username}
                                                    className={css({ 'not-found': c.notFound })}
                                                    onDeleteClick={() => this.selected.remove(c)} deletable>
                                                    {c.loading
                                                        ? <ProgressBar type="linear" mode="indeterminate" />
                                                        : c.username}
                                                </Chip>)
                                            )}
                                            <Input innerRef={this.onInputMount}
                                                placeholder={
                                                    routerStore.isNewChannel
                                                        ? t('title_Members')
                                                        : t('title_userSearch')
                                                }
                                                value={this.query} onChange={this.handleTextChange}
                                                onKeyDown={this.handleKeyDown} />
                                        </div>
                                        {this.props.limit !== 1 && this.props.onAccept && !routerStore.isNewChannel &&
                                            <Button
                                                label={this.props.button || t('button_go')}
                                                onClick={this.accept}
                                                disabled={!this.isValid
                                                    || (this.queryIsEmpty && this.selected.length === 0)}
                                                theme="affirmative"
                                            />
                                        }
                                        {(this.contactLoading || this._searchUsernameTimeout) &&
                                            <ProgressBar type="circular" mode="indeterminate" theme="small" />
                                        }
                                    </div>
                                </div>
                                {routerStore.isNewChannel &&
                                    <div className="helper-text">
                                        <T k="title_userSearch" />. <T k="title_optional" />
                                    </div>
                                }
                            </div>
                            {routerStore.isNewChannel &&
                                <div className="new-channel-button-container">
                                    <Button
                                        label={t('button_open')}
                                        onClick={this.props.onAccept}
                                        disabled={this.props.noSubmit}
                                        theme="affirmative"
                                    />
                                </div>
                            }
                        </div>
                        <div className="user-list-container">
                            {this.showSearchError &&
                                <div className="user-search-error-container">
                                    <div className="user-search-error">
                                        <div className="search-error-text">
                                            <MaterialIcon icon="help_outline" />
                                            {this.suggestInviteEmail &&
                                                <T k="title_inviteContactByEmail">
                                                    {{ email: this.suggestInviteEmail }}
                                                </T>
                                            }
                                            {this.showNotFoundError && !this.suggestInviteEmail &&
                                                <T k={this.legacyContactError ?
                                                    'title_inviteLegacy' : 'error_userNotFoundTryEmail'} tag="div">
                                                    {{ user: this.userNotFound }}
                                                </T>
                                            }
                                            {this.userAlreadyAdded &&
                                                <T k="error_userAlreadyAdded" tag="div">
                                                    {{ user: this.userAlreadyAdded }}
                                                </T>
                                            }
                                        </div>
                                        {this.suggestInviteEmail &&
                                            <Button
                                                onClick={this.invite}
                                                label={t('button_send')}
                                                theme="affirmative"
                                            />
                                        }
                                    </div>
                                </div>
                            }
                            <List theme="large" clickable>
                                {this.foundContact && this.renderList('title_exactMatch', [this.foundContact])}
                                {!this.foundContact
                                    && this.renderList('title_favoriteContacts', this.options.favorites)}
                                {!this.foundContact && this.renderList('title_allContacts', this.options.normal)}
                            </List>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


module.exports = UserPicker;
