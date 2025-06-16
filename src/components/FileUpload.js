import React, { useState, useEffect } from "react";
import axios from "axios";

const CLOUD_NAME = "dqnj9veqm";
const UPLOAD_PRESET = "ideahive_unsigned";

const FileUpload = ({ projectId }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(`cloudinary_files_${projectId}`);
    if (stored) setUploadedFiles(JSON.parse(stored));
  }, [projectId]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("⏳ Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        formData
      );
      const uploadedFile = res.data;

      const updated = [...uploadedFiles, uploadedFile];
      localStorage.setItem(`cloudinary_files_${projectId}`, JSON.stringify(updated));
      setUploadedFiles(updated);
      setStatus("✅ Upload successful!");
    } catch (err) {
      console.error("Cloudinary upload error:", err.response?.data || err.message);
      setStatus("❌ Upload failed. Check preset, folder or CORS settings.");
    } finally {
      setFile(null);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Upload File</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={!file} style={{ marginLeft: "1rem" }}>
        Upload
      </button>
      {status && <p>{status}</p>}

      <div style={{ marginTop: "1rem" }}>
        <h4>Uploaded Files</h4>
        {uploadedFiles.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {uploadedFiles.map((f, idx) => (
              <li key={idx} style={{ marginBottom: "10px" }}>
                {f.resource_type === "image" ? (
                  <img
                    src={f.secure_url}
                    alt={f.original_filename}
                    style={{ maxWidth: "200px", borderRadius: "6px" }}
                  />
                ) : (
                  <a href={f.secure_url} target="_blank" rel="noopener noreferrer">
                    {f.original_filename}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
