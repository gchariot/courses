import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC12V7hUaPCuJQl6vCD_6tbQfVkUI6yVb4",
  authDomain: "liste-course-e65d3.firebaseapp.com",
  databaseURL:
    "https://liste-course-e65d3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "liste-course-e65d3",
  storageBucket: "liste-course-e65d3.firebasestorage.app",
  messagingSenderId: "1069804962848",
  appId: "1:1069804962848:web:f62b9adf37787806e36845",
  measurementId: "G-8GYQ80XBWB",
};

export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
