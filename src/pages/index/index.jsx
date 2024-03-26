import { React, useState } from 'react'
import { useNavigate } from "react-router-dom";
import './css/index.css'

export default function Index(props) {
    const navigate = useNavigate()
    const [meeting_code,set_meeting_code]=useState("")


    function nav(url) {
        navigate(url);
    }

    function nav_meeting(){
        if(meeting_code.length>0){
            var index =meeting_code.indexOf("/")
            if(index>=0){
                console.log('It is a link')
                var code=meeting_code.split("/")[2]
                window.open("/meets/"+code, '_blank').focus()
            }else{
                console.log('Its not a link')
                window.open("/meets/"+meeting_code, '_blank').focus()
            }
        }
        
    }

    return (
        <>
            <div class="body_container">
                <div class="meeting_inputs_container">
                    <a href={"/meets/"+props.user_data['id']}>
                        <button class="index_button" style={{ width: '100%' }}>
                            <img src="img/add.svg" alt="" />
                            New Meeting
                        </button></a>

                    <span>
                        Meeting link or code
                    </span>

                    <div class="link_input_container">
                        <input type="text" onChange={(e)=>{set_meeting_code(e.target.value)}} />
                        <button class="index_button" onClick={e=>{nav_meeting()}}>Join</button>
                        <button class="index_button" onClick={(e)=>{localStorage.removeItem('auth');props.authenticate() }}>Logout</button>
                    </div>

                </div>

                <img style={{ width: '300px' }} src="img/bg.jpeg" alt="" />
            </div>
        </>
    )
}