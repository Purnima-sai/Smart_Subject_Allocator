import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Link,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  School as SchoolIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
  userType: Yup.string().required('Please select a user type'),
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 500,
  margin: '0 auto',
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledForm = styled(Form)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(3),
}));

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsLoading(true);
      setError('');
      // Call backend for authentication
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.username,
          password: values.password
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid credentials');
      }
      const data = await res.json();
      // Check role matches
      if (data.user.role !== values.userType && !(data.user.role === 'admin' && values.userType === 'administrator')) {
        throw new Error('Role mismatch. Please select the correct role.');
      }
      console.log('Login successful, token received:', data.token ? data.token.substring(0, 20) + '...' : 'NO TOKEN');
      // Store JWT and user info FIRST before calling context login
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Mark authenticated in context (pass token to ensure it's not overwritten)
      await login({ username: data.user.email, role: data.user.role, token: data.token });
      // Navigate based on user type
      switch(data.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'faculty':
          navigate('/faculty/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          throw new Error('Invalid user type');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StyledPaper>
          <SchoolIcon
            sx={{
              fontSize: 50,
              color: 'primary.main',
              mb: 1,
              bgcolor: 'rgba(25, 118, 210, 0.1)',
              borderRadius: '50%',
              p: 1,
            }}
          />
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome Back!
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to access your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={{
              username: '',
              password: '',
              userType: 'student',
              rememberMe: false,
            }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, handleChange, handleBlur }) => (
              <StyledForm>
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="userType"
                  label="I am a"
                  name="userType"
                  select
                  SelectProps={{ native: true }}
                  variant="outlined"
                  value={values.userType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.userType && Boolean(errors.userType)}
                  helperText={touched.userType && errors.userType}
                  sx={{ mb: 2 }}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </Field>

                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username or Email"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  variant="outlined"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  variant="outlined"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="rememberMe"
                        color="primary"
                        checked={values.rememberMe}
                        onChange={handleChange}
                      />
                    }
                    label="Remember me"
                  />
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{ textDecoration: 'none' }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/signup"
                      variant="body2"
                      sx={{ fontWeight: 500, textDecoration: 'none' }}
                    >
                      Sign up
                    </Link>
                  </Typography>
                </Box>
              </StyledForm>
            )}
          </Formik>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default Login;
