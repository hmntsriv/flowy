<img width="50" height="50" alt="favicon" src="https://github.com/user-attachments/assets/02f42716-daff-48d6-85c9-86673b6aa428" />
<h1>flowy</h1>
A modern full-stack notes application built with the MERN stack, designed for fast capture, organization, and editing of ideas.

Flowy supports both traditional text notes and freeform canvas notes, with authentication, starring, trash/restore, responsive mobile layouts, autosave, and a polished dark/light interface.

✨ Features

🔐 Login and registration

📝 Text notes with autosave

🎨 Freeform canvas notes

⭐ Star/unstar important notes

🗑️ Trash, restore, and permanent delete

📋 Duplicate and copy notes

🔎 Note search and filtered views

👤 User profile/account panel

🔄 Save-status feedback and error toasts

📱 Responsive mobile experience

🌙 Light and dark themes

⚡ Realtime note updates

🛡️ Protected note APIs with JWT authentication

🧩 Tech Stack

Frontend

React

Vite

React Router

Axios

Lucide React

Socket.IO client

Backend

Node.js

Express

MongoDB

Mongoose

JSON Web Tokens (JWT)

bcrypt

Socket.IO


 <h1>Screenshots</h1>
 <h3>Dashboard</h3>
Light Mode
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1536c7c8-8fc8-4a8b-b80a-ce5ca88ba640" />
 
Dark Mode
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/42eb52a8-ceaa-4a70-9728-fe54b70dc22c" />

<h3>Login & Registration Page</h3>
Light Mode
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ad6ef4dd-8de6-4550-9c31-3fbccf79e0df" />

Dark Mode
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/9629b45b-46f5-4bd5-8b64-39a6e4a2ed18" />

<h3>Canvas Notes</h3>
Light Mode
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ebb4d486-1412-492a-80b0-589a0746f514" />

Dark Mode
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f7945df0-0052-46b6-85ab-6bf1e5016125" />




<h3>Mobile</h3> 
Light Mode
<img width="414" height="913" alt="image" src="https://github.com/user-attachments/assets/d153fbd7-522a-415a-913a-1a3c40a64382" />
<img width="413" height="915" alt="image" src="https://github.com/user-attachments/assets/b699dfe7-3143-4a48-a14e-9305c4753bb2" />

Dark Mode
<img width="415" height="914" alt="image" src="https://github.com/user-attachments/assets/82d2ff41-7d8e-46d5-a9db-7db958dadd5b" />
<img width="407" height="919" alt="image" src="https://github.com/user-attachments/assets/e6ae55b5-d2fe-43ea-88cc-adecc215abe8" />


🏗️ Project Structure

flowy/<br>
├── web/                  # React + Vite frontend/<br>
│   ├── src//<br>
│   │   ├── components//<br>
│   │   ├── context//<br>
│   │   ├── pages//<br>
│   │   ├── services//<br>
│   │   └── .../<br>
│   └── .../<br>
│/<br>
├── server/               # Node + Express backend/<br>
│   ├── src//<br>
│   │   ├── controllers//<br>
│   │   ├── middleware//<br>
│   │   ├── models//<br>
│   │   ├── routes//<br>
│   │   └── .../<br>
│   └── .../<br>
│/<br>
└── README.md/<br>

🔐 Authentication

Flowy uses JWT-based authentication.

After login, the frontend stores the authenticated session information and attaches the JWT as a Bearer token for protected API requests.

Protected note routes require authentication, including:

Creating notes

Reading notes

Updating notes

Moving notes to trash

Restoring notes

Permanently deleting notes

📝 Notes

Flowy supports two note types:

Text Notes

Create and edit notes using a clean writing-focused editor. Changes are automatically saved with a short debounce to avoid unnecessary API requests.

Canvas Notes

Create freeform visual notes using the canvas editor. Canvas data is persisted through the backend and can be reopened after refreshing the application.

🗑️ Trash

Deleted notes are moved to Trash instead of being immediately destroyed.

From Trash you can:

Restore a note

Permanently delete a note

📱 Responsive Design

The interface is designed to work across:

Small mobile screens

Large mobile screens

Tablets

Laptops

Desktop displays

Mobile layouts include a collapsible sidebar, dedicated editor navigation, touch-friendly controls, safe-area handling, and a floating create-note action.

⚙️ Local Development

Clone the repository and install dependencies separately for the frontend and backend.

Backend

cd server
npm install

Create the required environment variables in your backend environment file.

Example:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

Start the backend using the script configured in the project's server/package.json.

Frontend

cd web
npm install

Start the Vite development server using the script configured in the project's web/package.json.

Keep the frontend API base URL aligned with the backend URL used by your local or deployed environment.

🧪 Testing Checklist

Before deployment, verify:

Registration works

Login works

Protected routes reject unauthenticated requests

Text notes create/update correctly

Canvas notes save and reload correctly

Star/unstar works

Trash/restore works

Permanent delete works

Duplicate/copy actions work

Expired authentication redirects to login

Mobile navigation works

Dark mode works

No unexpected errors appear in the browser or backend console

🚀 Deployment

The frontend and backend are designed to be deployed independently.

For production:

Configure production environment variables.

Point the frontend API client to the deployed backend.

Configure backend CORS for the deployed frontend origin.

Configure MongoDB using a production connection string.

Set a strong production JWT secret.

Build and deploy the frontend.

Deploy the backend.

Run the production testing checklist above.

📌 Future Improvements

Possible next steps:

Rich text formatting

Note tagging

Folder/workspace organization

Image and file attachments

Sharing and collaboration

More advanced canvas tools

Offline support

PWA support

Better production observability and rate limiting

👨‍💻 About the Project

Flowy was built as a portfolio-focused full-stack application to demonstrate practical frontend and backend development, authentication, API design, database integration, responsive UI work, autosave behavior, and real-world application architecture.

Built with React, Node.js, Express, MongoDB and LOVE <3
