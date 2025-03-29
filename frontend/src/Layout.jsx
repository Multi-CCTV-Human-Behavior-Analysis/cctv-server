// src/Layout.jsx
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    CssBaseline,
    Box,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#1976d2' },
    },
});

function Layout() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                {/* 상단 AppBar */}
                <AppBar
                    position="fixed"
                    sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
                >
                    <Toolbar>
                        <Typography variant="h6" noWrap component="div">
                            CCTV Monitoring
                        </Typography>
                    </Toolbar>
                </AppBar>

                {/* 왼쪽 Drawer (사이드바) */}
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    <Toolbar />
                    <List>
                        {/* Dashboard 메뉴 */}
                        <ListItemButton component={Link} to="/">
                            <ListItemIcon><DashboardIcon /></ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>

                        {/* Cameras 메뉴 */}
                        <ListItemButton component={Link} to="/cameras">
                            <ListItemIcon><VideocamIcon /></ListItemIcon>
                            <ListItemText primary="Cameras" />
                        </ListItemButton>

                        {/* History 메뉴 */}
                        <ListItemButton component={Link} to="/history">
                            <ListItemIcon><HistoryIcon /></ListItemIcon>
                            <ListItemText primary="History" />
                        </ListItemButton>

                        {/* Settings 메뉴 */}
                        <ListItemButton component={Link} to="/settings">
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItemButton>
                    </List>
                </Drawer>

                {/* 메인 컨텐츠 영역 */}
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    {/* 하위 라우트 컴포넌트가 표시 자리 */}
                    <Outlet />
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default Layout;
