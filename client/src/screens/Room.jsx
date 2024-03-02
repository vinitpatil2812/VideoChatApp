import React, { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../screens/context/socketProvider"

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();

    const handleUserJoined = useCallback((data) => {
        const {email, id} = data;
        console.log(email, id);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback( async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const offer =  await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });

        setMyStream(stream);
    }, [socket, remoteSocketId]);

    const handleIncommingCall = useCallback( async ({ from, offer }) => {
        console.log(from, offer);
        setRemoteSocketId(from);  

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMyStream(stream);


        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted', { to: from, ans });
    }, [socket]);

    const handleCallAccepted = useCallback(({ from, ans }) => {
        peer.setLocalDescription(ans);
        console.log("accepted");
    }, []);

    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on('incomming:call', handleIncommingCall);
        socket.on('call:accepted', handleCallAccepted);

        return () => {
            socket.off('user:joined', handleUserJoined);
            socket.off('incomming:call', handleIncommingCall);
            socket.off('call:accepted', handleCallAccepted);
        }
    }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted]);

    return (
        <div>
            <h1>Room Page</h1>
            <h4> { remoteSocketId ? "Connect" : "No one in room" } </h4>
            { remoteSocketId && <button onClick={ handleCallUser } >Call</button> }
            { myStream && <ReactPlayer playing muted height="100px" width="200px" url={myStream} /> }
        </div>
    );
};

export default RoomPage;