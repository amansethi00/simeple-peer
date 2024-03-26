import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from 'firebase/firestore'
import { doc, setDoc, query, where, onSnapshot } from "firebase/firestore";

//import firebaseConfig from '../../config.js'
import firebaseConfig from "../../config";


// Initialize Firebase
const app = initializeApp(firebaseConfig);


export default function Register() {
    const [message, set_message] = useState('')
    const [email, set_email] = useState('')
    const [password1, set_password1] = useState('')
    const [password2, set_password2] = useState('')






    async function register() {
        console.log(email, password1)

        if (password1 === password2) {
            const db = getFirestore()
            var db_Ref = collection(db, "users");
            var q = query(db_Ref, where("email", "==", email));
            var querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                
                // Add a new document with a generated id
                const users = doc(collection(db, "users"));
        
                await setDoc(users, { email: email, password: password1 }, { merge: true });
                set_message('Great, you are now registered')
            } else {
                set_message('You already registered')

            }
        } else {
            set_message('Password miss match')
        }


    }


    return (
        <>
            <div class="central_input_container">
                <p>{message}</p>
                <div class="input">
                    <input type="text" placeholder="Email" onChange={(e) => { set_email(e.target.value) }} />
                </div>

                <div class="input">
                    <input type="password" placeholder="Password" onChange={(e) => { set_password1(e.target.value) }} />
                </div>

                <div class="input">
                    <input type="password" placeholder="Password" onChange={(e) => { set_password2(e.target.value) }} />
                </div>

                <button class="button_login" onClick={(e) => { register() }}>Register</button>
            </div>
        </>
    )
}