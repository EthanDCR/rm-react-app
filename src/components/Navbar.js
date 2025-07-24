import React from "react";
import './Navbar.css';
import { Link } from "react-router-dom";
import logo from '../assets/rm-web-logo.png';

const Navbar = () => {
  return (
    <nav className="nav">
      <Link to="/">
        <img src={logo} alt="RM Web Logo" className="logo" />
      </Link>
      <ul className="links">
        <li><Link to="/" className="link">Home</Link></li>
        <li><Link to="/contact" className="link">Contact</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
