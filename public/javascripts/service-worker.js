self.addEventListener('push', function(e) {
  // console.log(e);
  var body;
  var title;
  var data = e.data.json();
  var options = {};
  // data = JSON.parse(data.body);

  if (e.data) {
    title = data.title;
    body = data.body;
  } else {
    title = 'Push Notification Test!';
    body = 'Push message no payload';
  }

  options = {
    body: body,
    icon: 'https://img7.androidappsapk.co/300/4/9/a/in.edu.siesgst.companion.png',
    vibrate: [100, 50, 100]
    // data: {
    //   dateOfArrival: Date.now(),
    //   primaryKey: 1
    // },
    // actions: [
    //   {action: 'explore', title: 'Explore this new world',
    //     icon: 'images/checkmark.png'},
    //   {action: 'close', title: 'I don\'t want any of this',
    //     icon: 'images/xmark.png'},
    // ]
  };
  console.log(data);
  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});