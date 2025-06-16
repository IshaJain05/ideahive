import { storage, db, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from "./logActivity";

export const uploadFile = async (file, projectId) => {
  if (!file) return null;

  const user = auth.currentUser;
  const fileRef = ref(storage, `project_files/${projectId}/${file.name}`);
  await logActivity("Uploaded a file", projectId, `File: ${file.name}`);

  // Upload to Storage
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);

  // Save metadata to Firestore
  await addDoc(collection(db, "files"), {
    projectId,
    name: file.name,
    url: downloadURL,
    uploadedBy: user.uid,
    uploadedByEmail: user.email,
    timestamp: serverTimestamp(),
  });

  return downloadURL;
};
