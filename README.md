# Lodi Thebian Speech Therapy

Complete Angular 15 client and Node.js/Express/MongoDB server. It includes the public landing page, protected dashboard, patients, appointments, payments, session notes and user management.

## Security and roles

- The staff login is intentionally not linked on the public website. Open `http://localhost:4200/staff-login` directly.
- Administrators see all patients and assign patient access to therapists.
- Therapists see only patients assigned to them, including those they create.
- Administrators can create administrator or therapist accounts.
- Therapists can create therapist accounts, but cannot create administrators or change patient assignments.
- Passwords are hashed in MongoDB. Protected API routes require a signed JWT.

## 1. Configure MongoDB and the first administrator

In `Server`, copy `.env.example` to `.env`. Replace `<db_password>`, `JWT_SECRET`, and `ADMIN_PASSWORD`. In MongoDB Atlas, allow your current IP address. Do not share or commit `.env`.

## 2. Run the server

```powershell
cd Server
Copy-Item .env.example .env
npm install
npm run seed:admin
npm run dev
```

Run `npm run seed:admin` only to create or reset the first administrator configured in `.env`. The API runs at `http://localhost:3000/api`.

## 3. Run the client

Open a second PowerShell window:

```powershell
cd Client\LodiSpeech
npm install
npm start
```

Public page: `http://localhost:4200`

Private staff login: `http://localhost:4200/staff-login`

After logging in as administrator, open **Users** to create staff accounts. Open **Patients**, select a patient and use **Therapist access** to assign that record.
