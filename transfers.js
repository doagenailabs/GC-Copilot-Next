let participantId = '';

function getAgentParticipantId() {
    let apiInstance = new platformClient.ConversationsApi();

    apiInstance.getConversation(conversationId)
        .then((data) => {
            let participants = data.participants;
            for (let i = 0; i < participants.length; i++) {
                if (participants[i].purpose === 'agent') {
                    participantId = participants[i].id;
                    break;
                }
            }
        })
        .catch((err) => {
            console.log("There was a failure calling getConversation");
            console.error(err);
        });
}
getAgentParticipantId();


const conversationsApi = new platformClient.ConversationsApi();
const routingApi = new platformClient.RoutingApi();

function consultTransfer() {
    // Retrieve queue list
    routingApi.getRoutingQueues()
        .then((data) => {
            // Populate the dropdown with queue names
            var select = document.getElementById("queueSelect");
            for(var i = 0; i < data.entities.length; i++) {
                var opt = data.entities[i];
                var el = document.createElement("option");
                el.textContent = opt.name;
                el.value = opt.id;
                select.appendChild(el);
            }
        })
        .catch((err) => {
            console.log("Error retrieving queue list");
            console.error(err);
        });

    var body = {
        "speakTo": document.getElementById("speakToSelect").value,
        "queueId": document.getElementById("queueSelect").value
    };

    // Initiate a consult transfer to a queue
    conversationsApi.postConversationsCallParticipantConsultQueue(conversationId, participantId, body)
        .then((data) => {
            console.log(`Consult transfer success! data: ${JSON.stringify(data, null, 2)}`);
        })
        .catch((err) => {
            console.log("Error initiating consult transfer");
            console.error(err);
        });
}

function blindTransfer() {
    var body = {
        // Blind transfer request parameters
    };

    // Replace this participant with the specified queue
    conversationsApi.postConversationParticipantReplaceQueue(conversationId, participantId, body)
        .then(() => {
            console.log("Blind transfer returned successfully.");
        })
        .catch((err) => {
            console.log("Error initiating blind transfer");
            console.error(err);
        });
}
