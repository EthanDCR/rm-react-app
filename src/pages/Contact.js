import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-page">

      <h1>Contact Us</h1>

      <form>
        <label htmlFor="name">Your Name:</label><br />
        <input type="text" id="name" name="name" placeholder="Enter your name" /><br /><br />

        <label htmlFor="email">Email:</label><br />
        <input type="email" id="email" name="email" placeholder="you@example.com" /><br /><br />

        <label htmlFor="message">Message:</label><br />
        <textarea id="message" name="message" placeholder="Your message..." rows="4"></textarea><br /><br />

        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Contact;
