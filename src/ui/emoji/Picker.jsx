// @ts-check

const React = require('react');
const { observable, computed, action, runInAction } = require('mobx');
const { observer } = require('mobx-react');
const css = require('classnames');
const { MaterialIcon } = require('peer-ui');
const _ = require('lodash');
const { t } = require('peerio-translator');
const { User } = require('peerio-icebear');

const {
    emojiCategories,
    emojiByCanonicalShortname,
    emojiByCategories
} = require('~/helpers/chat/emoji');

const recentList = computed(() => {
    if (!User.current) return [];
    return User.current.emojiMRU.list.map(shortname => emojiByCanonicalShortname[shortname]);
});

const emojiDataWithRecent = { ...emojiByCategories };
Object.defineProperty(emojiDataWithRecent, 'recent', {
    get: () => recentList.get()
});

const categories = [{ id: 'recent', name: 'Recently Used' }, ...emojiCategories];

function skipNulls(i) {
    if (i === null) return false;
    return true;
}

/**
 * @augments {React.Component<{
        onPicked : (emoji : any) => void
        onBlur : () => void
    }, {}>}
 */
@observer
class Picker extends React.Component {
    @observable searchKeyword = '';
    selectedCategory = observable.shallowBox(categories[0].id);
    hoveredEmoji = observable.shallowBox(null);

    // if we click within the picker div, a blur event may be fired, but we
    // don't want to blur. onMouseDown fires before onBlur, so in the former we
    // set this flag and in the latter we check for it (and if it's set, we
    // clear it and focus the div instead.)
    blurPrevented = false;

    // We show info for the hovered emoji in the <InfoPane> component, and we'd
    // like it to stick around for a second or two even if we stop hovering over
    // anything. So instead of clearing it immediately we set a timeout to clear
    // it, and if we hover over something else in the meantime we cancel the
    // timeout.
    clearHoveredEmojiTimer = null;

    @action.bound
    onSearchKeywordChange(val) {
        this.searchKeyword = val.toLocaleLowerCase();
    }

    @action.bound
    onEmojiMouseEnter(e) {
        if (this.clearHoveredEmojiTimer) {
            clearTimeout(this.clearHoveredEmojiTimer);
        }
        this.hoveredEmoji.set(emojiByCanonicalShortname[e.target.attributes['data-shortname'].value]);
    }

    onEmojiMouseLeave = () => {
        this.clearHoveredEmojiTimer = setTimeout(this.resetHoveredEmoji, 2000);
    };

    @action.bound
    resetHoveredEmoji() {
        this.hoveredEmoji.set(null);
    }

    onPicked = (e) => {
        const shortname = e.target.attributes['data-shortname'].value;
        User.current.emojiMRU.addItem(shortname);
        this.props.onPicked(emojiByCanonicalShortname[shortname]);
    };

    preventBlur = () => {
        this.blurPrevented = true;
    };
    handleBlur = (ev) => {
        if (this.blurPrevented) {
            this.blurPrevented = false;
            ev.target.focus();
            return;
        }
        this.props.onBlur();
    };

    render() {
        return (
            <div className="emoji-picker" onBlur={this.handleBlur} onMouseDown={this.preventBlur}>
                <CategoriesHeader selectedCategory={this.selectedCategory} />
                <EmojiSearch searchKeyword={this.searchKeyword} onSearchKeywordChange={this.onSearchKeywordChange} />
                <EmojiList
                    searchKeyword={this.searchKeyword}
                    selectedCategory={this.selectedCategory}
                    onEmojiMouseEnter={this.onEmojiMouseEnter}
                    onEmojiMouseLeave={this.onEmojiMouseLeave}
                    onEmojiPicked={this.onPicked} />
                <InfoPane hoveredEmoji={this.hoveredEmoji} />
            </div>
        );
    }
}


/**
 * @augments {React.Component<{
        selectedCategory : { get() : any, set(value : any) : void } // FIXME/TS: IObservableValue<any>
    }, {}>}
 */
