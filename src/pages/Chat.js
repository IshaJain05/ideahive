import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "../App.css";

const Chat = ({ receiverId, receiverName, onClose }) => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const getChatPairId = (uid1, uid2) => [uid1, uid2].sort().join("_");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !receiverId) return;

    const chatPair = getChatPairId(user.uid, receiverId);
    const chatQuery = query(
      collection(db, "chats"),
      where("chatPair", "==", chatPair),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const updated = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(updated);

      updated.forEach((msg) => {
        if (msg.receiver === user.uid && !msg.read) {
          updateDoc(doc(db, "chats", msg.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [user, receiverId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const chatPair = getChatPairId(user.uid, receiverId);

    try {
      await addDoc(collection(db, "chats"), {
        sender: user.uid,
        receiver: receiverId,
        chatPair,
        message: newMessage,
        timestamp: serverTimestamp(),
        read: false,
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err.message);
    }
  };

  return (
    <div className="chat-popup">
      <div className="chat-popup-header">
        <div className="chat-user">
          <strong>{receiverName}</strong>
        </div>
        <div className="chat-controls">
          <button
            onClick={() => setMinimized((prev) => !prev)}
            title="Minimize"
          >
            {minimized ? "▴" : "▾"}
          </button>
          <button onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="chat-popup-body">
            {messages.length === 0 && (
              <div className="no-messages">No messages yet.</div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.sender === user?.uid ? "sent" : "received"
                }`}
              >
                <div>{msg.message}</div>
                <div className="chat-timestamp">
                  {msg.timestamp?.seconds &&
                    new Date(msg.timestamp.seconds * 1000).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  {msg.sender === user?.uid && msg.read && (
                    <span className="read-check">✔✔</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-popup-footer" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            <button type="submit">➤</button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
