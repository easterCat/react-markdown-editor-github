// navigationBar
import React from "react";
class NavigationBar extends React.Component {
  render() {
    return (
      <div className={"rmd-navigation"}>
        <div className="navigation-nav left">{this.props.left}</div>
        <div className="navigation-nav middle">{this.props.middle}</div>
        <div className="navigation-nav right">{this.props.right}</div>
      </div>
    );
  }
}
export default NavigationBar;
