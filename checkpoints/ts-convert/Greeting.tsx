import React from 'react';

/**
 * Defines the values the Greeting component accepts from its parent.
 */
interface GreetingProps {
  /** The name displayed in the greeting message. */
  name: string;
}

/**
 * Renders a personalized greeting.
 *
 * TypeScript uses GreetingProps to ensure that callers always provide a
 * string for the required name prop.
 */
const Greeting: React.FC<GreetingProps> = ({ name }) => {
  return <div>Hello, {name}!</div>;
};

export default Greeting;
