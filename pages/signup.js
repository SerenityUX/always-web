import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const { name: urlName, email: urlEmail } = router.query;
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Update form state to use URL parameters if available
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Add useEffect to update form when URL parameters are available
  useEffect(() => {
    if (urlName || urlEmail) {
      setFormData(prev => ({
        ...prev,
        name: urlName || '',
        email: urlEmail || ''
      }));
    }
  }, [urlName, urlEmail]);

  const [error, setError] = useState('');

  // Add loading state near the top with other state declarations
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true); // Set loading state
    try {
      const response = await fetch('https://serenidad.click/hacktime/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
    //   if (!response.ok) {
    //     throw new Error(data.error || 'Signup failed');
    //   }

      // Store token and redirect
      localStorage.setItem('token', data.token);
      router.push('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Update the return statement to include form handling and error display
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
          Create Account
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
          {/* Update input fields to include name and onChange handler */}
          <div style={{
            display: 'flex',
            flexDirection: 'column'
          }}>
            <label style={{
              color: 'gray',
              marginBottom: '8px'
            }}>Name</label>
            <input 
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              style={{
                padding: '8px',
                display: "flex",
                border: '1px solid #D0D7DE',
                borderRadius: '8px',
                fontWeight: '400'
              }}
            />
          </div>

          {/* Update remaining input fields similarly... */}
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

          {/* Password fields... */}
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
            <p 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                color: 'gray',
                background: 'none',
                border: 'none',
                padding: '4px 0',
                cursor: "pointer",
                fontSize: '14px',
                textAlign: 'left', margin: 0
              }}
            >
              {showPassword ? "Hide password" : "Show password"}
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column'
          }}>
            <label style={{
              color: 'gray',
              marginBottom: '8px'
            }}>Confirm Password</label>
            <input 
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              style={{
                padding: '8px',
                display: "flex",
                border: '1px solid #D0D7DE',
                borderRadius: '8px'
              }}
            />
            <p 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                color: 'gray',
                background: 'none',
                border: 'none',
                padding: '4px 0',
                cursor: "pointer",
                fontSize: '14px',
                textAlign: 'left', 
                margin: 0
              }}
            >
              {showConfirmPassword ? "Hide password" : "Show password"}
            </p>
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
            {isLoading ? "Loading..." : "Sign Up"}
          </button>

          <div style={{
            textAlign: 'center',
            marginBottom: 0,
            marginTop: '16px'
          }}>
            <span style={{
              color: 'gray'
            }}>
              Already have an account?{' '}
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