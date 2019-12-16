/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
/* eslint-disable react/button-has-type */
/* eslint-disable no-alert */
import React, { Component } from 'react';
import { loginRequest, createAccount } from '../../Helpers/requests';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      signUp: false
    };
    this.saveLogin = this.saveLogin.bind(this);
    this.createAccount = this.createAccount.bind(this);
    this.loginState = this.loginState.bind(this);
  }

  saveLogin = () => {
    event.preventDefault();
    const password = event.target.password.value;
    const email = event.target.email.value;

    const user = {
      email,
      password
    };
    loginRequest(user, res => {
      if (res.id) {
        localStorage.setItem('loginKey', res.id);
        window.location.reload();
      } else {
        alert('Login Error');
        console.log(res);
      }
    });
  };

  createAccount = event => {
    event.preventDefault();

    const password = event.target.password.value;
    const password2 = event.target.password2.value;

    if (password === password2) {
      const firstName = event.target.firstName.value;
      const lastName = event.target.lastName.value;
      const email = event.target.email.value;

      const user = {
        email,
        firstName,
        lastName,
        password,
        tempPass: [''],
        permId: ''
      };
      createAccount(user, res => {
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
    return (
      <div>
        {signUp ? (
          <div>
            <form onSubmit={this.createAccount}>
              <br />
              <input className={themeBack} name="firstName" type="text" placeholder="First Name" required="required" />
              <br />
              <input className={themeBack} name="lastName" type="text" placeholder="Last Name" required="required" />
              <br />
              <input className={themeBack} name="email" type="email" placeholder="Email" required="required" />
              <br />
              <input className={themeBack} name="password" type="password" placeholder="Password" required="required" />
              <br />
              <input className={themeBack} name="password2" type="password" placeholder="Password" required="required" />
              <br />
              <button className={themeBack} type="submit">
                Submit
              </button>
            </form>
            <br />
            <button className={themeBack} onClick={() => this.loginState(false)}>
              {' '}
              Login{' '}
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={this.saveLogin}>
              <br />
              <input className={themeBack} name="email" type="email" placeholder="Email" required="required" />
              <br />
              <input className={themeBack} name="password" type="password" placeholder="Password" required="required" />
              <br />
              <button className={themeBack} type="submit">
                Submit
              </button>
            </form>
            <br />
            <button className={themeBack} onClick={() => this.loginState(true)}>
              {' '}
              Sign Up{' '}
            </button>
          </div>
        )}
      </div>
    );
  }
}
