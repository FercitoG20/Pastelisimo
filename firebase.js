import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';  
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA_Vx5YkphPi013RHL1le91RVyejLIjHVQ",
  authDomain: "basepasteles.firebaseapp.com",
  projectId: "basepasteles",
  storageBucket: "basepasteles.appspot.com",
  messagingSenderId: "31254003447",
  appId: "1:31254003447:web:ccff4a89adff2d1ad71df2",
  measurementId: "G-M9K4JDXCCL"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app); 
const db = getFirestore(app);  
const analytics = getAnalytics(app);  

export { auth, db, analytics }; 
