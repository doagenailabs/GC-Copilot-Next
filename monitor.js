function fetchWorktypeAndSetStatus() {
    const platformClient = window.platformClient;
    if (!platformClient) return;
    
    let apiInstance = new platformClient.TaskManagementApi();
    let worktypeId = window.WorktypeId;
    let opts = {};
    apiInstance.getTaskmanagementWorktype(worktypeId, opts)
        .then((data) => {
            populateStatusDropdown(data.statuses);
        })
        .catch((err) => {
            console.log("There was a failure calling getTaskmanagementWorktype");
            console.error(err);
        });
}
