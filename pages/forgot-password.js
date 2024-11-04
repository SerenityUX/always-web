import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://serenidad.click/hacktime/forgotPasswordRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      setStep(2);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.token || !formData.newPassword) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://serenidad.click/hacktime/changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          oneTimeCode: formData.token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      router.push('/login');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F6F8FA'
    }}>
      <form onSubmit={step === 1 ? handleSubmitEmail : handleResetPassword} style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        border: '1px solid #D0D7DE',
        width: '500px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginTop: 0,
          marginBottom: '16px'
        }}>
          Reset Password
        </h1>

        {error && (
          <div style={{
            color: 'red',
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#ffebee',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {step === 1 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <label style={{
                color: 'gray',
                marginBottom: '8px'
              }}>Email</label>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={{
                  padding: '8px',
                  border: '1px solid #D0D7DE',
                  borderRadius: '8px',
                  fontWeight: '400'
                }}
              />
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                <label style={{
                  color: 'gray',
                  marginBottom: '8px'
                }}>Reset Code</label>
                <input 
                  name="token"
                  type="text"
                  value={formData.token}
                  onChange={handleChange}
                  placeholder="Enter the code from your email"
                  style={{
                    padding: '8px',
                    border: '1px solid #D0D7DE',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                <label style={{
                  color: 'gray',
                  marginBottom: '8px'
                }}>New Password</label>
                <input 
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  style={{
                    padding: '8px',
                    border: '1px solid #D0D7DE',
                    borderRadius: '8px'
                  }}
                />
                <p 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    color: 'gray',
                    background: 'none',
                    border: 'none',
                    padding: '4px 0',
                    cursor: "pointer",
                    fontSize: '14px',
                    textAlign: 'left',
                    margin: '4px 0 0 0'
                  }}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </p>
              </div>
            </>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#666' : 'black',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading ? 'default' : 'pointer'
            }}
          >
            {isLoading ? "Loading..." : (step === 1 ? "Send Reset Code" : "Reset Password")}
          </button>

          <div style={{
            textAlign: 'center',
            marginBottom: 0,
            marginTop: '16px'
          }}>
            <span style={{
              color: 'gray'
            }}>
              Remember your password?{' '}
              <a 
                onClick={() => router.push('/login')}
                style={{
                  color: 'blue',
                  background: 'none',
                  border: 'none',
                  display: "inline",
                  cursor: "pointer"
                }}
              >
                Login
              </a>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
} 