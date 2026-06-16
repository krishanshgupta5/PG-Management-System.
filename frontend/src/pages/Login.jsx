import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(false); // Default to register
  
  // Common fields
  const [identifier, setIdentifier] = useState(''); // Email or Username for login
  const [email, setEmail] = useState(''); // For registration
  const [username, setUsername] = useState(''); // For registration
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('tenant');
  
  // Split name fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Extra fields
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [idProofFile, setIdProofFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // TOS
  const [tosAgreed, setTosAgreed] = useState(false);
  
  const [error, setError] = useState('');
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        // Login
        const user = await login(identifier, password);
        navigate(user.role === 'landlord' ? '/landlord' : '/tenant');
      } else {
        // Register
        if (password.length < 6 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          setError('Password must be at least 6 characters long and contain at least 1 number and 1 special character.');
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        if (role === 'landlord' && !/^\d{10}$/.test(phone)) {
          setError('Phone number must be exactly 10 digits.');
          return;
        }

        if (!tosAgreed) {
          setError('You must agree to the Terms of Service to register.');
          return;
        }
        
        const formData = new FormData();
        formData.append('firstName', firstName);
        if (middleName) formData.append('middleName', middleName);
        formData.append('lastName', lastName);
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        
        if (role === 'landlord') {
          formData.append('phone', phone);
          formData.append('age', age);
          formData.append('gender', gender);
        }
        
        if (role === 'tenant') {
          formData.append('age', age);
          formData.append('gender', gender);
          if (idProofFile) {
            formData.append('idProof', idProofFile);
          } else {
            setError('Please upload an ID Proof document.');
            return;
          }
        }
        
        // Pass formData to the register function
        const user = await register(formData);
        navigate(user.role === 'landlord' ? '/landlord' : '/tenant');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', padding: '40px 0' }}>
      <div className="glass-panel fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '28px' }} className="gradient-text">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {isLogin ? (
            // Login Fields
            <>
              <input 
                type="text" 
                placeholder="Email or Username" 
                className="input-field" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </>
          ) : (
            // Registration Fields
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="First Name" 
                  className="input-field" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Middle (Optional)" 
                  className="input-field" 
                  value={middleName} 
                  onChange={(e) => setMiddleName(e.target.value)} 
                />
              </div>
              <input 
                type="text" 
                placeholder="Last Name" 
                className="input-field" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Username" 
                className="input-field" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Confirm Password" 
                className="input-field" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              
              <select 
                className="input-field" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="tenant">I am a Tenant</option>
                <option value="landlord">I am a Landlord</option>
              </select>

              {role === 'landlord' && (
                <>
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="input-field" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Age" 
                    className="input-field" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)} 
                    required 
                  />
                  <select 
                    className="input-field" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </>
              )}

              {role === 'tenant' && (
                <>
                  <input 
                    type="number" 
                    placeholder="Age" 
                    className="input-field" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)} 
                    required 
                  />
                  <select 
                    className="input-field" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>ID Proof (Image/PDF)</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      className="input-field" 
                      ref={fileInputRef}
                      onChange={(e) => setIdProofFile(e.target.files[0])} 
                      required 
                      style={{ padding: '8px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  id="tos" 
                  checked={tosAgreed} 
                  onChange={(e) => setTosAgreed(e.target.checked)} 
                  required
                />
                <label htmlFor="tos">I agree to the Terms of Service</label>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Register' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
