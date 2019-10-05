import React, { Component } from "react";
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

class HtmlRender extends React.Component {
  render() {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: this.props.html }}
        className={`custom-html-style ${this.props.className || ""}`}
      />
    );
  }
}

export default class Md extends Component {
  constructor(props) {
    super(props);

    this.state = {
      previewContent: "",
      content: content
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

    this.leftScroll = React.createRef();
    this.rightScroll = React.createRef();
    this.onContentChange = this.onContentChange.bind(this);
    this.renderToHtml = this.renderToHtml.bind(this);
    this.initContent = this.initContent.bind(this);
  }

  componentDidMount() {
    this.initContent();

    let l = this.leftScroll.current;
    let r = this.rightScroll.current;

    l.addEventListener("mousewheel", function() {
      r.scrollTop = l.scrollTop;
    });
    r.addEventListener("mousewheel", function() {
      l.scrollTop = r.scrollTop;
    });
  }

  initContent() {
    const { content } = this.state;
    const previewContent = this.renderToHtml(content);
    console.log("previewContent :", previewContent);
    this.setState({
      previewContent
    });
  }

  onContentChange(e) {
    const content = e.target.value;
    const previewContent = this.renderToHtml(content);

    this.setState({
      content,
      previewContent
    });
  }

  renderToHtml(text) {
    return this.mdParser.render(text);
  }

  render() {
    const { previewContent } = this.state;
    return (
      <div id="ReactMarkdown" style={{ height: "600px" }}>
        <div className="rmd-header"></div>
        <div className="rmd-tools"></div>
        <div className="rmd-container">
          <div ref={this.leftScroll} className="rmd-container-editor">
            <textarea className="rmd-textarea" value={this.state.content} onChange={this.onContentChange} />
          </div>
          <div className="rmd-container-result" ref={this.rightScroll}>
            <HtmlRender html={previewContent} />
          </div>
        </div>
      </div>
    );
  }
}
