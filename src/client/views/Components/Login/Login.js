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
    this.loginState = this.loginState.bind(this)
  }
  saveLogin = type => {
    event.preventDefault();
    let password = event.target.password.value;
    let email = event.target.email.value;

    let user = {
      email: email,
      password: password
    };
    loginRequest(user, res => {
      if (res.id) {
        localStorage.setItem('loginKey', res.id);
        window.location.reload();
      } else {
        console.log(res);
      }
    });
  };

  createAccount = event => {
    event.preventDefault();

    let password = event.target.password.value;
    let password2 = event.target.password2.value;

    if (password === password2) {
      let firstName = event.target.firstName.value;
      let lastName = event.target.lastName.value;
      let email = event.target.email.value;

      let user = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password,
        tempPass: '',
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

  loginState(bVal){
    this.setState({ signUp: bVal })
  }

  render() {
    let signUp = this.state.signUp;
    return (
      <div>
        {signUp ? (
          <div>
            <form onSubmit={this.createAccount}>
              <br />
              <input className="red-back" name="firstName" type="text" placeholder="First Name" required="required" />
              <br />
              <input className="red-back" name="lastName" type="text" placeholder="Last Name" required="required" />
              <br />
              <input className="red-back" name="email" type="email" placeholder="Email" required="required" />
              <br />
              <input className="red-back" name="password" type="password" placeholder="Password" required="required" />
              <br />
              <input className="red-back" name="password2" type="password" placeholder="Password" required="required" />
              <br />
              <button className="red-back" type="submit">Submit</button>
            </form>
            <br />
            <button className="red-back" onClick={() => this.loginState(false)}> Login </button>
          </div>
        ) : (
          <div>
            <form onSubmit={this.saveLogin}>
              <br />
              <input className="red-back" name="email" type="email" placeholder="Email" required="required" />
              <br />
              <input className="red-back" name="password" type="password" placeholder="Password" required="required" />
              <br />
              <button className="red-back" type="submit">Submit</button>
            </form>
            <br />
            <button className="red-back" onClick={() => this.loginState(true) }> Sign Up </button>
          </div>
        )}
      </div>
    );
  }
}
