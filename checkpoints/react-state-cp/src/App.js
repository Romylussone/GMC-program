import React, { Component } from "react";
import "./App.css";
import profileImage from "./profile.svg";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      Person: {
        fullName: "Amina Carter",
        bio: "Front-end developer focused on building practical, accessible React interfaces for everyday users.",
        imgSrc: profileImage,
        profession: "React Developer",
      },
      shows: false,
      elapsedTime: 0,
    };

    this.mountedAt = null;
    this.intervalId = null;
    this.toggleProfile = this.toggleProfile.bind(this);
  }

  componentDidMount() {
    this.mountedAt = Date.now();

    this.intervalId = setInterval(() => {
      this.setState({
        elapsedTime: Math.floor((Date.now() - this.mountedAt) / 1000),
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  toggleProfile() {
    this.setState((prevState) => ({
      shows: !prevState.shows,
    }));
  }

  render() {
    const { Person, shows, elapsedTime } = this.state;
    const secondsLabel = elapsedTime === 1 ? "second" : "seconds";

    return (
      <main className="app">
        <section className="profile-layout">
          <div className="profile-copy">
            <p className="eyebrow">React state checkpoint</p>
            <h1>Class Component Profile</h1>
            <p className="intro">
              Toggle the profile card with local state and track how long this
              component has been mounted.
            </p>

            <div className="status-field">
              Mounted for {elapsedTime} {secondsLabel}
            </div>

            <button type="button" onClick={this.toggleProfile}>
              {shows ? "Hide profile" : "Show profile"}
            </button>
          </div>

          {shows && (
            <article className="profile-card">
              <img src={Person.imgSrc} alt={Person.fullName} />
              <div>
                <h2>{Person.fullName}</h2>
                <p className="profession">{Person.profession}</p>
                <p className="bio">{Person.bio}</p>
              </div>
            </article>
          )}
        </section>
      </main>
    );
  }
}

export default App;
