import React, { useState } from 'react';
import { loginRequest, createAccount } from '../../../../shared/utils/Helpers/requests';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { toastNotifications } from '../../../../shared/utils/toast';

const Login: React.FC = () => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const [signUp, setSignUp] = useState(false);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

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
        toastNotifications.error('Login failed. Please check your credentials.');
      }
    });
  };

  const createAccountHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = (form.password as HTMLInputElement).value.trim();
    const password2 = (form.password2 as HTMLInputElement).value.trim();

    if (password !== password2) {
      toastNotifications.error("Passwords don't match");
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
