'use client';

import platformClient from 'purecloud-platform-client-v2';
import { updateAnalysis } from './analysisStore';
import { updateTranscriptionHistory } from './transcriptionStore';
import { logger } from './logging';

const COMPONENT = 'WebSocket';
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000;
let reconnectAttempts = 0;
let wsInstance = null;

export async function initializeWebSocket() {
  logger.debug(COMPONENT, 'Initializing WebSocket');

  if (typeof window === 'undefined') {
    logger.error(COMPONENT, 'window is undefined');
    throw new Error('window is undefined');
  }

  if (!platformClient?.NotificationsApi) {
    throw new Error('Platform Client module loaded but NotificationsApi not found');
  }

  const client = platformClient.ApiClient.instance;

  if (!window.conversationId) {
    logger.error(COMPONENT, 'Conversation ID not set');
    throw new Error('Conversation ID not set');
  }

  // If there's an existing connection, close it
  if (wsInstance) {
    logger.debug(COMPONENT, 'Closing existing WebSocket connection');
    wsInstance.close();
    wsInstance = null;
  }

  let channelId;
  logger.debug(COMPONENT, 'Using platformClient from context');
  logger.debug(COMPONENT, 'Conversation ID:', window.conversationId);

  try {
    const apiInstance = new platformClient.NotificationsApi();
    logger.log(COMPONENT, 'Creating notification channel');

    const response = await apiInstance.postNotificationsChannels({});
    logger.log(COMPONENT, 'Channel created:', response);

    channelId = response.id;
    logger.debug(COMPONENT, 'Channel ID:', channelId);
    logger.debug(COMPONENT, 'Connect URI:', response.connectUri);

    wsInstance = setupWebSocket(response.connectUri, channelId);
    return wsInstance;
  } catch (err) {
    logger.error(COMPONENT, 'Failed to initialize WebSocket:', err);
    handleWebSocketError(err);
    throw err;
  }
}

function setupWebSocket(connectUri, channelId) {
  logger.debug(COMPONENT, 'Setting up WebSocket with URI:', connectUri);

  const ws = new WebSocket(connectUri);

  ws.onmessage = async (event) => {
    try {
      logger.debug(COMPONENT, 'Message received:', event.data);
      const data = JSON.parse(event.data);
      logger.debug(COMPONENT, 'Parsed message data:', data);

      if (data.topicName === 'channel.metadata') {
        logger.debug(COMPONENT, 'Received channel metadata message');
        return;
      }

      if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
        logger.log(COMPONENT, 'Processing transcription message');
        await processTranscription(data);
      }

      if (data.eventBody?.disconnectType) {
        logger.log(COMPONENT, 'Disconnect message received:', data.eventBody.disconnectType);
        ws.close();
      }
    } catch (err) {
      logger.error(COMPONENT, 'Error processing message:', err);
    }
  };

  ws.onopen = () => {
    logger.log(COMPONENT, 'WebSocket connection opened');
    reconnectAttempts = 0;
    subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`);
  };

  ws.onerror = (event) => {
    logger.error(COMPONENT, 'WebSocket error:', event);
    handleWebSocketError(new Error('WebSocket encountered an error'));
  };

  ws.onclose = (event) => {
    logger.log(COMPONENT, 'WebSocket connection closed:', event);
    handleWebSocketClose(event);
    wsInstance = null;
  };

  return ws;
}

async function processTranscription(data) {
  try {
    logger.debug(COMPONENT, 'processTranscription called with data:', data);
    const transcripts = data.eventBody?.transcripts;

    if (!transcripts || !transcripts.length) {
      logger.debug(COMPONENT, 'No transcripts to process');
      return;
    }

    logger.debug(COMPONENT, 'Received transcripts:', transcripts);

    // Initialize buffer if needed
    if (!window.transcriptBuffer) {
      logger.debug(COMPONENT, 'Initializing transcript buffer');
      window.transcriptBuffer = [];
    }

    // Process final transcripts
    const finalTranscripts = transcripts.filter((t) => t.isFinal);
    if (finalTranscripts.length === 0) {
      logger.debug(COMPONENT, 'No final transcripts to process');
      return;
    }

    logger.debug(COMPONENT, 'Processing final transcripts:', finalTranscripts.length);

    // Process transcripts
    const transcriptionTexts = finalTranscripts.map((transcript) => {
      const bestAlternative = transcript.alternatives.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      return {
        text: bestAlternative.transcript,
        channel: transcript.channel,
        confidence: bestAlternative.confidence,
        timestamp: Date.now(),
      };
    });

    logger.debug(COMPONENT, 'Processed transcription texts:', transcriptionTexts);

    // Update history
    transcriptionTexts.forEach((transcript) => {
      updateTranscriptionHistory(transcript);
    });

    // Update buffer
    window.transcriptBuffer.push(...transcriptionTexts);

    // Clean old transcripts
    const oldestAllowedTimestamp = Date.now() - 30000;
    const recentTranscripts = window.transcriptBuffer.filter((t) => t.timestamp >= oldestAllowedTimestamp);
    window.transcriptBuffer = recentTranscripts;

    await analyzeTranscripts(recentTranscripts);
  } catch (err) {
    logger.error(COMPONENT, 'Error processing transcription:', err);
  }
}

async function analyzeTranscripts(recentTranscripts) {
  try {
    logger.debug(COMPONENT, 'Sending transcripts for analysis:', recentTranscripts);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcriptionData: JSON.stringify(recentTranscripts),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    logger.debug(COMPONENT, 'Received response from analysis API');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let analysisText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        logger.debug(COMPONENT, 'Analysis stream complete');
        break;
      }

      const chunk = decoder.decode(value);
      analysisText += chunk;
      logger.debug(COMPONENT, 'Received analysis chunk:', chunk);
      updateAnalysis(analysisText);
    }
  } catch (err) {
    logger.error(COMPONENT, 'Error analyzing transcripts:', err);
  }
}

function handleWebSocketError(err) {
  logger.error(COMPONENT, 'WebSocket error occurred:', err);
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    logger.log(COMPONENT, `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(() => {
      initializeWebSocket().catch((reconnectErr) => {
        logger.error(COMPONENT, 'Reconnection attempt failed:', reconnectErr);
      });
    }, RECONNECT_DELAY);
  } else {
    logger.error(COMPONENT, 'Max reconnection attempts reached');
  }
}

function handleWebSocketClose(event) {
  if (event.code !== 1000) {
    logger.error(COMPONENT, `WebSocket closed abnormally with code ${event.code}`);
    handleWebSocketError(new Error(`Abnormal WebSocket closure with code ${event.code}`));
  } else {
    logger.log(COMPONENT, 'WebSocket closed normally');
  }
}

function subscribeToTopic(channelId, topicName) {
  logger.debug(COMPONENT, 'Subscribing to topic:', topicName);

  const apiInstance = new platformClient.NotificationsApi();

  apiInstance
    .postNotificationsChannelSubscriptions(channelId, [{ id: topicName }])
    .then(() => {
      logger.log(COMPONENT, 'Successfully subscribed to topic:', topicName);
    })
    .catch((err) => {
      logger.error(COMPONENT, 'Error during topic subscription:', err);
    });
}
