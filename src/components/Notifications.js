import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = () => {
            const user = auth.currentUser;
            if (user) {
                const q = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid)
                );

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetchedNotifications = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setNotifications(fetchedNotifications);
                });

                return unsubscribe;
            }
        };

        const unsubscribe = fetchNotifications();
        return () => unsubscribe && unsubscribe();
    }, []);

    return (
        <div>
            <h2>Notifications</h2>
            {notifications.length > 0 ? (
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <p>{notification.message}</p>
                            <p>{new Date(notification.timestamp.toDate()).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No notifications available.</p>
            )}
        </div>
    );
};

export default Notifications;
