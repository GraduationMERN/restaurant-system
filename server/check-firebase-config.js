// Quick test: Load frontend env and check what Firebase config is actually being used
const frontendConfig = {
  apiKey: 'AIzaSyAPdyhDFPX-v7idQRaf8ogKdW9sSRT_c2o',
  authDomain: 'brandbite-bb43a.firebaseapp.com',
  projectId: 'brandbite-bb43a',
  storageBucket: 'brandbite-bb43a.firebasestorage.app',
  messagingSenderId: '129770247846',
  appId: '1:129770247846:web:f81ce1431064b3d8604667',
  measurementId: 'G-30HPP8HZJD'
};

console.log('Frontend Firebase Config:');
console.log(JSON.stringify(frontendConfig, null, 2));

// The messagingSenderId should match the number in appId
const [prefix, messagingSenderId] = frontendConfig.appId.split(':');
console.log('\nExtracted messagingSenderId from appId:', messagingSenderId);
console.log('messagingSenderId in config:', frontendConfig.messagingSenderId);
console.log('Do they match?', messagingSenderId === frontendConfig.messagingSenderId);
