# Lostify – A Lost and Found Solution for Campus

Lostify is a smart campus Lost and Found management platform designed to help students and campus staff report, discover, track and recover misplaced belongings. It provides a centralized digital solution connecting people who have lost items with those who have found them.

Overview

Lostify simplifies campus item recovery through digital reporting, image-based listings, location-based discovery and secure ownership verification.

Live Application: https://lostify-three.vercel.app

Features

1. Lost Item Reporting

- Report missing belongings.
- Upload photographs using the camera or gallery.
- Add item names, categories and descriptions.
- Provide last-seen location details.

2. Found Item Reporting

- Report items discovered around campus.
- Upload photographic evidence.
- Add item descriptions and found locations.
- Help rightful owners recover their belongings.

3. Campus Gallery

- Browse lost and found items.
- Separate Lost and Found listings.
- Search for specific belongings.
- View item photographs and location details.

4. Interactive Campus Map

- Visualize reported item locations.
- Identify nearby lost and found items.
- Explore item locations across campus.

5. Two-Step Claim Verification

Lostify incorporates a security-focused ownership verification system.

Step 1: System Verification

- Users submit claims for reported items.
- The system processes the submitted claim information.
- Eligible claims proceed to security verification.

Step 2: Security Guard Verification

- Guards access confidential item-identification details.
- Private details remain hidden from normal users.
- Guards can ask additional verification questions.
- Claimants must provide correct secret information.
- Authorized guards make the final handover decision.

6. Secure Storage

- Maintain records of items deposited with campus security.
- Associate stored belongings with student information.
- Help security staff manage collected items.

7. Digital Handover History

- Record completed item handovers.
- Capture recipient photographs.
- Store recipient registration numbers and phone numbers.
- Maintain historical records for authorized guards and administrators.

8. Admin and Guard Panels

- Role-based access control.
- Manage reported items.
- Review claims and verification records.
- Access handover history.
- Monitor campus lost-and-found activities.

9. Push Notifications

- Notify users about relevant updates.
- Send claim-related notifications.
- Support administrative announcements.
- OneSignal integration for push notifications.

10. Campus Shop

- Dedicated campus marketplace section.
- Access to campus-related shopping features.

Technology Stack

Technology| Purpose
Next.js / React| Frontend development
JavaScript| Application functionality
Tailwind CSS| UI styling
Firebase Authentication| User authentication
Cloud Firestore| Database
Firebase Storage / Cloudinary| Image management
Google Maps| Location visualization
OneSignal| Push notifications
Vercel| Deployment and hosting
GitHub| Version control

Security and Privacy

Lostify focuses on protecting user information and preventing unauthorized item claims.

- Confidential item details are restricted to authorized guards.
- Role-based access for users, guards and administrators.
- Private ownership verification.
- Restricted access to handover records.
- Protection of student contact information.

Project Objectives

- Digitize campus lost-and-found management.
- Make reporting and searching easier.
- Reduce the time required to recover belongings.
- Improve communication between students and security staff.
- Reduce fraudulent ownership claims.
- Maintain transparent handover records.

Future Enhancements

- AI-powered image recognition.
- Automatic matching of lost and found items.
- QR-based item identification.
- Smart claim-risk detection.
- Advanced administrative analytics.
- Improved real-time notifications.
- Multi-campus support.

Installation and Setup

Prerequisites

- Node.js
- npm
- Git
- Firebase project
- Required API credentials

Clone Repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd lostify

Install Dependencies

npm install

Environment Configuration

Create a ".env.local" file in the project root.

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

Add other required service credentials according to your project configuration.

Never upload private API secrets or service-account credentials to GitHub.

Start Development Server

npm run dev

Open "http://localhost:3000" in your browser.

Production Build

npm run build
npm start

Conclusion

Lostify transforms traditional campus lost-and-found management into a centralized digital experience. With image-based reporting, campus mapping, item discovery, confidential ownership verification and digital handover records, it aims to make recovering misplaced belongings easier, safer and more organized.
