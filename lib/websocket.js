import { showToast } from './toast';
import { getConversation } from './conversation';

export async function initializeWebSocket() {
  let channelId;
  const platformClient = window.platformClient;
  const apiInstance = new platformClient.NotificationsApi();

  try {
    const response = await apiInstance.postNotificationsChannels({});
    channelId = response.id;
    const ws = new WebSocket(response.connectUri);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.topicName === `v2.detail.events.conversation.${window.conversationId}.user.start`) {
        getConversation(data.eventBody.conversationId, data.eventBody.participantId);
      }
      
      if (data.eventBody.disconnectType) {
        ws.close();
      }
    };

    ws.onopen = () => {
      subscribeToTopic(channelId, `v2.detail.events.conversation.${window.conversationId}.user.start`);
    };
  } catch (err) {
    console.error("Error during postNotificationsChannels call:", err);
  }
}

function subscribeToTopic(channelId, topicName) {
  const platformClient = window.platformClient;
  const apiInstance = new platformClient.NotificationsApi();
  
  return apiInstance.postNotificationsChannelSubscriptions(channelId, [topicName]);
}

