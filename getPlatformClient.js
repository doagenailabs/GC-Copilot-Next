function getPlatformClient() {
    const platformClient = window.platformClient;
    if (!platformClient) {
        console.error('platformClient is not initialized.');
        return null;
    }
    return platformClient;
}
