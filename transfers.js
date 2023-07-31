let participantId = '';
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

function getAgentParticipantId() {
    console.log("getAgentParticipantId started");
    let apiInstance = new platformClient.ConversationsApi();

    apiInstance.getConversation(window.conversationId)
        .then((data) => {
            console.log("Conversation data:", data);
            let participants = data.participants;
            console.log("Participants:", participants);
            for (let i = 0; i < participants.length; i++) {
                if (participants[i].purpose === 'agent') {
                    participantId = participants[i].id;
                    console.log("Setting participantId:", participantId);
                    break;
                }
            }
        })
        .catch((err) => {
            console.log("There was a failure calling getConversation:", err);
        });
}

const conversationsApi = new platformClient.ConversationsApi();
const routingApi = new platformClient.RoutingApi();

function populateQueues(selectId) {
    // Retrieve queue list
    routingApi.getRoutingQueues({pageSize: 1000})
        .then((data) => {
            // Populate the dropdown with queue names
            var select = document.getElementById(selectId);
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
}

function consultTransfer() {
    var speakTo = document.querySelector("#speakToSelect").value;
    var queueId = document.querySelector("#queueSelectConsult").value;
    var body = {
        "speakTo": speakTo,
        "queueId": queueId
    };
    console.log("window.conversationId:", window.conversationId);
    console.log("participantId:", participantId);
    console.log("speakTo:", speakTo);
    console.log("queueId:", queueId);
    
    conversationsApi.postConversationsCallParticipantConsult(window.conversationId, participantId, body)
        .then((data) => {
            console.log(`Consult transfer success! data: ${JSON.stringify(data, null, 2)}`);
        })
        .catch((err) => {
            console.log("Error initiating consult transfer");
            console.error(err);
        });
}

function blindTransfer() {
    var queueId = document.querySelector("#queueSelectBlind").value;
    var body = {
        "queueId": queueId
    };

    console.log("window.conversationId:", window.conversationId);
    console.log("participantId:", participantId);

    conversationsApi.postConversationsCallParticipantReplace(window.conversationId, participantId, body)
        .then(() => {
            console.log("Blind transfer returned successfully.");
        })
        .catch((err) => {
            console.log("Error initiating blind transfer");
            console.error(err);
        });
}

function startConsultTransfer() {
    // Code to display the Consult transfer elements
    document.querySelector("#transferTypeSelection").style.display = "none";
    document.querySelector("#consultTransferElements").style.display = "block";

    getAgentParticipantId();
    
    // Populate the queues dropdown
    populateQueues("queueSelectConsult");
    

    // Populate the speakTo dropdown
    let speakToOptions = ["DESTINATION", "OBJECT", "BOTH", "CONFERENCE"];
    let select = document.querySelector("#speakToSelect");
    for(let option of speakToOptions) {
        let el = document.createElement("option");
        el.textContent = option;
        el.value = option;
        select.appendChild(el);
    }
}

function startBlindTransfer() {
    // Code to display the Blind transfer elements
    document.querySelector("#transferTypeSelection").style.display = "none";
    document.querySelector("#blindTransferElements").style.display = "block";

    getAgentParticipantId();
    
    // Populate the queues dropdown
    populateQueues("queueSelectBlind");
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector("#blindTransferButton").addEventListener("click", startBlindTransfer);
    document.querySelector("#consultTransferButton").addEventListener("click", startConsultTransfer);
    document.querySelector("#confirmBlindTransferButton").addEventListener("click", blindTransfer);
    document.querySelector("#confirmConsultTransferButton").addEventListener("click", consultTransfer);
});
