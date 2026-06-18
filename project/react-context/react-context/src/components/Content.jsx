import React from 'react';
import { Store } from '../App';

const Content = () => {
  const { isEnglish } = React.useContext(Store);

  return (
    <div className="content">
      {isEnglish ? 'Hello, this is text content.' : 'Bonjour, ceci est le contenu du texte.'}
    </div>
  );
};

export default Content;
