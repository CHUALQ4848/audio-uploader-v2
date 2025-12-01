import React from "react";
import { Outlet, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
} from "@mui/material";
import {
  CloudUpload,
  AudioFile,
  AccountCircle,
  Logout,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <AudioFile sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Audio Uploader
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<AudioFile />}
          >
            My Audio
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/upload"
            startIcon={<CloudUpload />}
          >
            Upload
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/account"
            startIcon={<AccountCircle />}
          >
            Account
          </Button>
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
