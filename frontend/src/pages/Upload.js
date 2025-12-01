import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";

const CATEGORIES = [
  "Music",
  "Podcast",
  "Audiobook",
  "Sound Effect",
  "Voice Recording",
  "Other",
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [existingFilesMsg, setExistingFilesMsg] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validAudioTypes = ["audio/mpeg", "audio/mp3", "audio/mp4"];

      if (!validAudioTypes.includes(selectedFile.type)) {
        setError("Invalid file type. Please select a valid audio file.");
        return;
      }

      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError("File size exceeds 50MB limit.");
        return;
      }

      // Check if file with same name already exists
      try {
        const response = await axios.get(
          `/api/audio/check/${selectedFile.name}/${user.id}`
        );

        if (response.data && response.data.audioFile) {
          // File exists - show warning but allow re-upload
          setExistingFilesMsg(
            response.data.message ||
              "A file with this name already exists. Uploading will create a new entry."
          );
        } else {
          // File does not exist - clear any existing messages
          setExistingFilesMsg("");
        }
      } catch (err) {
        // 404 or other error means file doesn't exist - this is fine
        // Don't set error for 404, it just means the file is new
        if (err.response?.status !== 404) {
          console.error("Error checking file:", err);
        }
      }

      setFile(selectedFile);
      setError("");
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !title || !category) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate title length
    if (title.trim().length === 0 || title.length > 200) {
      setError("Title must be between 1 and 200 characters");
      return;
    }

    // Validate description length
    if (description && description.length > 1000) {
      setError("Description must be less than 1000 characters");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);

    try {
      // Upload audio file to backend
      await axios.post("/api/audio/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload audio file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Upload Audio File
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Audio file uploaded successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{ mb: 2, py: 2 }}
          >
            {file ? file.name : "Select Audio File"}
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={handleFileChange}
            />
          </Button>
          {existingFilesMsg && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              onClose={() => setExistingFilesMsg("")}
            >
              {existingFilesMsg}
            </Alert>
          )}
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            inputProps={{ maxLength: 200 }}
            helperText={`${title.length}/200 characters`}
          />

          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            inputProps={{ maxLength: 1000 }}
            helperText={`${description.length}/1000 characters`}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loading && <LinearProgress sx={{ mt: 2 }} />}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading || !file}
          >
            Upload
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