@observer
class CategoriesHeader extends React.Component {
    @action.bound
    onCategoryClick(id) {
        const el = document.getElementsByClassName(`category-header ${id}`)[0];
        if (!el) return;
        this.props.selectedCategory.set(id);
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    render() {
        return (<div className="categories" key="categories">
            {
                categories.map(c =>
                    (<Category id={c.id} key={c.id} selected={this.props.selectedCategory.get() === c.id}
                        name={c.name} onClick={this.onCategoryClick} />))
            }
        </div>);
    }
}


/**
 * @augments {React.Component<{
        searchKeyword : string
        onSearchKeywordChange : (keyword : string) => void
    }, {}>}
 */
@observer
class EmojiSearch extends React.Component {
    @observable keyword = '';
    inputRef(ref) {
        if (ref) ref.focus();
    }
    onKeywordChange = (ev) => {
        this.keyword = ev.target.value;
        this.fireChangeEvent();
    };
    fireChangeEvent = _.throttle(() => {
        this.props.onSearchKeywordChange(this.keyword);
    }, 250);
    clearSearchKeyword = () => {
        this.keyword = '';
        this.fireChangeEvent();
    };
    render() {
        // Don't make IconButton out of clear search keyword button, it messes up blur event
        return (<div className="emoji-search">
            <MaterialIcon icon="search" className="search-icon" />
            <input className="emoji-search-input" type="text" placeholder={t('title_search')}
                ref={this.inputRef}
                onChange={this.onKeywordChange} value={this.keyword} />
            {
                this.props.searchKeyword
                    ? <MaterialIcon
                        className="clear-keyword-button"
                        icon="highlight_off"
                        onClick={this.clearSearchKeyword} />
                    : null
            }
        </div>);
    }
}


/**
 * @augments {React.Component<{
        searchKeyword : string,
        selectedCategory : { get() : any, set(value : any) : void } // FIXME/TS: IObservableValue<any>
        onEmojiMouseEnter : (ev : React.MouseEvent<any>) => void
        onEmojiMouseLeave : (ev : React.MouseEvent<any>) => void
        onEmojiPicked : (ev : React.MouseEvent<any>) => void
    }, {}>}
 */
@observer
class EmojiList extends React.Component {
    // On scroll, we want to update the category headers if we've moved to a different one.
    handleScroll = _.throttle(() => {
        const candidates = [];
        let closest;
        /** @type {HTMLElement} */
        // @ts-ignore (can't as-cast without typescript)
        const parent = document.getElementsByClassName(`emojis`)[0];
        for (let i = 0; i < categories.length; i++) {
            /** @type {HTMLElement} */
            // @ts-ignore (can't as-cast without typescript)
            const c = document.getElementsByClassName(`category-header ${categories[i].id}`)[0];
            if (!c || c.offsetTop > (parent.offsetHeight + parent.scrollTop)) continue;
            candidates.push({ id: categories[i].id, offsetTop: c.offsetTop });
        }
        if (!candidates.length) return;
        closest = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
            if (Math.abs(parent.scrollTop - closest.offsetTop) > Math.abs(parent.scrollTop - candidates[i].offsetTop)) {
                closest = candidates[i];
            }
        }
        if (this.props.selectedCategory.get() !== closest.id) {
            runInAction(() => { this.props.selectedCategory.set(closest.id); });
        }
    }, 1000);

    render() {
        return (<div className="emojis" key="emojis" onScroll={this.handleScroll}>
            {
                categories.map(c => {
                    return (<div key={c.id}>
                        <div className={`category-header ${c.id}`}>{c.name}</div>
                        {emojiDataWithRecent[c.id].map(e => {
                            if (!e || e.index.indexOf(this.props.searchKeyword) < 0) return null;
                            return (
                                <span
                                    onMouseEnter={this.props.onEmojiMouseEnter}
                                    onMouseLeave={this.props.onEmojiMouseLeave}
                                    onClick={this.props.onEmojiPicked}
                                    className={e.className}
                                    key={e.shortname}
                                    data-shortname={e.shortname} />
                            );
                        }).filter(skipNulls)}
                    </div>);
                }).filter(item => item.props.children[1].length > 0)
            }
        </div>);
    }
}


/**
 * @augments {React.Component<{
        hoveredEmoji : { get() : any, set(value : any) : void } // FIXME/TS: IObservableValue<any>
    }, {}>}
 */
@observer
class InfoPane extends React.Component {
    render() {
        const hoveredEmoji = this.props.hoveredEmoji.get();
        if (!hoveredEmoji) {
            return (
                <div className="info-pane default">
                    <span className="emojione emojione-32-people _1f446" /> Pick your emoji
                </div>
            );
        }
        return (
            <div className="info-pane">
                <span className={hoveredEmoji.className} />
                <div>
                    <span className="bold">{hoveredEmoji.name}</span><br />
                    {hoveredEmoji.shortname} {hoveredEmoji.aliases}<br />
                    <span className="monospace">{hoveredEmoji.ascii}</span>
                </div>
            </div>
        );
    }
}

function Category(props) {
    return (
        <img src={`static/img/emoji-categories/${props.id}.svg`}
            title={props.name} alt={props.name}
            className={css('category', { selected: props.selected })}
            onClick={() => props.onClick(props.id)} />
    );
}

module.exports = Picker;
