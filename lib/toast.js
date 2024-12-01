export function showToast(message, toastId, duration = 5000) {
  const isSalesforce = new URLSearchParams(window.location.search).get('sf') === 'true';

  if (isSalesforce) {
    window.parent.postMessage({
      type: 'SHOW_TOAST',
      detail: { message, toastId, duration }
    }, '*');
  } else {
    window.myClientApp.alerting.showToastPopup(toastId, message, {
      id: toastId,
      timeout: duration,
      showCloseButton: true
    });
  }
}
