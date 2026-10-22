import { Client } from "@stomp/stompjs";
import WebSocket from "ws";

const rideId = process.argv[2];

const client = new Client({
    webSocketFactory: () => new WebSocket("ws://localhost:8080/ws"),
    reconnectDelay: 0,

    onConnect: () => {
        console.log("STOMP CONNECTED!");

        if (rideId) {
            subscribeToRide(rideId);
        } else {
            console.log("Waiting for a ride ID...");
        }
    },

    onStompError: (frame) => {
        console.error("STOMP error:", frame.headers.message);
    },

    onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
    },

    onWebSocketClose: (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
    }
});

function subscribeToRide(id) {
    client.subscribe(`/topic/rides/${id}`, (message) => {
        console.log("Ride notification received:");
        console.log(JSON.parse(message.body));
    });

    console.log(`Subscribed to ride ${id} notifications`);
}

client.activate();