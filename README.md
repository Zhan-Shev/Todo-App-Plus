# Todo App (React + Tailwind)

A fully functional Todo app written in React with localStorage storage to show understanding working on React.

## What the app can do?

- Add tasks
- Mark tasks as completed
- Edit (double-click on the text)
- Delete
- Filters: All / Active / Completed
- Search tasks
- Active task counter
- Clear completed tasks
- Save to localStorage (data is not lost after a reboot)
- Set a date, time, and priority for each task
- Automatically group tasks into Overdue, Today, Upcoming, and Completed
- Preview notes by hovering and keep them open by clicking the task
- Attach and preview images, PDF files, and text documents
- Switch between light and dark themes
- Adapt the interface to smaller screens and touch screens.
- UI double click on a task to edit. Cancel by clicking out of viewed box. 

## Technology

- React 19 (Vite)
- Tailwind CSS
- localStorage
- fuse.js
- React Datepicker
- date-fns
- DOMPurify
- FileReader API
- React Testing Library
- Jest DOM
- jsdom

## How to start

```bash
npm install
npm run dev

# Start test
npm test
npm run test:watch
```

## History of the creating process (Text in the end important to read)

- After starting a react project im gonna add main structure of the todo app so here we have: 
  - TodoForm.jsx (it adds a task), 
  - TodoList.jsx (The card with a task and lists), 
  - TodoItem.jsx (Checks the behavior of a single card.), 
  - FilterButtons.jsx (Has buttons to filter tasks)  
  - SearchBar.jsx (it searches) 
  - and all the css are gonna be in index.css 

- added fuse.js to make searchbar better 

- added a proper checkbox with animations but it leaded to lots of bugs with how the animations is playing while changing the status to completed one so i added function isCompleting to make it play before the task is removed

- added RichTextEditor.jsx to make task text pretty but it had so much of changes and idea was changed so it moved to TaskEditor.jsx and now user can sets date, time, priority, attach files, add notes. Plus it adds a task and edits it at the same time.

- For date and time Datepicker was installed and styled with figma. 

- (Update: It took me 2 hours to figure out why the calendar doesn't close when selecting a date. I thought the problem was in the component itself, but it turned out the problem was in what was wrapping it. So I will never wrap it in a <label> again, only a <div>.)

- For file attachment i made a new file to write a code and let the user review the attachment so i advice to try it with img but it supports others like pdf, txt...

- Notes moduls are staying in app.jsx and i thought it would be nice to add a card hover so the note block moves as the user hovers a card with a task and as the user click on it the note stays and click again it hides under a card task again so it doesnt take much space

- Dark mode was added

- Work on UI

- The test was started to see all the bugs that i have missed like: animations were glitchy, when notes are too long it breaks the container and plus covers content below, to the note section you could add a image from clipboard so i had to fix it to TEXT only and other things.

- Test files were added cuz whenever i tried to add a new animation, box, function, css or soever i was getting bugs and thats prob cuz my index.css is overwhelmed by massive amount of codes but im not fixing it for a small todo app and plus i thinks it is still readable this way but im gonna add more notes to make it simple for others to read. 

# The results 

### Old codes:

- TodoForm.jsx — contains an old form with a text editor and drawing functionality. Currently, only the Add a task button is used.

- RichTextEditor.jsx — a separate full-featured editor, but notes are currently edited directly inside TaskEditor.jsx.

- App.jsx — the addTodo function belongs to the old form. It also contains a commented-out older version of toggleTodo.

- index.css — contains old time-picker styles based on react-datepicker. The current time picker uses TimePicker.jsx.

- index.css — contains styles for the old expandable search: .search-toggle, .search-chevron, and .search-input-container. The app currently uses a regular SearchBar.

- index.css — contains some older styles such as .task-editor > .flex, .task-editor > .bg-white, and .notes-editor-dialog.

- App.css — probably contains default or outdated Vite styles. The application currently imports index.css from main.jsx.

### The old files are not gonna be removed due to reasons:

1. Chances of removing something that make the code work exist

2. It lets the other person see the history of the project and see the way i was thinking doing this or another step and i can read all the downfalls of my code and work better on it next time. 

This todo app was made for mine portfolio
