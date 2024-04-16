import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import './css/call.css'
import Peer from "simple-peer"

import { initializeApp } from "firebase/app";
import { collection, getDocs, getDoc, getFirestore, FieldPath } from 'firebase/firestore'
import { doc, setDoc, query, where, onSnapshot } from "firebase/firestore";
import { getDatabase, onValue, ref, set } from 'firebase/database'

import firebaseConfig from "../../config";
import * as process from 'process';
import images from './user2.png'
(window).global = window;
(window).process = process;
(window).Buffer = [];





// Initialize Firebase
const app = initializeApp(firebaseConfig);




function Video(props) {
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


    //Supporting data
    const [ringing, set_ringing] = useState(false)
    const [call_ongoing, set_call_ongoing] = useState(false)
    const [users, set_users] = useState([])
    const [user2, set_user2] = useState({})

    //Video support controls
    const [mic_state, set_mic_state] = useState(true)
    const [video_state, set_video_state] = useState(true)
    const [remote_mic_state, set_remote_mic_state] = useState(true)
    const [remote_video_state, set_remote_video_state] = useState(true)
    const [my_video_css, set_my_video_css] = useState({ width: '600px', height: "400px", "backgroundColor": 'black', 'border-radius': '12px' })


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
    useEffect(() => {
        if (connectionRef.current && call_ongoing) {
            connectionRef.current.send(JSON.stringify({ stream_controls: [mic_state, video_state] }))
        }
    }, [video_state, mic_state])
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

    function check_valid_meeting_code() {
        var valid = true

        return valid
    }

    useEffect(() => {
        if (call_ongoing) {
            set_my_video_css({ width: "200px", height: '150px', 'border-radius': '12px', 'backgroundColor': 'black' })
        } else {
            set_my_video_css({ width: '600px', height: "400px", "backgroundColor": 'black', 'border-radius': '12px' })
        }
    }, [call_ongoing])



    useEffect(async () => {
        if (check_valid_meeting_code()) {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                streamRef.current = stream; // Store stream reference
                if (myVideo.current) {
                    myVideo.current.srcObject = streamRef.current
                }
                setStream(stream)
            }).catch(async err => {
                console.log('Media problem:', err)
            })
            authenticate()
        }
    }, [])

    function write_offer(data) {
        var db = getDatabase();
        var reference = ref(db, 'meetings/' + id + "/offer")
        //Writing to the database
        set(reference, data)
    }

    function write_answer(data) {
        if (data) {
            var db = getDatabase();
            var reference = ref(db, 'meetings/' + id + "/answer")
            //Writing to the database
            set(reference, data)
        }
    }

    function answer_disconnect() {
        var db = getDatabase();
        var reference = ref(db, 'meetings/' + id + "/answer")
        //Writing to the database
        set(reference, null)
    }
    function offer_disconnect() {
        var db = getDatabase();
        var reference = ref(db, 'meetings/' + id + "/offer")
        //Writing to the database
        set(reference, null)
    }
    async function initiatior_reset() {
        await answer_disconnect()
        set_call_ongoing(false)
        Call_User()
    }
    async function respondent_reset() {
        await offer_disconnect()
        set_call_ongoing(false)
        Answer_Call()
    }



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

    useEffect(() => {
        console.log('User video change')
    }, [userVideo.current])





    function Call_User(recipient_id) {
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

                        urls: "stun:stun.peerup.co.in:3478"
                    },
                    // {
                    //     url: "turn:turn.peerup.co.in:3478",
                    //     username: "guest",
                    //     credential: "somepassword",
                    //     urls: "turn:turn.peerup.co.in:3478"
                    // },

                    // {
                    //     urls: "stun:stun.ourcodeworld.com:5349"
                    // },
                    // {
                    //     url: "turn:turn.ourcodeworld.com:5349",
                    //     username: "brucewayne",
                    //     credential: "12345",
                    //     urls: "turn:turn.ourcodeworld.com:5349"
                    // }
                    // {
                    //     "url": "stun:global.stun.twilio.com:3478",
                    //     "urls": "stun:global.stun.twilio.com:3478"
                    // },
                    // {
                    //     "url": "turn:global.turn.twilio.com:3478?transport=udp",
                    //     "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                    //     "urls": "turn:global.turn.twilio.com:3478?transport=udp",
                    //     "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    // },
                    // {
                    //     "url": "turn:global.turn.twilio.com:3478?transport=tcp",
                    //     "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                    //     "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
                    //     "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    // },
                    // {
                    //     "url": "turn:global.turn.twilio.com:443?transport=tcp",
                    //     "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                    //     "urls": "turn:global.turn.twilio.com:443?transport=tcp",
                    //     "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    // }
                ]
            }
        })

        peer.on("signal", (data) => {
            console.log('Calling... Send data:', { signalData: data })
            //socket.emit('call_request', { recipient_id: recipient_id, caller_id: socket.id, call_request: data })
            write_offer(data)
        })

        peer.on("stream", (stream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = stream
                userVideo.current.play()
            }

        })
        peer.on('connect', function () {
            console.log("CONNECTED");

        })
        peer.on('error', function (err) {
            console.log('Connection error', err.message, "+", err.name, "+", err, err)
            if (peer.destroyed) {
                console.log('The connection is destroyed, Reseting connection...')
                initiatior_reset()

            }
        })

        connectionRef.current = peer
        function read_answer() {
            var db = getDatabase();
            const reference = ref(db, 'meetings/' + id + '/answer')
            onValue(reference, (snapshot) => {
                var data = snapshot.val();
                console.log('Call has been accepted', data)
                if (peer && data !== null) {
                    if (!peer.destroyed) {
                        peer.signal(data)
                        set_call_ongoing(true)
                    } else {
                        console.log('Its destroyed,reseting connection...')

                    }
                }
            })
        }
        read_answer()
    }


    function Answer_Call() {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: streamRef.current,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    {

                        urls: "stun:stun.peerup.co.in:3478"
                    },
                    // {
                    //     url: "turn:turn.peerup.co.in:3478",
                    //     username: "guest",
                    //     credential: "somepassword",
                    //     urls: "turn:turn.peerup.co.in:3478"
                    // },
                    // {
                    //     urls: "stun:stun.ourcodeworld.com:5349"
                    // },
                    // {
                    //     url: "turn:turn.ourcodeworld.com:5349",
                    //     username: "brucewayne",
                    //     credential: "12345",
                    //     urls: "turn:turn.ourcodeworld.com:5349"
                    // }
                    // {
                    //     "url": "stun:global.stun.twilio.com:3478",
                    //     "urls": "stun:global.stun.twilio.com:3478"
                    // },
                    // {
                    //     "url": "turn:global.turn.twilio.com:3478?transport=udp",
                    //     "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                    //     "urls": "turn:global.turn.twilio.com:3478?transport=udp",
                    //     "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    // },
                    // {
                    //     "url": "turn:global.turn.twilio.com:3478?transport=tcp",
                    //     "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                    //     "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
                    //     "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    // },
                    // {
                    //     "url": "turn:global.turn.twilio.com:443?transport=tcp",
                    //     "username": "e18ecd309d314091cc0cc16fcef9c230a9cf667611f8a75fc175a3086ebd52be",
                    //     "urls": "turn:global.turn.twilio.com:443?transport=tcp",
                    //     "credential": "rMZ1e27ud4xQxoWT2GokejmT5Uky8meDVDFQTq4Z3tk="
                    // }
                ]
            }
        })
        peer.on("signal", (data) => {
            console.log("Answering call: Send answer", { signal: data })
            //socket.emit('ansered_call_responce', { from: socket.id, to: user2['from'], signal: data })
            write_answer(data)
        })





        peer.on("stream", (stream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
                userVideo.current.play();
            }

        })

        peer.on('connect', function () {
            console.log("CONNECTED");

        })
        peer.on('error', function (err) {
            console.log('Connection error', err.message, "+", err.name, "+", err, err)
            if (peer.destroyed) {
                console.log('The connection is destroyed, Reseting connection...')
                respondent_reset()
            }
        })


        connectionRef.current = peer


        function read_answer() {
            var db = getDatabase();
            const reference = ref(db, 'meetings/' + id + '/offer')
            onValue(reference, (snapshot) => {
                var data = snapshot.val();
                console.log('Received call request', data)
                if (data !== null && !peer.destroyed) {
                    peer.signal(data)
                    set_call_ongoing(true)
                }

            })
        }
        read_answer()
    }





    function End_Call() {
        connectionRef.current.destroy()
    }

    if (check_valid_meeting_code()) {
        return (
            <>
                <div className="central_video_container">


                    {(() => {
                        if (!call_ongoing) {
                            return (
                                <h4>Connecting...</h4>
                            )
                        }
                        if (call_ongoing) {
                            return (
                                <div style={{ width: '600px', height: "400px", "backgroundColor": 'black', 'border-radius': '12px' }}>
                                    {(() => {
                                        if (userVideo) {
                                            return (<video playsInline controls ref={userVideo} autoPlay style={{ width: "100%", height: "100%" }} />)
                                        } else { return ('Not yet') }

                                    })()}
                                </div>
                            )
                        }
                    })()}




                    <div style={my_video_css}>

                        {(() => {

                            if (true) {
                                return (<video playsInline muted ref={myVideo} autoPlay style={{ width: "100%", height: '100%' }} />)
                            } else {
                                return (<img src="/img/user2.png" alt="" />)
                            }
                        })()}
                    </div>


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
        );
    } else {
        return (
            <h1>Invalid meeting link</h1>
        )
    }
}

export default Video;
