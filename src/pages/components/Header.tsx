import React from "react";
// import Menu from './userMenu';
import mainImg from "../../img/main_icon.jpg";

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <a href="/" className="logo_a">
            <img src={mainImg} className="label" id="head_icon" alt="Main Icon" />
          </a>
          <h1 className="title">Bookworm's World</h1>
          <div className="menu-container">
            {/* <Menu /> */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;