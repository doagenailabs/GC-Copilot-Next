import { getConversation } from './conversation';

export async function initializeWebSocket() {
    let channelId; 
    const platformClient = window.platformClient;
    const apiInstance = new platformClient.NotificationsApi();

    console.log("websocket.js - About to call postNotificationsChannels...");

    try {
        const response = await apiInstance.postNotificationsChannels({});
        console.log("websocket.js - Received response from postNotificationsChannels:", response);

        channelId = response.id;
        const ws = new WebSocket(response.connectUri);

        ws.onmessage = (event) => {
            console.log("websocket.js - WebSocket message received:", event.data);
            const data = JSON.parse(event.data);
            
            if (data.topicName === `v2.detail.events.conversation.${window.conversationId}.user.start`) {
                getConversation(data.eventBody.conversationId, data.eventBody.participantId);
            }
            
            if (data.eventBody.disconnectType) {
                console.log("websocket.js - Received disconnectType in WebSocket message. Closing WebSocket.");
                ws.close();
            }
        };

        ws.onopen = () => {
            console.log("websocket.js - WebSocket connection opened.");
            subscribeToTopic(channelId, `v2.detail.events.conversation.${window.conversationId}.user.start`);
        };

        ws.onerror = (error) => {
            console.log("websocket.js - WebSocket encountered an error:", error);
        };

        ws.onclose = (event) => {
            console.log("websocket.js - WebSocket connection closed:", event);
        };
    } catch (err) {
        console.error("websocket.js - Error during postNotificationsChannels call:", err);
        throw err;
    }
}

function subscribeToTopic(channelId, topicName) {
    console.log("websocket.js - Attempting to subscribe to topic:", topicName);

    const platformClient = window.platformClient;
    let apiInstance = new platformClient.NotificationsApi();
    
    apiInstance.postNotificationsChannelSubscriptions(channelId, [topicName])
        .then(() => {
            console.log("websocket.js - Successfully subscribed to topic:", topicName);
        })
        .catch(err => {
            console.error("websocket.js - Error during topic subscription:", err);
        });
}
