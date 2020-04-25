(function initsw() {
    const PublicKey = 'BGY4KYCXpNJmOxhgde2ir0DXcUm6FhplGVQWiE9Lb09\
                        gWMVqL2mdPfI_txlb75D-tqtKOMfs6UKB94Tp5hf54hw';

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    function askPermission() {
        return new Promise(function (resolve, reject) {
            const permissionResult = Notification.requestPermission(function (result) {
                resolve(result);
            });

            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        })
            .then(function (permissionResult) {
                return permissionResult === "granted";
            });
    }

    function trySubscribe(swRegistration) {
        swRegistration.pushManager.getSubscription()
            .then(subscription => {
                if (!subscription) {
                    const subscribeOptions = {
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(PublicKey)
                    };

                    return swRegistration.pushManager.subscribe(subscribeOptions);
                }
            }).then(subscription => {
                if (subscription) {
                    sendSubscriptionToBackEnd(subscription);
                }
            }).catch(err => {
                console.log("Service Worker Error", err);
            });
    }


    function sendSubscriptionToBackEnd(subscription) {
        let token = document.getElementById('_csrf').getAttribute('content');
        return fetch('/api/save-subscription', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'CSRF-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Bad status code from server.');
                }

                return response.json();
            })
            .then(function (responseData) {
                if (!(responseData.data && responseData.data.success)) {
                    throw new Error('Bad response from server.');
                }
            }).catch(err => {
                console.log('Send to backend error', err);
            });
    }

    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!('PushManager' in window)) {
        return;

    }

    window.addEventListener('load', () => {
        askPermission().then(allowed => {
            if (allowed) {
                navigator.serviceWorker.register('/public/servicesworker/sw.js')
                    .then(swRegistration => {
                        trySubscribe(swRegistration);

                        let logout = document.getElementById("logoutbutton");
                        logout.addEventListener('click', function (event) {
                            swRegistration.pushManager.getSubscription()
                                .then(subscription => {
                                    if (subscription) {
                                        subscription.unsubscribe();
                                    }

                                }).catch(err => {
                                    console.error('Service Worker Unsubcribed', err);
                                });
                        });
                    })
                    .catch(err => {
                        console.error('Service Worker Error', err);
                    });
            }
        });
    });

})();