import React from "react";
import './Navbar.css';
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="nav">
      <h2 className="logo">Logo Icon Here</h2>
      <ul className="links">
        <li><Link to="/" className="link">Home</Link></li>
        <li><Link to="/about" className="link">About</Link></li>
        <li><Link to="/contact" className="link">Contact</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
