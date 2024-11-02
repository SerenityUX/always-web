import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://serenidad.click/hacktime/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      router.push('/');
      
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
      <form onSubmit={handleSubmit} style={{
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
          Login
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
                display: "flex",
                border: '1px solid #D0D7DE',
                borderRadius: '8px',
                fontWeight: '400'
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
            }}>Password</label>
            <input 
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              style={{
                padding: '8px',
                display: "flex",
                border: '1px solid #D0D7DE',
                borderRadius: '8px'
              }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                color: 'gray',
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>

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
            {isLoading ? "Loading..." : "Login"}
          </button>

          <div style={{
            textAlign: 'center',
            marginBottom: 0,
            marginTop: '16px'
          }}>
            <span style={{
              color: 'gray'
            }}>
              Don't have an account?{' '}
              <a 
                onClick={() => router.push('/signup')}
                style={{
                  color: 'blue',
                  background: 'none',
                  border: 'none',
                  display: "inline",
                  cursor: "pointer"
                }}
              >
                Sign Up
              </a>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
} 