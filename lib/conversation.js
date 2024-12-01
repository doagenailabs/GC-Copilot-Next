import { showToast } from './toast';

export function getConversation(conversationId, participantId) {
  console.log(`conversation.js - getConversation - participantId: ${participantId}`);
  console.log(`conversation.js - Fetching conversation details for ID: ${conversationId}`);
  const platformClient = window.platformClient;
  const client = platformClient.ApiClient.instance;
  let apiInstance = new platformClient.ConversationsApi();

  // Get conversation
  apiInstance.getConversation(conversationId)
    .then((data) => {
      console.log(`conversation.js - getConversation success! data: ${JSON.stringify(data, null, 2)}`);
      // Find the participant by participantId
      const participant = data.participants.find(p => p.id === participantId);
      if (participant) {
        const aniName = participant.aniName;
        const mediaRole = participant.mediaRoles.length > 0 ? participant.mediaRoles[0] : 'No media role';
        const monitoredParticipantId = participant.monitoredParticipantId || 'No monitored participant';
        console.log(`conversation.js - Participant Info - ANI Name: ${aniName}, Media Role: ${mediaRole}, Monitored Participant ID: ${monitoredParticipantId}`);

        if (participant.aniName === "Monitor") {
          showToast("Your call is being monitored", "Monitor", 5000);
          console.log("conversation.js - Monitor showToast triggered");
        }
        if (participant.aniName === "Coach") {
          showToast("Your call is being coached", "Coach", 5000);
          console.log("conversation.js - Coach showToast triggered");
        }            
      } else {
        console.log('conversation.js - Participant not found with the given ID:', participantId);
      }
    })
    .catch((err) => {
      console.log("conversation.js - There was a failure calling getConversation");
      console.error(err);
    });
}
