import React, { Component } from "react";
import NavigationBar from "./components/NavigationBar";
import DropList from "./components/DropList";
import TableList from "./components/TableList";
import { Icon } from "antd";
import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import subscript from "markdown-it-sub";
import superscript from "markdown-it-sup";
import footnote from "markdown-it-footnote";
import deflist from "markdown-it-deflist";
import abbreviation from "markdown-it-abbr";
import insert from "markdown-it-ins";
import mark from "markdown-it-mark";
import tasklists from "markdown-it-task-lists";
import hljs from "highlight.js/lib/highlight";
import "highlight.js/styles/github.css";
import "./styles/App.less";
import content from "./content.js";
import Decorate from "./utils/decorate";

export default class Md extends Component {
  willScrollEle = ""; // 即将滚动的元素 md html

  hasContentChanged = true;

  scale = 1;

  initialSelection = {
    isSelected: false,
    start: 0,
    end: 0,
    content: ""
  };

  selection = { ...this.initialSelection };

  constructor(props) {
    super(props);

    this.state = {
      previewContent: "",
      content: content,
      fullScreen: false,
      dropButton: {
        header: false,
        table: false
      }
    };

    this.mdParser = new MarkdownIt({
      html: true,
      linkify: true,
      breaks: true,
      highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return '<pre class="hljs"><code>' + hljs.highlight(lang, str, true).value + "</code></pre>";
          } catch (__) {}
        }

        return '<pre class="hljs"><code>' + this.mdParser.utils.escapeHtml(str) + "</code></pre>";
      }
    })
      .use(emoji)
      .use(subscript)
      .use(superscript)
      .use(footnote)
      .use(deflist)
      .use(abbreviation)
      .use(insert)
      .use(mark)
      .use(tasklists, { enabled: this.taskLists });

    this.handleInputScroll = throttle(e => {
      const l = this.leftScroll.current;
      const r = this.rightScroll.current;

      e.persist();
      if (this.willScrollEle === "md") {
        this.hasContentChanged && this._setScrollValue();
        if (l && r) {
          r.scrollTop = l.scrollTop / this.scale;
        }
      }
    }, 1000 / 60);

    this.handlePreviewScroll = throttle(e => {
      const l = this.leftScroll.current;
      const r = this.rightScroll.current;
      e.persist();
      if (this.willScrollEle === "html") {
        this.hasContentChanged && this._setScrollValue();
        if (l && r) {
          l.scrollTop = r.scrollTop * this.scale;
        }
      }
    }, 1000 / 60);

    this.leftScroll = React.createRef();
    this.rightScroll = React.createRef();
    this.onContentChange = this.onContentChange.bind(this);
    this.renderToHtml = this.renderToHtml.bind(this);
    this.initContent = this.initContent.bind(this);
    this.handleDecorate = this.handleDecorate.bind(this);
    this._getDecoratedText = this._getDecoratedText.bind(this);
    this.handleInputSelect = this.handleInputSelect.bind(this);
    this._setMdText = this._setMdText.bind(this);
    this.handleToggleFullScreen = this.handleToggleFullScreen.bind(this);
    this.handleScrollEle = this.handleScrollEle.bind(this);
    this._setScrollValue = this._setScrollValue.bind(this);
  }

  renderToHtml(text) {
    return this.mdParser.render(text);
  }

  componentDidMount() {
    this.initContent();
  }

  _setScrollValue() {
    // 设置值，方便 scrollBy 操作

    const l = this.leftScroll.current;
    const r = this.rightScroll.current;

    this.scale = (l.scrollHeight - l.offsetHeight) / (r.scrollHeight - r.offsetHeight);
    this.hasContentChanged = false;
  }

  handleDecorate(type, option = {}) {
    const clearList = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "unorder",
      "order",
      "quote",
      "hr",
      "inlinecode",
      "code",
      "table",
      "image",
      "link"
    ];
    if (clearList.indexOf(type) > -1) {
      if (!this.selection.isSelected) {
        return;
      }
      const content = this._getDecoratedText(type, option);
      this._setMdText(content);
      this._clearSelection();
    } else {
      const content = this._getDecoratedText(type, option);
      this._setMdText(content);
    }
  }

  _getDecoratedText(type, option) {
    const { content = "" } = this.state;
    const { selection } = this;
    const beforeContent = content.slice(0, selection.start);
    const afterContent = content.slice(selection.end, content.length);
    const decorate = new Decorate(selection.content);
    let decoratedText = "";
    if (type === "image") {
      decoratedText = decorate.getDecoratedText(type, {
        target: option.target || "",
        imageUrl: option.imageUrl || this.config.imageUrl
      });
    } else if (type === "link") {
      decoratedText = decorate.getDecoratedText(type, {
        linkUrl: ""
      });
    } else {
      decoratedText = decorate.getDecoratedText(type, option);
    }
    const result = beforeContent + `${decoratedText}` + afterContent;
    return result;
  }

  _setMdText(value = "") {
    const content = value.replace(/↵/g, "\n");
    const previewContent = this.renderToHtml(content);
    this.setState({
      content,
      previewContent
    });
  }

  _clearSelection() {
    this.selection = Object.assign({}, this.initialSelection);
  }

  initContent() {
    const { content } = this.state;
    const previewContent = this.renderToHtml(content);

    this.setState({
      previewContent
    });
  }

  onContentChange(e) {
    const content = e.target.value;
    const previewContent = this.renderToHtml(content);

    if (!this.hasContentChanged) {
      this.hasContentChanged = true;
    }

    this.setState({
      content,
      previewContent
    });
  }

  handleInputSelect(e) {
    e.persist();
    this.selection = Object.assign({}, this.selection, { isSelected: true }, this._getSelectionInfo(e));
  }

  _getSelectionInfo(e) {
    const source = e.srcElement || e.target;
    const start = source.selectionStart;
    const end = source.selectionEnd;
    const content = (source.value || "").slice(start, end);
    const selection = { start, end, content };
    return selection;
  }

  handleToggleFullScreen() {
    this.setState({
      fullScreen: !this.state.fullScreen
    });
  }

  handleScrollEle(node) {
    this.willScrollEle = node;
  }

  showDropList(type = "header", flag) {
    const { dropButton } = this.state;
    this.setState({
      dropButton: { ...dropButton, [type]: flag }
    });
  }

  render() {
    const { previewContent, fullScreen, dropButton } = this.state;

    return (
      <div id="ReactMarkdown" style={{ height: "600px" }}>
        <div className="rmd-header">
          <NavigationBar
            left={
              <div className="button-wrap">
                <span className="button" title="bold" onClick={() => this.handleDecorate("bold")}>
                  <Icon type="bold" />
                </span>
                <span className="button" title="italic" onClick={() => this.handleDecorate("italic")}>
                  <Icon type="italic" />
                </span>
                <span className="button" title="italic" onClick={() => this.handleDecorate("underline")}>
                  <Icon type="underline" />
                </span>
                <span className="button" title="strikethrough" onClick={() => this.handleDecorate("strikethrough")}>
                  <Icon type="strikethrough" />
                </span>
                <span className="button" title="unorder" onClick={() => this.handleDecorate("unorder")}>
                  <Icon type="unordered-list" />
                </span>
                <span className="button" title="order" onClick={() => this.handleDecorate("order")}>
                  <Icon type="ordered-list" />
                </span>
                <span
                  className="button"
                  title="table"
                  onMouseEnter={() => this.showDropList("table", true)}
                  onMouseLeave={() => this.showDropList("table", false)}
                >
                  <Icon type="table" />
                  <DropList
                    show={dropButton.table}
                    onClose={() => {
                      this.showDropList("table", false);
                    }}
                    render={() => {
                      return (
                        <TableList
                          maxRow={4}
                          maxCol={6}
                          onSetTable={option => {
                            this.handleDecorate("table", option);
                          }}
                        />
                      );
                    }}
                  />
                </span>
                <span className="button" title="link" onClick={() => this.handleDecorate("link")}>
                  <Icon type="link" />
                </span>
                {/* <span className="button" title="empty" onClick={this.handleEmpty}>
                  <Icon type="delete" />
                </span>
                <span className="button" title="undo" onClick={this.handleUndo}>
                  <Icon type="undo" />
                </span>
                <span className="button" title="redo" onClick={this.handleRedo}>
                  <Icon type="redo" />
                </span> */}
              </div>
            }
            right={
              <div className="button-wrap">
                <span className="button" title="full screen" onClick={this.handleToggleFullScreen}>
                  {fullScreen ? <Icon type="fullscreen-exit" /> : <Icon type="fullscreen" />}
                </span>
              </div>
            }
          />
          )
        </div>
        <div className="rmd-tools"></div>
        <div className="rmd-container">
          <div className="rmd-container-editor">
            <textarea
              ref={this.leftScroll}
              className="rmd-textarea"
              value={this.state.content}
              onChange={this.onContentChange}
              onSelect={this.handleInputSelect}
              onMouseOver={() => this.handleScrollEle("md")}
              onScroll={this.handleInputScroll}
            />
          </div>
          <div
            className="rmd-container-result"
            ref={this.rightScroll}
            onScroll={this.handlePreviewScroll}
            onMouseOver={() => this.handleScrollEle("html")}
          >
            <div dangerouslySetInnerHTML={{ __html: previewContent }} className={`custom-html-style`} />
          </div>
        </div>
      </div>
    );
  }
}

function throttle(func, deltaX) {
  let lastCalledAt = new Date().getTime();
  return function() {
    if (new Date().getTime() - lastCalledAt >= deltaX) {
      func.apply(this, arguments);
      lastCalledAt = new Date().getTime();
    }
  };
}
