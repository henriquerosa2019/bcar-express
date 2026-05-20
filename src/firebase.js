import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDV00juuCRmS5TpFJbyhFToSRgxDfYwOFk",
  authDomain: "bcar-express.firebaseapp.com",
  databaseURL: "https://bcar-express-default-rtdb.firebaseio.com",
  projectId: "bcar-express",
  storageBucket: "bcar-express.firebasestorage.app",
  messagingSenderId: "747939326703",
  appId: "1:747939326703:web:9d9d8401d5c9c13a8c891a"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
