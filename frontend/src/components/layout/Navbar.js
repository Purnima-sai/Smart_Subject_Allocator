import React, { useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  useTheme,
  Box,
  Container,
  // Avatar, // removed unused import
  Tooltip,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Home as HomeIcon,
  Info as InfoIcon,
  Star as StarIcon,
  ContactMail as ContactMailIcon,
  Login as LoginIcon,
  // PersonAdd as PersonAddIcon, // removed unused import
  School as SchoolIcon,
} from '@mui/icons-material';
import ColorModeContext from '../../context/ColorModeContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const theme = useTheme();
  const { logout } = useAuth();
  const colorMode = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isLoggedIn = localStorage.getItem('token');

  const handleLogout = () => {
    // Use central auth context logout to clear all state
    logout();
    // Also remove any user object for safety
    localStorage.removeItem('user');
    // Navigate to login
    navigate('/login');
  };

  let navItems = [];
  const userType = localStorage.getItem('userType');
  if (isLoggedIn) {
    // Show Dashboard for logged-in users
    let dashboardPath = '/';
    if (userType === 'student') dashboardPath = '/student/dashboard';
    else if (userType === 'faculty') dashboardPath = '/faculty/dashboard';
    else if (userType === 'admin') dashboardPath = '/admin/dashboard';
    navItems = [
      { text: 'Dashboard', path: dashboardPath, icon: <HomeIcon /> },
    ];
  } else {
    // Show public nav for logged-out users
    navItems = [
      { text: 'Home', path: '/', icon: <HomeIcon /> },
      { text: 'About', path: '/about', icon: <InfoIcon /> },
      { text: 'Features', path: '/features', icon: <StarIcon /> },
      { text: 'Contact', path: '/contact', icon: <ContactMailIcon /> },
      { text: 'Login', path: '/login', icon: <LoginIcon /> },
    ];
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: 250 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          SSAEMS
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{
                '&.active': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.main,
                    fontWeight: '500',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={colorMode.toggleColorMode}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </ListItemIcon>
            <ListItemText primary={`${theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode`} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo/Title */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 2,
            }}
          >
            <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              SSAEMS
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', flexGrow: 1, ml: 4 }}>
              {navItems.slice(0, 4).map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  sx={{
                    my: 2,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    '&.active': {
                      color: 'primary.main',
                      fontWeight: '500',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {item.icon && <Box component="span" sx={{ mr: 0.5 }}>{item.icon}</Box>}
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* Theme Toggle */}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={colorMode.toggleColorMode}
              color="inherit"
              sx={{ color: 'text.primary', mr: 1 }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {/* Auth Buttons - Desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
                {isLoggedIn ? (
                  <Button
                    onClick={handleLogout}
                    variant="contained"
                    color="error"
                    sx={{ ml: 1, boxShadow: 'none', color: 'white' }}
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    sx={{ mx: 1, color: 'text.primary', borderColor: 'text.secondary' }}
                  >
                    Login
                  </Button>
                )}
            </Box>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
