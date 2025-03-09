import React from "react";
import footerImg from "../../img/unicorn_icon.png";

const Footer: React.FC = () => {
    const date: number = new Date().getFullYear();
    return (
      <footer>
        <div className="copyright">
          <p>Made with love by Myself <img src={footerImg} className="footer-icon" alt="unicorn icon" /></p>
          <p>This site is licensed by me unless otherwise stated.</p>
          <p id="date">{date}</p>
        </div>
      </footer>
    );
  };
  
  export default Footer;