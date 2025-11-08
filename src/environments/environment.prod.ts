export const environment = {
  production: true,
  apiUrl: 'https://ikosten-api-v3-e7cbdta5hndta2fc.eastus-01.azurewebsites.net/api',
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
    clientId: 'AaqqrD4ppBAWwcty5v3Zsuf25q5HpS6E1suBLJ8GVUKc_7Yf9UA74bxpt66Ia05FH0h_C9twfLJ4knmp'
  }
};
