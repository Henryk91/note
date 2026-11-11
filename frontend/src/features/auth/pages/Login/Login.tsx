import React, { useState } from 'react';
import { IconEye, IconEyeOff, IconNotes } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { loginRequest, createAccount } from '../../../../shared/utils/Helpers/requests';
import { setAuthToken } from '../../store/personSlice';
import './login.css';

/**
 * Login and sign up (docs/mockups/menu-login.html 2 and 4): app icon, "Notes", labelled 40 px fields, a full-width
 * button and the error under the fields. Phone: centred on the page; desktop: a 360 px card centred on the page.
 */
const field = (form: HTMLFormElement, name: string) => ((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '').trim();

/** Password input with a show / hide eye button inside the field. */
const PasswordInput: React.FC<{ name: string; autoComplete: string }> = ({ name, autoComplete }) => {
  const [shown, setShown] = useState(false);
  return (
    <span className="login-pw">
      <input className="login-in" name={name} type={shown ? 'text' : 'password'} required autoComplete={autoComplete} />
      <button
        type="button"
        className="login-eye"
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </span>
  );
};

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const [signUp, setSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = field(form, 'password');
    const email = field(form, 'email');
    setBusy(true);
    setError(null);
    loginRequest({ email, password }, (res) => {
      setBusy(false);
      const id = res?.id ?? res?.user?.id;
      if (id) {
        dispatch(setAuthToken(id));
        window.location.href = '/notes/main';
      } else {
        setError("That email and password don't match.");
      }
    });
  };

  const createAccountHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = field(form, 'password');
    const password2 = field(form, 'password2');
    if (password !== password2) {
      setError("Passwords don't match.");
      return;
    }
    const user = {
      email: field(form, 'email'),
      firstName: field(form, 'firstName'),
      lastName: field(form, 'lastName'),
      password,
      tempPass: [''],
      permId: '',
    };
    setBusy(true);
    setError(null);
    createAccount(user, (res) => {
      setBusy(false);
      if (res?.id) {
        dispatch(setAuthToken(res.id));
        window.location.reload();
      } else {
        setError(res?.error || res?.message || 'Could not create the account.');
      }
    });
  };

  const switchMode = () => {
    setSignUp((v) => !v);
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon">
            <IconNotes size={28} />
          </div>
          <div className="login-title">Notes</div>
          <div className="login-sub">{signUp ? 'Create your account' : 'Log in to your notebooks'}</div>
        </div>
        {signUp ? (
          <form onSubmit={createAccountHandler} noValidate={false}>
            <label className="login-fld">
              First name
              <input className="login-in" name="firstName" type="text" required autoComplete="given-name" />
            </label>
            <label className="login-fld">
              Last name
              <input className="login-in" name="lastName" type="text" required autoComplete="family-name" />
            </label>
            <label className="login-fld">
              Email
              <input className="login-in" name="email" type="email" required autoComplete="username" />
            </label>
            <label className="login-fld">
              Password
              <PasswordInput name="password" autoComplete="new-password" />
            </label>
            <label className="login-fld">
              Repeat password
              <PasswordInput name="password2" autoComplete="new-password" />
            </label>
            {error && (
              <div className="login-err" role="alert">
                {error}
              </div>
            )}
            <button className="login-pri" type="submit" disabled={busy}>
              Create account
            </button>
          </form>
        ) : (
          <form onSubmit={saveLogin}>
            <label className="login-fld">
              Email
              <input className="login-in" name="email" type="email" required autoComplete="username" />
            </label>
            <label className="login-fld">
              Password
              <PasswordInput name="password" autoComplete="current-password" />
            </label>
            {error && (
              <div className="login-err" role="alert">
                {error}
              </div>
            )}
            <button className="login-pri" type="submit" disabled={busy}>
              Log in
            </button>
          </form>
        )}
        <div className="login-alt">
          {signUp ? 'Have an account? ' : 'No account? '}
          <button className="login-lk" type="button" onClick={switchMode}>
            {signUp ? 'Log in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
