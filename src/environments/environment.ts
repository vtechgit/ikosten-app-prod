// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  //apiUrl: 'https://ikosten-api-v3-e7cbdta5hndta2fc.eastus-01.azurewebsites.net/api',
  apiUrl: 'http://localhost:4001/api',
  firebaseConfig:{
    apiKey: "AIzaSyDLzqus6wv3-fDO0s8pT7yTESudco-8Y48",
    authDomain: "ikosten-app.firebaseapp.com",
    projectId: "ikosten-app",
    storageBucket: "ikosten-app.firebasestorage.app",
    messagingSenderId: "163099486974",
    appId: "1:163099486974:web:087bb03f80c6f7389d13af",
    measurementId: "G-Z75S1R5Z1N"
  },
  security: {
    tokenStorageKey: 'ikosten_access_token',
    refreshTokenStorageKey: 'ikosten_refresh_token',
    userStorageKey: 'ikosten_user_data'
  },
  paypal: {
    clientId: 'ASDX2c3inPc0fEtqcE4TIY_Kj6cXg3caX0pu5PuWJwcIacT0JhqXQO14LM5D0LNTkCrjqot2UGjmrCBa'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
