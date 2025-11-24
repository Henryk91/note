import React, { useState } from 'react';
import { loginRequest, createAccount } from '../../Helpers/requests';

type LoginProps = {
  Theme: string;
};

const Login: React.FC<LoginProps> = ({ Theme }) => {
  const [signUp, setSignUp] = useState(false);
  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeHover = `${Theme.toLowerCase()}-hover`;

  const saveLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = (form.password as HTMLInputElement).value.trim();
    const email = (form.email as HTMLInputElement).value.trim();

    const user = { email, password };
    loginRequest(user, (res) => {
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

  const createAccountHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = (form.password as HTMLInputElement).value.trim();
    const password2 = (form.password2 as HTMLInputElement).value.trim();

    if (password !== password2) {
      alert("Passwords don't match");
      return;
    }

    const firstName = (form.firstName as HTMLInputElement).value.trim();
    const lastName = (form.lastName as HTMLInputElement).value.trim();
    const email = (form.email as HTMLInputElement).value.trim();

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
  };

  return (
    <div>
      {signUp ? (
        <div>
          <form onSubmit={createAccountHandler}>
            <br />
            <input className={themeBack} name="firstName" type="text" placeholder="First Name" required />
            <br />
            <input className={themeBack} name="lastName" type="text" placeholder="Last Name" required />
            <br />
            <input className={themeBack} name="email" type="email" placeholder="Email" required />
            <br />
            <input className={themeBack} name="password" type="password" placeholder="Password" required />
            <br />
            <input className={themeBack} name="password2" type="password" placeholder="Password" required />
            <br />
            <button className={`${themeBack} ${themeHover}`} type="submit">
              Submit
            </button>
          </form>
          <br />
          <button className={`${themeBack} ${themeHover}`} onClick={() => setSignUp(false)}>
            {' '}
            Login{' '}
          </button>
        </div>
      ) : (
        <div>
          <form onSubmit={saveLogin}>
            <br />
            <input
              className={themeBack}
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="username"
            />
            <br />
            <input
              className={themeBack}
              name="password"
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
            <br />
            <button className={`${themeBack} ${themeHover}`} type="submit">
              Submit
            </button>
          </form>
          <br />
          <button className={`${themeBack} ${themeHover}`} onClick={() => setSignUp(true)}>
            {' '}
            Sign Up{' '}
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
