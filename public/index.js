(function() {
  var log = document.getElementById('log');
  const NOTIFICATION_DELAY = 2500;

  let messageIndex = 0;
  const fakeMessages = [
    'Heyo',
    'Hows it goin?',
    'What you been up to?',
    'These aren\'t real messages.',
  ];
  const userIcon = '/images/demos/matt-512x512.png';
  const userName = 'Matt';

  const promiseTimeout = function(cb, timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        cb();
        resolve();
      }, timeout);
    });
  };


  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    ;
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  const registerServiceWorker = () => {
    return new Promise((resolve, reject) => {
      console.log("passed tghis");
      navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('Service worker successfully registered.');
        console.log('Registration object: ', registration);

        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription === null) {
            // Update UI to ask user to register for Push
            console.log('Not subscribed to push service!');
            console.log('Subscribing user to push notifications...');

            const subscribeOptions = {
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                'BMEYuTpkeJkCo38EzLhz3e3m8fDpE-oqlIdYZz8HKL4GOQs5EoWLI3B22FO8qDdTvyHGMG9SglTZIqj492yjLxM'
              )
            };

            registration.pushManager.subscribe(subscribeOptions)
            .then(newSubscription => {
              console.log('User subscribed to push notifs.');
              // console.log('Subscription object: ', newSubscription);

              resolve(newSubscription);
            })
          } else {
            // We have a subscription, update the database
            console.log('User already subscribed to push notifs.');
            // console.log('Subscription object: ', subscription);

            resolve(subscription);
          }
        });
      })
      .catch((err) => {
        console.error('Unable to register service worker.');
        reject(err);
      });
    });
  }


  const sendSubscriptionToBackEnd = (subscription) => {
    return fetch('/api/save-subscription/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Bad status code from server.');
      }

      console.log('User subscribed to push notifs');
      return response.json();
    }).then((responseData) => {
      if (!(responseData.data && responseData.data.success)) {
        throw new Error('Bad response from server.');
      }
    });
  }

  const setUpSWMessageListener = function() {
    /**** START swMessageListener ****/
    navigator.serviceWorker.addEventListener('message', function(event) {
      console.log('Received a message from service worker: ', event.data);
    });
    /**** END swMessageListener ****/
  }

  const setUpNotificationButtons = function() {
    setUpSWMessageListener();

    registerServiceWorker().then((subscription) => {
      console.log('Subscription object: ', subscription);
      sendSubscriptionToBackEnd(subscription);
    }).catch((err) => {
      console.err('some error in subscribing user to to push notifs: ', err);
    });
  }


  window.addEventListener('load', function() {
    if (!('serviceWorker' in navigator)) {
      // Service Worker isn't supported on this browser, disable or hide UI.
      return;
    }

    if (!('PushManager' in window)) {
      // Push isn't supported on this browser, disable or hide UI.
      return;
    }

    let promiseChain = new Promise((resolve, reject) => {
      const permissionPromise = Notification.requestPermission((result) => {
        resolve(result);
      });

      if (permissionPromise)
        permissionPromise.then(resolve);
    }).then((result) => {
      if (result === 'granted') {
        setUpNotificationButtons();
      } else {
        // displayNoPermissionError();
        console.error('permission not granted');
      }
    });
  });
})();
