async function initializeWebSocket() {

    let channelId; 
    const platformClient = window.platformClient;
    const apiInstance = new platformClient.NotificationsApi();

    console.log("main.js - About to call postNotificationsChannels...");

    apiInstance.postNotificationsChannels({})
        .then(response => {
            console.log("main.js - Received response from postNotificationsChannels:", response);

            channelId = response.id;
            const ws = new WebSocket(response.connectUri);

            ws.onmessage = (event) => {
                console.log("main.js - WebSocket message received:", event.data);
                const data = JSON.parse(event.data);
                
                if (data.topicName === `v2.detail.events.conversation.${window.conversationId}.user.start`) {
                    getConversation(data.eventBody.conversationId, data.eventBody.participantId);
                }
                
                if (data.eventBody.disconnectType) {
                    console.log("main.js - Received disconnectType in WebSocket message. Closing WebSocket.");
                    ws.close();
                }
            };

            ws.onopen = () => {
                console.log("main.js - WebSocket connection opened.");
                subscribeToTopic(channelId, `v2.detail.events.conversation.${window.conversationId}.user.start`);
            };

            ws.onerror = (error) => {
                console.log("main.js - WebSocket encountered an error:", error);
            };

            ws.onclose = (event) => {
                console.log("main.js - WebSocket connection closed:", event);
            };
        })
        .catch(err => {
            console.error("main.js - Error during postNotificationsChannels call:", err);
        });
}

function subscribeToTopic(channelId, topicName) {
    console.log("main.js - Attempting to subscribe to topic:", topicName);

    const platformClient = window.platformClient;
    let apiInstance = new platformClient.NotificationsApi();
    
    apiInstance.postNotificationsChannelSubscriptions(channelId, [topicName])
        .then(() => {
            console.log("main.js - Successfully subscribed to topic:", topicName);
        })
        .catch(err => {
            console.error("main.js - Error during topic subscription:", err);
        });
}

function getConversation(conversationId, participantId) {
    console.log(`main.js - getConversation - participantId: ${participantId}`);
    console.log(`main.js - Fetching conversation details for ID: ${conversationId}`);
    const platformClient = window.platformClient;
    const client = platformClient.ApiClient.instance;
    let apiInstance = new platformClient.ConversationsApi();

    // Get conversation
    apiInstance.getConversation(conversationId)
      .then((data) => {
        console.log(`main.js - getConversation success! data: ${JSON.stringify(data, null, 2)}`);
        // Find the participant by participantId
        const participant = data.participants.find(p => p.id === participantId);
        if (participant) {
            const aniName = participant.aniName;
            const mediaRole = participant.mediaRoles.length > 0 ? participant.mediaRoles[0] : 'No media role';
            const monitoredParticipantId = participant.monitoredParticipantId || 'No monitored participant';
            console.log(`main.js - Participant Info - ANI Name: ${aniName}, Media Role: ${mediaRole}, Monitored Participant ID: ${monitoredParticipantId}`);

            if (participant.aniName === "Monitor") {
                showToast("Your call is being monitored", "Monitor", 5000);
                console.log("main.js - showToast triggered");
            }
        } else {
            console.log('main.js - Participant not found with the given ID:', participantId);
        }
      })
      .catch((err) => {
        console.log("main.js - There was a failure calling getConversation");
        console.error(err);
      });
}

function showToast(message, toastId, duration = 5000) {
    // Define the options for the toast popup
    var options = {
        id: toastId,
        timeout: duration, // Duration in milliseconds
        showCloseButton: true 
    };

    window.myClientApp.alerting.showToastPopup(toastId, message, options);
}
