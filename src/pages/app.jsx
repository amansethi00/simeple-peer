import React, { useEffect, useState } from "react";

//Components
import Login from "./login/login";
import Index from "./index";

export default function App(){
    const [user_data,set_user_data]=useState({'auth':false})

    function authenticate(){
        var auth=localStorage.getItem('auth')
        if(auth===null){
            console.log('Empty')
            set_user_data({'auth':false})
        }else{
            var details=JSON.parse(auth)
            set_user_data({id:details.id,auth:true,email:details.email})
        }
    }


    useEffect(()=>{
        authenticate()
    },[])


    return (
        <>
        {(()=>{
            if(user_data.auth){
                return (
                    <Index user_data={user_data} authenticate={authenticate}></Index>
                )
            }else{
                return (<Login authenticate={authenticate}></Login>)
            }
        })()}
        </>
    )
}