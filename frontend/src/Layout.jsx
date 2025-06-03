// src/Layout.jsx
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    CssBaseline,
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Stack
} from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

const brandColor = '#3182f6';
const navItems = [
    { label: '대시보드', path: '/' },
    { label: '카메라', path: '/cameras' },
    { label: '이력', path: '/history' },
    { label: '녹화영상', path: '/recordings' },
    { label: '설정', path: '/settings' }
];

const tossTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: brandColor },
        background: { default: '#f9fafb', paper: '#fff' },
        text: { primary: '#222', secondary: '#666' },
    },
    typography: {
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        h4: { fontWeight: 700 },
        h6: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 18,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 18,
                    boxShadow: '0 2px 16px 0 rgba(49,130,246,0.06)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 18,
                    boxShadow: '0 2px 16px 0 rgba(49,130,246,0.08)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
    },
});

function Layout() {
    const location = useLocation();
    return (
        <ThemeProvider theme={tossTheme}>
            <CssBaseline />
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e5e8eb', bgcolor: '#fff' }}>
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
                    <Typography variant="h6" sx={{ color: brandColor, fontWeight: 800, letterSpacing: 1 }}>
                        CCTV Monitor
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                component={Link}
                                to={item.path}
                                color={location.pathname === item.path ? 'primary' : 'inherit'}
                                sx={{
                                    fontWeight: location.pathname === item.path ? 700 : 500,
                                    bgcolor: location.pathname === item.path ? '#e8f1fd' : 'transparent',
                                    color: location.pathname === item.path ? brandColor : '#222',
                                    '&:hover': {
                                        bgcolor: '#e8f1fd',
                                        color: brandColor,
                                    },
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    fontSize: 16,
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Stack>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Outlet />
            </Container>
        </ThemeProvider>
    );
}

export default Layout;
