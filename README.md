GestureLink — Vision-Based Touchless Laptop Control

Transform Your Webcam into a Spatial Touchless Interface

🌐 " Setup " (https://gesture-link-2ub9di1wh-nithishkumar1.vercel.app/)

---

📌 Overview

GestureLink is a vision-based touchless interaction project that explores controlling a computer through hand gestures captured using a webcam.

The project combines a modern web interface with a Python-based desktop application to explore gesture-based mouse control, finger writing, virtual whiteboarding, and presentation navigation.

The web interface is deployed on Vercel, while desktop-level controls require the local Python application.

🎯 Objectives

- 🖐️ Enable touchless interaction using hand gestures.
- 🖱️ Explore gesture-based mouse control.
- ✍️ Support finger-based writing where implemented.
- 📝 Explore virtual whiteboard functionality.
- 🎮 Provide a user-friendly and interactive interface.
- 💻 Integrate web technologies with Python-based desktop functionality.

✨ Features

- 🌐 Web Interface — Access the GestureLink website online.
- 🖐️ Hand Gesture Recognition — Detect supported hand gestures using a webcam.
- 🖱️ Mouse Control — Explore gesture-based pointer movement.
- ✍️ Air Writing — Draw or write using supported finger movements.
- 📝 Virtual Whiteboard — Explore touchless drawing.
- 🎞️ Presentation Control — Navigate slides using supported gestures.
- ⚙️ Settings — Configure available application options.

Note: Feature availability depends on the current implementation. Desktop controls require the local Python application.

🛠️ Technology Stack

- Python — Desktop application
- React.js — Frontend interface
- Vite — Frontend development and build tool
- HTML, CSS, JavaScript — Web technologies
- Git & GitHub — Version control
- Vercel — Web deployment

🗂️ Project Structure

GestureLink/
├── assets/
├── captures/
├── controls/
├── core/
├── features/
├── logs/
├── ui/
├── utils/
├── web/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── config.py
├── main.py
├── requirements.txt
├── settings.json
├── test_system.py
├── run.bat
├── Launch_GestureLink.bat
└── README.md

🚀 Live Demo

🌐 "Click Here to Open GestureLink" (https://gesture-link-2ub9di1wh-nithishkumar1.vercel.app/)

Explore the deployed web interface and its available features.

💻 Installation and Setup

Prerequisites

- Python installed on your computer
- Node.js and npm
- A webcam for gesture-based features

1. Clone the Repository

git clone https://github.com/Nithishkumarcs/GestureLink-.git
cd GestureLink-

2. Install Python Dependencies

pip install -r requirements.txt

3. Run the Desktop Application

python main.py

4. Run the Web Application

cd web
npm install
npm run dev

Open the local URL displayed in your terminal.

🧪 Testing

Run the available test script from the project root:

python test_system.py

🔐 Privacy and Security

- Request permission before accessing the webcam.
- Avoid uploading private camera recordings.
- Never commit API keys, passwords, or other secrets.
- Review permissions before enabling desktop-control features.

⚠️ Limitations

- Gesture recognition depends on lighting and webcam quality.
- The deployed website does not automatically control the computer's operating system.
- System-wide mouse, keyboard, and application controls require a compatible local desktop application.
- Supported functionality depends on the implemented code.

🔮 Future Enhancements

- Improve gesture recognition accuracy.
- Add customizable gesture shortcuts.
- Improve webcam calibration and sensitivity controls.
- Expand accessibility features.
- Add more testing and supported-device documentation.

🤝 Contributing

Suggestions, bug reports, and improvements are welcome. Please open a GitHub issue to discuss proposed changes.

📄 License

Refer to the repository's license file for the applicable terms.

---

GestureLink — A Step Towards Touchless Computer Interaction.
