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
    
    const userName = 'arne';
  
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
        navigator.serviceWorker.register('service-worker.js')
        .then((registration) => {
          console.log('Service worker successfully registered.');
          console.log('Registration object: ', registration);
          log.innerHTML += 'Service worker successfully registered.<br>';
          console.log("service worker detected");
          registration.pushManager.getSubscription().then((subscription) => {
            log.innerHTML += 'Subscribing user to push notifications...<br>';
            if (subscription === null) {
              // Update UI to ask user to register for Push
              console.log('Not subscribed to push service!');
              console.log('Subscribing user to push notifications...');
  
              const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    'BO3Z3OvRZVv_N36CUhuGfYBKlELXwVKboqas7Y2szIY4N2_ge0WyxP_Zr6UjXL3I50BofDzBBQVdDVzvJ_90OXM',

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
          log.innerHTML += 'Unable to register service worker or subscribe user<br>';
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
        log.innerHTML += 'User subscribed to push notifs<br>';
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
        log.innerHTML += 'subsctiption object: ' + subscription + '<br>';
        sendSubscriptionToBackEnd(subscription);
      }).catch((err) => {
        log.innerHTML += 'some error in subscribing user to to push notifs: ' + err + '<br>';
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
      console.log("service worker is found");
      let promiseChain = new Promise((resolve, reject) => {
        const permissionPromise = Notification.requestPermission((result) => {
          resolve(result);
        }); 
  

      permissionPromise.then(resolve);
      }).then((result) => {
        if (result === 'granted') {
          console.log("got through here");
          setUpNotificationButtons();
        } else {
          // displayNoPermissionError();
          console.error('permission not granted');
        }
      });
    });
  })();
  