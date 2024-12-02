import { showToast } from './toast';

const LOG_PREFIX = 'GCCopilotNext - conversation.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

export function getConversation(conversationId, participantId) {
  if (!conversationId || !participantId) {
    error('Missing required parameters:', { conversationId, participantId });
    return;
  }

  log('Getting conversation:', { conversationId, participantId });

  try {
    if (!window.platformClient) {
      throw new Error('Platform client not initialized');
    }

    const platformClient = window.platformClient;
    const client = platformClient.ApiClient.instance;
    
    if (!client) {
      throw new Error('API client instance not available');
    }

    let apiInstance = new platformClient.ConversationsApi();
    debug('API instance created successfully');

    apiInstance.getConversation(conversationId)
      .then((data) => {
        debug('Conversation data received:', JSON.stringify(data, null, 2));
        
        if (!data.participants) {
          throw new Error('No participants data in response');
        }

        const participant = data.participants.find(p => p.id === participantId);
        
        if (participant) {
          const aniName = participant.aniName;
          const mediaRole = participant.mediaRoles?.length > 0 ? participant.mediaRoles[0] : 'No media role';
          const monitoredParticipantId = participant.monitoredParticipantId || 'No monitored participant';
          
          log('Participant info:', {
            aniName,
            mediaRole,
            monitoredParticipantId
          });

          // Handle monitoring notifications
          if (participant.aniName === "Monitor") {
            debug('Showing monitor toast notification');
            showToast("Your call is being monitored", "Monitor", 5000);
            log('Monitor notification shown');
          }
          if (participant.aniName === "Coach") {
            debug('Showing coach toast notification');
            showToast("Your call is being coached", "Coach", 5000);
            log('Coach notification shown');
          }
        } else {
          error('Participant not found:', { participantId, availableIds: data.participants.map(p => p.id) });
        }
      })
      .catch((err) => {
        error('Failed to get conversation:', err);
        if (err.status) {
          error('API Error details:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            code: err.code
          });
        }
      });
  } catch (err) {
    error('Error initializing conversation request:', err);
  }
}
