import Head from "next/head";
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

  // Add new state for email validation
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Add email validation function
  const checkEmailExists = async (email) => {
    setIsCheckingEmail(true);
    try {
      const response = await fetch(`https://serenidad.click/hacktime/checkUser/${email}`);
      const data = await response.json();
      setIsEmailValid(!data.exists);
      if (data.exists) {
        setError('An account with this email already exists');
      }
    } catch (err) {
      console.error('Email check failed:', err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');

    // Check email after user stops typing
    if (name === 'email') {
      const timeoutId = setTimeout(() => {
        if (value && value.includes('@')) {
          checkEmailExists(value);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEmailValid) {
      setError('Please use a different email address');
      return;
    }
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://serenidad.click/hacktime/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organization: 'Hack Club'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store token and redirect
      localStorage.setItem('token', data.token);
      router.push('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the return statement to include form handling and error display
  return (
    <>
          <Head>
        <title>Always</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
<meta name="description" content=""/>

<meta property="og:url" content="https://always.sh/"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content=""/>
<meta property="og:description" content=""/>
<meta property="og:image" content="https://opengraph.b-cdn.net/production/images/94a544e7-a5ba-4c45-98ca-49e926ce44b6.png?token=q8wbxEubxdaLUYDUCG6h2ZPJKc88QHFV2p8MTq5rg18&height=596&width=1200&expires=33267021068"/>

<meta name="twitter:card" content="summary_large_image"/>
<meta property="twitter:domain" content="always.sh"/>
<meta property="twitter:url" content="https://always.sh/"/>
<meta name="twitter:title" content=""/>
<meta name="twitter:description" content=""/>
<meta name="twitter:image" content="https://opengraph.b-cdn.net/production/images/94a544e7-a5ba-4c45-98ca-49e926ce44b6.png?token=q8wbxEubxdaLUYDUCG6h2ZPJKc88QHFV2p8MTq5rg18&height=596&width=1200&expires=33267021068"/>
      </Head>
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
          <span><i style={{fontSize: 16, opacity: 0.5}}>Hello there Hack Clubber...</i></span><br/>
          Welcome to Always
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
                border: `1px solid ${!isEmailValid ? '#ff0000' : '#D0D7DE'}`,
                borderRadius: '8px',
                fontWeight: '400'
              }}
            />
            {/* {isCheckingEmail && (
              <p style={{ color: 'gray', margin: '4px 0 0', fontSize: '14px' }}>
                Checking email...
              </p>
            )} */}
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
    </>
  );
} 