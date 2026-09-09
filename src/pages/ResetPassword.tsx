import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import holdingImage from '../assets/hero.png';
import {API_BASE_URL} from '../config/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const ENDPOINT = {
  ResetPassword: `${API_BASE_URL}/SysUsers/resetpassword`
  }

 interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const validatePassword = () => {
    if (newPassword.length < 6) return 'Password must be at least 6 characters.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    return '';
  };


 const resetPassword = async (dto: ResetPasswordDTO): Promise<boolean> => {
  const response = await fetch(ENDPOINT.ResetPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    let errMsg = 'Failed to reset password';
    try {
      const err = await response.json();
      if (err && err.message) errMsg = err.message;
    } catch {
    }
    throw new Error(errMsg);
  }

  const result = await response.json();
  return result as boolean;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, newPassword });
      setSuccess('Your password has been updated. You can now sign in with your new password.');

      // Redirect back to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 4500);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mockup-container">
      <div className="mockup-nav" role="navigation" aria-label="Main navigation">
        <button className="nav-btn" onClick={() => navigate('/login')} aria-label="Go to login page">
          Login
        </button>
        <button className="nav-btn active" aria-label="Reset password page">
          Reset Password
        </button>
      </div>

      <div className="screen active">
        <div className="login-container">
          <div className="login-left">
            <img src={holdingImage} alt="CopmanyPost System Illustration" className="login-image" />
            <h1>CopmanyPost System</h1>
            <p>Enter a new password for your account.</p>
          </div>

          <div className="login-right">
            <form className="login-form" onSubmit={handleSubmit}>
              <h2>Reset Password</h2>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  placeholder="New password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!!success || loading || !!error && !token}
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  placeholder="Confirm password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!!success || loading || !!error && !token}
                />
              </div>

              {success && (
                <div className="form-success" role="status">
                  {success}
                </div>
              )}

              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-note">
                <span>Having trouble? </span>
                <Link to="/forgot-password" className="text-link">
                  Request a new reset link.
                </Link>
              </div>

              <button className="login-btn" type="submit" disabled={!!success || loading || (!!error && !token)}>
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              {/* <button
                type="button"
                className="login-btn secondary"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button> */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
