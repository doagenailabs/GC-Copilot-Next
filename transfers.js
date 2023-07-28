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
    var body = {
        // Blind transfer request parameters
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
        document.querySelector("#startTransfer").addEventListener("click", startBlindTransfer);
    } else if (transferType.toLowerCase() === "consult") {
        // For Consult transfer
        document.querySelector("#startTransfer").addEventListener("click", startConsultTransfer);
    } else {
        alert("Invalid transfer type");
    }
}

function startConsultTransfer() {
    // Code to display the two drop down lists and the confirm button
    document.querySelector("#dropdown1").style.display = "block";
    document.querySelector("#dropdown2").style.display = "block";
    document.querySelector("#confirmButton").style.display = "block";
    document.querySelector("#confirmButton").addEventListener("click", consultTransfer);
}

function startBlindTransfer() {
    // Code to display the drop down list and the confirm button
    document.querySelector("#dropdown1").style.display = "block";
    document.querySelector("#confirmButton").style.display = "block";
    document.querySelector("#confirmButton").addEventListener("click", blindTransfer);
}
