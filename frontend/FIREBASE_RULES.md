# How to Fix "Database Permission Denied"

The error **"Database Permission Denied. Please ensure your Firestore Rules allow writes"** occurs because your Firebase Database is set to **Locked Mode** by default. This prevents anyone (even logged-in users) from saving data.

## The Solution

You need to change the rules to allow **Authenticated Users** to read and write.

### Option 1: Update via Firebase Console (Immediate Fix)

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Firestore Database** > **Rules** tab.
3.  Delete the existing code and paste the code below.
4.  Click **Publish**.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read/write access to any user signed in via Firebase Auth
      allow read, write: if request.auth != null;
    }
  }
}
```

### Option 2: Deploy via CLI (Project Fix)

The `firestore.rules` file in your project has been updated with the correct rules. You can deploy them by running:

```bash
firebase deploy --only firestore:rules
```

## Why this works

*   `match /{document=**}`: This applies the rule to every collection in your database (Users, Projects, Tickets, etc.).
*   `if request.auth != null`: This checks if the user has successfully logged in (via the Email/Password login you just set up). If they are logged in, they are allowed to save data.
