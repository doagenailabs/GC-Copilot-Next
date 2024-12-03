'use client';

import platformClient from 'purecloud-platform-client-v2';
import { showToast } from './toast';
import { logger } from './logging';

const COMPONENT = 'Conversation';

export function getConversation(conversationId, participantId) {
  if (!conversationId || !participantId) {
    logger.error(COMPONENT, 'Missing required parameters:', { conversationId, participantId });
    return;
  }

  if (!platformClient?.ConversationsApi) {
    logger.error(COMPONENT, 'Platform Client module loaded but ConversationsApi not found');
    return;
  }

  logger.log(COMPONENT, 'Getting conversation:', { conversationId, participantId });

  try {
    const apiInstance = new platformClient.ConversationsApi();
    logger.debug(COMPONENT, 'API instance created successfully');

    apiInstance
      .getConversation(conversationId)
      .then((data) => {
        logger.debug(COMPONENT, 'Conversation data received:', data);

        if (!data.participants) {
          throw new Error('No participants data in response');
        }

        const participant = data.participants.find((p) => p.id === participantId);

        if (participant) {
          const aniName = participant.aniName;
          const mediaRole = participant.mediaRoles?.length > 0 ? participant.mediaRoles[0] : 'No media role';
          const monitoredParticipantId = participant.monitoredParticipantId || 'No monitored participant';

          logger.log(COMPONENT, 'Participant info:', {
            aniName,
            mediaRole,
            monitoredParticipantId,
          });

          // Handle monitoring notifications
          if (participant.aniName === 'Monitor') {
            logger.debug(COMPONENT, 'Showing monitor toast notification');
            showToast('Your call is being monitored', 'Monitor', 5000);
            logger.log(COMPONENT, 'Monitor notification shown');
          }
          if (participant.aniName === 'Coach') {
            logger.debug(COMPONENT, 'Showing coach toast notification');
            showToast('Your call is being coached', 'Coach', 5000);
            logger.log(COMPONENT, 'Coach notification shown');
          }
        } else {
          logger.error(COMPONENT, 'Participant not found:', {
            participantId,
            availableIds: data.participants.map((p) => p.id),
          });
        }
      })
      .catch((err) => {
        logger.error(COMPONENT, 'Failed to get conversation:', err);
        if (err.status) {
          logger.error(COMPONENT, 'API Error details:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            code: err.code,
          });
        }
      });
  } catch (err) {
    logger.error(COMPONENT, 'Error initializing conversation request:', err);
  }
}
