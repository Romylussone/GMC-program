import React, { Component } from 'react';

/**
 * Counter has no incoming props, so its props type is an empty object.
 */
interface CounterProps {}

/**
 * Describes the internal data managed by the Counter component.
 */
interface CounterState {
  count: number;
}

/**
 * Displays a number and increments it when the user clicks the button.
 *
 * Component<CounterProps, CounterState> gives TypeScript the shape of both
 * the component's props and state, including the numeric count value.
 */
class Counter extends Component<CounterProps, CounterState> {
  state: CounterState = {
    count: 0,
  };

  /**
   * Uses the previous state to safely calculate the next count value.
   */
  increment = (): void => {
    this.setState((previousState) => ({
      count: previousState.count + 1,
    }));
  };

  render(): React.ReactNode {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button type="button" onClick={this.increment}>
          Increment
        </button>
      </div>
    );
  }
}

export default Counter;
