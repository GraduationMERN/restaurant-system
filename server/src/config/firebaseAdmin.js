import admin from "firebase-admin";

import {env} from "./env"


admin.initializeApp({
  credential: admin.credential.cert({
        projectId: env.firebaseprojectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
      })
});

export default admin;