import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import './css/call.css'
import Peer from "simple-peer"

import { initializeApp } from "firebase/app";
import { collection, getDocs, getDoc, getFirestore, FieldPath } from 'firebase/firestore'
import { doc, setDoc, query, where, onSnapshot } from "firebase/firestore";

//import firebaseConfig from '../../config.js'


import * as process from 'process';
(window).global = window;
(window).process = process;
(window).Buffer = [];



const firebaseConfig = {
    apiKey: "AIzaSyCb9xXAkJie-R053FQLTBFjvGQiFaeIkiA",
    authDomain: "t0-python.firebaseapp.com",
    databaseURL: "https://t0-python-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "t0-python",
    storageBucket: "t0-python.appspot.com",
    messagingSenderId: "331595037617",
    appId: "1:331595037617:web:33d7379becdde728819b90",
    measurementId: "G-WCLNC4SN6D"
};
// Initialize Firebase
initializeApp(firebaseConfig);


export default function Video(props) {
    const navigate = useNavigate()
    function nav(url) {
        navigate(url);
    }

    //User data
    const [user_data, set_user_data] = useState(null)
    const { id } = useParams();

    //Connection variables
    const [call_request, set_call_request] = useState({ sdp: null })
    const [call_responce, set_call_responce] = useState({ sdp: null })


    //Stream variables
    const streamRef = useRef(null);
    const [stream, setStream] = useState()
    const myVideo = useRef()
    const userVideo = useRef()

    const connectionRef = useRef()




    //Authenticateion: if its a random user... or if its the owner or if its another user
    function authenticate() {
        //Check local storage
        var auth = localStorage.getItem('auth')
        if (auth === null) {
            console.log('Empty')
            set_user_data({ 'auth': false })
        } else {
            var details = JSON.parse(auth)
            set_user_data({ id: details.id, auth: true, email: details.email })
        }
    }

    useEffect(() => {
        if (user_data != null) {
            //Authentication is done, next stage...
            console.log('I am authenticated')
            if (user_data['auth'] === true) {
                //Lets check if the person entering the meeting is the owner of the meeting
                if (user_data['id'] == id) {
                    //If its the owner Start the calling process
                    console.log('Its my meeting,Starting call process...')
                    //Post call request 
                    //Listen for the answer
                    Call_User()

                } else {
                    //If its another user send user data
                    Answer_Call()
                }
            } else {
                //Even when the user is not in the database they can just join the meeting
                Answer_Call()
            }

        }
    }, [user_data])





    //Video support controls
    const [mic_state, set_mic_state] = useState(true)
    const [video_state, set_video_state] = useState(true)
    function change_mic_state() {
        if (streamRef.current) {
            const tracks = streamRef.current.getTracks();

            tracks.forEach((track) => {
                if (track.kind === 'audio') {
                    track.enabled = !track.enabled; // Toggle enabled state
                }
            });
        }
        if (mic_state) { set_mic_state(false) } else { set_mic_state(true) }
    }
    function change_video_state() {
        if (streamRef.current) {
            const tracks = streamRef.current.getTracks();

            tracks.forEach((track) => {
                if (track.kind === 'video') {
                    track.enabled = !track.enabled; // Toggle enabled state
                }
            });
        }
        if (video_state) { set_video_state(false) } else { set_video_state(true) }
    }




    //Supporting data
    const [ringing, set_ringing] = useState(false)
    const [call_ongoing, set_call_ongoing] = useState(false)
    const [users, set_users] = useState([])
    const [user2, set_user2] = useState({})









    useEffect(async () => {

        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: video_state,
                    audio: mic_state,
                });
                streamRef.current = stream; // Store stream reference

                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
                setStream(stream)
            } catch (error) {
                console.error('Error accessing media:', error);
            }
        };

        getMedia();
        authenticate()
    }, [])


    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: video_state,
                    audio: mic_state,
                });
                streamRef.current = stream; // Store stream reference

                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing media:', error);
            }
        };

        getMedia();
    }, [video_state, mic_state]);









    function Call_User() {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },

                    {
                        "url": "stun:global.stun.twilio.com:3478",
                        "urls": "stun:global.stun.twilio.com:3478"
                    },
                    {
                        "url": "turn:global.turn.twilio.com:3478?transport=udp",
                        "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                        "urls": "turn:global.turn.twilio.com:3478?transport=udp",
                        "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    },
                    {
                        "url": "turn:global.turn.twilio.com:3478?transport=tcp",
                        "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                        "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
                        "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    },
                    {
                        "url": "turn:global.turn.twilio.com:443?transport=tcp",
                        "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                        "urls": "turn:global.turn.twilio.com:443?transport=tcp",
                        "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    }

                ],
            },
        })

        peer.on("signal", (data) => {
            console.log('Calling... Send data:', { signalData: data })
            //socket.emit('call_request', { recipient_id: recipient_id, caller_id: socket.id, call_request: data })
            //Another \add
            if (id === user_data['id']) {
                var db = getFirestore()
                var Ref = doc(db, 'users', user_data.id);
                setDoc(Ref, { call_request: data, call_responce: null }, { merge: true });
                console.log('Call request sent')
            } else {
                console.log('Checking for call request, cant make a call request')

            }

        })

        peer.on("stream", (stream) => {
            console.log("remote stream", stream)
            if (userVideo.current) {
                userVideo.current.srcObject = stream
            }

        })
        peer.on("open", () => {
            console.log('Connection opened successfully!')
            // ... rest of your call logic
        });

        connectionRef.current = peer
        var db = getFirestore()
        const unsub = onSnapshot(doc(db, "users", id), (doc) => {
            console.log("Current data: ", doc.data());

            if (doc.data()['call_responce'] != null && doc.data()['call_responce']['sdp'] !== call_responce['sdp']) {
                console.log('Call has been accepted', doc.data()['call_responce'])
                //Call_Accepted_responce(data.signal)
                if (peer != null) {
                    peer.signal(doc.data()['call_responce'])
                    set_call_responce(doc.data()['call_responce'])
                    set_call_ongoing(true)
                } else {
                    console.log('peer has not been defined, its still null')
                }
            }
        });
    }



    async function Answer_Call() {
        let callerSignal = null

        // Add a new document with a generated id
        var db = getFirestore()
        const snap = await getDoc(doc(db, 'users', id))
        if (snap.exists()) {
            console.log("Answering call...", snap.data()['call_request'])
            set_call_request(snap.data()['call_request'])
            //Check later if its null
            callerSignal = snap.data()['call_request']
        }
        else {
            console.log("No such document")
        }

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                ]
            }
        })
        peer.on("signal", (data) => {
            console.log("Answering call: Send answer", { answer: data })
            //socket.emit('ansered_call_responce',{from:socket.id,to:user2['from'],signal:data})

            var db = getFirestore()
            var Ref = doc(db, 'users', id);
            setDoc(Ref, { call_responce: data }, { merge: true });
        })



        peer.on("stream", (stream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = stream
            }

        })
        peer.on('error', function (err) {
            console.log('Connection error', err.message, "+", err.name, "+", err, err)
            var db = getFirestore()
            var Ref = doc(db, 'users', user_data.id);
            setDoc(Ref, { call_request: null, call_answer: null }, { merge: true });
            set_call_ongoing(false)

        })

        peer.signal(callerSignal)
        connectionRef.current = peer
        set_call_ongoing(true)


        // var db = getFirestore()
        // const unsub = onSnapshot(doc(db, "users", id), (doc) => {
        //     console.log("Current data: ", doc.data());
        //     console.log('Change detected, check for call request', doc.data())
        //     if (doc.data()['call_request'] != null && call_request['sdp']!==doc.data()['call_request']['sdp']) {
        //         //Call_Accepted_responce(data.signal)
        //         if (peer != null) {
        //             peer.signal(doc.data()['call_request'])
        //             set_call_ongoing(true)
        //             console.log('Call request changed, adjusting...')
        //         } else {
        //             console.log('peer has not been defined, its still null')
        //         }
        //     }
        // });
    }






    return (
        <>
            <div className="central_video_container">

                {(() => {
                    if (call_ongoing && userVideo) {
                        return (<video playsInline ref={userVideo} autoPlay style={{ width: "100%" }} />)
                    } else { return ('Not yet') }

                })()}

                {(() => {

                    if (video_state) {
                        return (<video playsInline muted ref={myVideo} autoPlay style={{ width: "100%" }} />)
                    } else {
                        return (<img src="/img/user2.png" alt="" />)
                    }
                })()}


                <img src="/img/user1.png" alt="" />

                <div className="call_controls_container">
                    {(() => {
                        if (mic_state) {
                            return (<img src="/img/mic_true.svg" onClick={(e) => { change_mic_state() }} alt="" />)
                        } else {
                            return (<img src="/img/mic_false.svg" onClick={(e) => { change_mic_state() }} alt="" />)
                        }
                    })()}

                    {(() => {
                        if (video_state) {
                            return (<img src="/img/video_true.svg" onClick={(e) => { change_video_state() }} alt="" />)
                        } else {
                            return (<img src="/img/video_false.svg" onClick={(e) => { change_video_state() }} alt="" />)
                        }
                    })()}

                    <img src="/img/end_call.svg" alt="" />

                </div>

            </div>

            <button className="index_button" style={{ position: 'absolute', top: '5px', left: '5px' }} onClick={(e) => { navigator.clipboard.writeText(user_data['id']) }}>Copy code</button>
        </>
    )
}