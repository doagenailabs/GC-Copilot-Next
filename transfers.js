let participantId = '';
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

function getAgentParticipantId() {
    let apiInstance = new platformClient.ConversationsApi();

    apiInstance.getConversation(window.conversationId)
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
            console.log("There was a failure calling getConversation:", err);
        });
}
getAgentParticipantId();


const conversationsApi = new platformClient.ConversationsApi();
const routingApi = new platformClient.RoutingApi();

function consultTransfer() {
    var speakTo = document.querySelector("#speakToSelect").value;
    var queueId = document.querySelector("#queueSelectConsult").value;
    var body = {
        "speakTo": speakTo,
        "queueId": queueId
    };

    // Initiate a consult transfer to a queue
    conversationsApi.postConversationsCallParticipantConsultQueue(window.conversationId, participantId, body)
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

    // Replace this participant with the specified queue
    conversationsApi.postConversationParticipantReplaceQueue(window.conversationId, participantId, body)
        .then(() => {
            console.log("Blind transfer returned successfully.");
        })
        .catch((err) => {
            console.log("Error initiating blind transfer");
            console.error(err);
        });
}

function chooseTransferType() {
    let transferType = prompt("Please enter your transfer type (Blind or Consult)");
    if (transferType.toLowerCase() === "blind") {
        // For Blind transfer
        startBlindTransfer();
    } else if (transferType.toLowerCase() === "consult") {
        // For Consult transfer
        startConsultTransfer();
    } else {
        alert("Invalid transfer type");
    }
}

function startConsultTransfer() {
    // Code to display the Consult transfer elements
    document.querySelector("#transferTypeSelection").style.display = "none";
    document.querySelector("#consultTransferElements").style.display = "block";
}

function startBlindTransfer() {
    // Code to display the Blind transfer elements
    document.querySelector("#transferTypeSelection").style.display = "none";
    document.querySelector("#blindTransferElements").style.display = "block";
}

document.querySelector("#blindTransferButton").addEventListener("click", startBlindTransfer);
document.querySelector("#consultTransferButton").addEventListener("click", startConsultTransfer);
document.querySelector("#confirmBlindTransferButton").addEventListener("click", blindTransfer);
document.querySelector("#confirmConsultTransferButton").addEventListener("click", consultTransfer);
