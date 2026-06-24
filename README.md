# Firebase CRUD Teaching Project

Simple SvelteKit, JavaScript, Tailwind CSS and Firebase project for teaching:

- Firebase Authentication
- Firestore CRUD operations
- Firebase Storage uploads

## Features

- Login with email/password or Google
- Signup with full name, email and password
- New signup users are saved as `role: "student"`
- Student dashboard shows assigned tasks and lets students update status
- Student files page shows all files uploaded by admin
- Admin dashboard shows users and task status counts
- Admin tasks page creates and deletes tasks for selected students
- Admin files page uploads and deletes shared files

## Firebase Collections

```txt
users/{uid}
  fullName
  email
  role: "student" | "admin"
  createdAt

tasks/{taskId}
  title
  description
  status: "todo" | "doing" | "done"
  userId
  userName
  userEmail
  createdAt
  updatedAt

files/{fileId}
  name
  path
  url
  size
  type
  uploadedBy
  createdAt
```

Uploaded file objects are stored in Firebase Storage under `shared-files/`.

## Setup

1. Create a Firebase project.
2. Enable Authentication providers:
   - Email/Password
   - Google
3. Create a Firestore database.
4. Enable Firebase Storage.
5. Copy `.env.example` to `.env` and add your Firebase web app config.
6. Start the app:

```sh
npm run dev
```

## Making An Admin

Signup creates students only. To make an admin for the first time:

1. Signup normally.
2. Open Firestore in the Firebase console.
3. Go to the `users` collection.
4. Find your user document.
5. Change `role` from `student` to `admin`.
6. Refresh the app.

## Suggested Teaching Rules

For class demos, publish the rules in `firestore.rules` and `storage.rules` from this project.
They intentionally keep the rules simple: any signed-in user can read and write demo data.
The app UI and `hooks.server.js` show how student/admin routes are separated.

## Build

```sh
npm run build
```
