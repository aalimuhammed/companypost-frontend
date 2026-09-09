import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {API_BASE_URL} from '../config/api';

 interface ForgotPasswordDTO {
  email: string;
}

const ENDPOINT={
    ForgotPassword: `${API_BASE_URL}/SysUsers/forgotpassword`
  }

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

 const forgotPassword = async (
  dto: ForgotPasswordDTO
): Promise<boolean> => {
  const response = await fetch(ENDPOINT.ForgotPassword, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();

  return data.success;
};

    setLoading(true);

    try {
      await forgotPassword({ email});
      setSuccess(
        'If that email exists in our system, you should receive a password reset link shortly. Please check your inbox and spam folder.'
      );

      setTimeout(() => navigate("/login"), 4500);
    } catch (err: any) {
      setError(err.message || 'Unable to send password reset email.');
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
        <button
          className="nav-btn active"
          aria-label="Forgot password page"
        >
          Forgot Password
        </button>
      </div>

      <div className="screen active">
        <div className="login-container">
          <div className="login-left">
            <img src= "" alt="CopmanyPost System Illustration" className="login-image" />
            <h1>CopmanyPost  System</h1>
            <p>Enter your email address and we’ll send you a link to reset your password.</p>
          </div>

          <div className="login-right">
            <form className="login-form" onSubmit={handleSubmit}>
              <h2>Reset Password</h2>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="you@siac.com"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!success || loading}
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

              <button className="login-btn" type="submit" disabled={!!success || loading}>
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
