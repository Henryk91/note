import React, { Component } from 'react';
import { loginRequest, createAccount } from '../../Helpers/requests';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      signUp: false,
    };
    this.saveLogin = this.saveLogin.bind(this);
    this.createAccount = this.createAccount.bind(this);
    this.loginState = this.loginState.bind(this);
  }

  saveLogin = (event) => {
    event.preventDefault();
    let password = event.target.password.value;
    let email = event.target.email.value;
    if (password && email) {
      password = password.trim();
      email = email.trim();
    }
    const user = {
      email,
      password,
    };
    console.log('Trying to log in!');

    loginRequest(user, (res) => {
      console.log('Login res', res);

      if (res?.id) {
        localStorage.setItem('loginKey', res.id);
        window.location.href = '/notes/main';
      } else if (res?.user?.id) {
        localStorage.setItem('loginKey', res?.user?.id);
        window.location.href = '/notes/main';
      } else {
        alert('Login Error');
        console.log(res);
      }
    });
  };

  createAccount = (event) => {
    event.preventDefault();

    let password = event.target.password.value;
    const password2 = event.target.password2.value;

    if (password === password2) {
      let firstName = event.target.firstName.value;
      let lastName = event.target.lastName.value;
      let email = event.target.email.value;

      if (password) password = password.trim();
      if (email) email = email.trim();
      if (firstName) firstName = firstName.trim();
      if (lastName) lastName = lastName.trim();

      const user = {
        email,
        firstName,
        lastName,
        password,
        tempPass: [''],
        permId: '',
      };
      createAccount(user, (res) => {
        if (res.id) {
          localStorage.setItem('loginKey', res.id);
          window.location.reload();
        } else {
          console.log(res);
        }
      });
    } else {
      alert("Passwords don't match");
    }
  };

  loginState(bVal) {
    this.setState({ signUp: bVal });
  }

  render() {
    const { signUp } = this.state;
    const { Theme } = this.props;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    return (
      <div>
        {signUp ? (
          <div>
            <form onSubmit={this.createAccount}>
              <br />
              <input
                className={themeBack}
                name="firstName"
                type="text"
                placeholder="First Name"
                required="required"
              />
              <br />
              <input
                className={themeBack}
                name="lastName"
                type="text"
                placeholder="Last Name"
                required="required"
              />
              <br />
              <input
                className={themeBack}
                name="email"
                type="email"
                placeholder="Email"
                required="required"
              />
              <br />
              <input
                className={themeBack}
                name="password"
                type="password"
                placeholder="Password"
                required="required"
              />
              <br />
              <input
                className={themeBack}
                name="password2"
                type="password"
                placeholder="Password"
                required="required"
              />
              <br />
              <button className={`${themeBack} ${themeHover}`} type="submit">
                Submit
              </button>
            </form>
            <br />
            <button
              className={`${themeBack} ${themeHover}`}
              onClick={() => this.loginState(false)}
            >
              {' '}
              Login{' '}
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={(e) => this.saveLogin(e)}>
              <br />
              <input
                className={themeBack}
                name="email"
                type="email"
                placeholder="Email"
                required="required"
                autoComplete="username"
              />
              <br />
              <input
                className={themeBack}
                name="password"
                type="password"
                placeholder="Password"
                required="required"
                autoComplete="current-password"
              />
              <br />
              <button className={`${themeBack} ${themeHover}`} type="submit">
                Submit
              </button>
            </form>
            <br />
            <button
              className={`${themeBack} ${themeHover}`}
              onClick={() => this.loginState(true)}
            >
              {' '}
              Sign Up{' '}
            </button>
          </div>
        )}
      </div>
    );
  }
}
