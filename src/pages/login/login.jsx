import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

import './css/login.css'
import { useNavigate } from "react-router-dom";

import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from 'firebase/firestore'
import { doc, setDoc, query, where, onSnapshot } from "firebase/firestore";


//import firebaseConfig from '../../config.js'
import firebaseConfig from "../../config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()


export default function Login(prop) {
    const [message, set_message] = useState("")
    const [email, set_email] = useState('')
    const [password, set_password] = useState('')
    const db = getFirestore()
    const navigate = useNavigate()



    function nav(url) {
        navigate(url);
    }

    async function check() {

        var db_Ref = collection(db, "users");
        var q = query(db_Ref, where("email", "==", email));
        var querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log('Its empty')
            set_message('Incorrect email or password')
        } else {
            querySnapshot.forEach(async (doc) => {
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, " => ", doc.data());
                if (doc.data()['password'] === password) {
                    console.log('Correct password')
                    var details = JSON.stringify({ id: doc.id, email: email })
                    localStorage.setItem('auth', details)
                    prop.authenticate()
                } else {
                    set_message('Incorrect email or password')
                }
            });

        }
    }



    function Sign_in() {
        signInWithPopup(auth, provider).then(async (data) => {
            console.log(data)
            var user_data = data['user']



            var db_Ref = collection(db, "users");
            var q = query(db_Ref, where("email", "==", user_data['email']));
            var querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                console.log('Its empty')
                set_message('Incorrect email or password')


                const users = doc(collection(db, "users"), user_data['uid']);
                await setDoc(users, { email: user_data['email'], password: 'googleid' }, { merge: true });

                var details = JSON.stringify({ id: user_data['uid'], email: user_data['email'] })
                localStorage.setItem('auth', details)
                prop.authenticate()

            } else {
                querySnapshot.forEach(async (doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    console.log(doc.id, " => ", doc.data());
                    if (doc.data()['password'] === 'googleid') {
                        console.log('Correct password')
                        var details = JSON.stringify({ id: doc.id, email: email })
                        localStorage.setItem('auth', details)
                        prop.authenticate()
                    } else {
                        set_message('Google auth failed')
                    }
                });

            }

        })
    }


    const auth = getAuth();
    const user = auth.currentUser;



    return (
        <>
            <div class="central_input_container">
                <p>{message}</p>
                <div class="input">
                    <input type="text" placeholder="Email" onChange={(e) => { set_email(e.target.value) }} />
                </div>

                <div class="input">
                    <input type="password" placeholder="Password" onChange={(e) => { set_password(e.target.value) }} />
                </div>

                <button class="button_login" onClick={e => { check() }}>Login</button>

                <span>or</span>
                <a href="/register">register</a>

                <button class="button_login" onClick={e => { Sign_in() }}>Continue with google</button>
            </div>
        </>
    )
}