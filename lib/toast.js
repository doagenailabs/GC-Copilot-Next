function getURLParameter(name) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function showToast(message, toastId, duration = 5000) {
  // Check if the toast is being shown in a Salesforce environment
  const isSalesforce = getURLParameter('sf') === 'true';

  console.log("toast.js - showToast - Is Salesforce environment:", isSalesforce);

  if (isSalesforce) {
    console.log("toast.js - showToast - Creating custom toast for Salesforce LWC or other environments different than the native GC UI.");
    // Create a custom toast for Salesforce LWC
    createCustomToast(message, toastId, duration);
  } else {
    console.log("toast.js - showToast - Using clientApp SDK toast logic when not embedded in Salesforce.");
    // Use clientApp SDK toast logic when not embedded in Salesforce
    var options = {
      id: toastId,
      timeout: duration, 
      showCloseButton: true 
    };
    window.myClientApp.alerting.showToastPopup(toastId, message, options);
  }
}

function createCustomToast(message, toastId, duration) {
  if (typeof window === 'undefined') return;
  // Post message to the parent window (Salesforce LWC)
  window.parent.postMessage({
    type: 'SHOW_TOAST',
    detail: {
      message: message,
      toastId: toastId,
      duration: duration
    }
  }, '*'); 
}
