rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{document=**} {
      allow read, write: if true;
    }
    match /exam_permissions/{document=**} {
      allow read, write: if true;
    }
    match /review_records/{document=**} {
      allow read, write: if true;
    }
    match /admin_forwarded_requests/{document=**} {
      allow read, write: if true;
    }
    match /student_review_requests/{document=**} {
      allow read, write: if true;
    }
    match /evaluation_reports/{document=**} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
