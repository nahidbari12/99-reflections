// /src/socket.js

import { io } from "socket.io-client";

// ✅ Use dynamic origin for flexibility
const BACKEND_URL = window.location.origin;

export const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 10000,
});
