import React, { useEffect, useState } from "react";

const FileList = ({ projectId }) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(`cloudinary_files_${projectId}`);
    if (saved) setFiles(JSON.parse(saved));
  }, [projectId]);

  const handleDelete = (publicId) => {
    const updated = files.filter((file) => file.public_id !== publicId);
    setFiles(updated);
    localStorage.setItem(`cloudinary_files_${projectId}`, JSON.stringify(updated));
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Uploaded Files</h3>
      {files.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file) => (
            <li key={file.public_id} style={{ marginBottom: "1rem" }}>
              {file.resource_type === "image" ? (
                <img
                  src={file.secure_url}
                  alt={file.original_filename}
                  style={{ width: "120px", height: "auto", borderRadius: "6px", marginRight: "1rem" }}
                />
              ) : (
                <a href={file.secure_url} target="_blank" rel="noopener noreferrer">
                  {file.original_filename}
                </a>
              )}
              <button onClick={() => handleDelete(file.public_id)} style={{ marginLeft: "1rem" }}>
                ❌ Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileList;
