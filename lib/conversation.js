export function getConversation(conversationId, participantId) {
  const platformClient = window.platformClient;
  const apiInstance = new platformClient.ConversationsApi();

  return apiInstance.getConversation(conversationId)
    .then((data) => {
      const participant = data.participants.find(p => p.id === participantId);
      if (participant) {
        if (participant.aniName === "Monitor") {
          showToast("Your call is being monitored", "Monitor", 5000);
        }
        if (participant.aniName === "Coach") {
          showToast("Your call is being coached", "Coach", 5000);
        }
      }
    })
    .catch((err) => {
      console.error("Error calling getConversation:", err);
    });
}
