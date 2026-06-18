import { useContext, useState } from 'react';
import { Store } from '../App';
import './NavBar.css';

function NavBar() {

  const {isEnglish, setIsEnglish} = useContext(Store);

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">MyApp</div>
      <div className="navbar-links">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <button className="lang-toggle" onClick={toggleLanguage}>
        {isEnglish ? 'Switch to French' : 'Passer en anglais'}
      </button>
    </nav>
  );
}

export default NavBar;
