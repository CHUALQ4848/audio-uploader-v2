import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { PlayArrow, Pause, Delete } from "@mui/icons-material";

const CATEGORIES = [
  "Music",
  "Podcast",
  "Audiobook",
  "Sound Effect",
  "Voice Recording",
  "Other",
];

export default function Dashboard() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  useEffect(() => {
    if (category) {
      setFilteredFiles(audioFiles.filter((file) => file.category === category));
    } else {
      setFilteredFiles(audioFiles);
    }
  }, [category, audioFiles]);

  const fetchAudioFiles = async () => {
    try {
      const response = await axios.get("/api/audio");
      setAudioFiles(response.data);
      setFilteredFiles(response.data);
    } catch (err) {
      setError("Failed to fetch audio files");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (id) => {
    try {
      if (playingId === id) {
        audioElement.pause();
        setPlayingId(null);
        return;
      }

      if (audioElement) {
        audioElement.pause();
      }

      const response = await axios.get(`/api/audio/${id}/play`);
      const audio = new Audio(response.data.url);
      audio.play();
      audio.onended = () => setPlayingId(null);
      setAudioElement(audio);
      setPlayingId(id);
    } catch (err) {
      setError("Failed to play audio");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this audio file?"))
      return;

    try {
      await axios.delete(`/api/audio/${id}`);
      setAudioFiles(audioFiles.filter((file) => file.id !== id));
    } catch (err) {
      setError("Failed to delete audio file");
    }
  };

  const formatFileSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">My Audio Files</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={category}
            label="Filter by Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {filteredFiles.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          No audio files found. Upload your first audio file!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredFiles.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {file.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {file.description || "No description"}
                  </Typography>
                  <Chip label={file.category} size="small" sx={{ mr: 1 }} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Size: {formatFileSize(file.fileSize)}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Uploaded: {new Date(file.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    color="primary"
                    onClick={() => handlePlay(file.id)}
                  >
                    {playingId === file.id ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
