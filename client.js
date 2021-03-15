const publicVapidKey ='BJPpZiL70hlUB8gbxv1QgSJufk1YNH1-urBSHxgHQvQ_fynJX4VBszIjwTAEsNxSe0H8vUPoIrDPCqFq8fo-VGA';


if("serviceWorker" in navigator) {
    send().catch(err => concole.error(err));
}


async function send() {
console.log("registering serveice woker");
const register = await navigator.serviceWorker.register("/worker.js", {
    scope: "/";
    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true, 
        applicationServerKey: publicVapidKey
    })
});
