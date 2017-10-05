# BoilerChat Setup

## Installing Dependencies

First things first, let's make sure you have all the dependencies installed to run BoilerChat.

- Download and setup [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) on your computer.
- Make sure you have an up-to-date [Node and NPM](https://nodejs.org/en/download/current/) installation.
- From the root of the project directory, run `npm install` to download the required NodeJS modules.

## Database Setup

This is the database setup folder. The `Subjects.json` file is what we want to move into a MongoDB database.

- Start up a MongoDB instance on your machine.
- Create a new database named `boilerchat`
- Run `node insert.js` (this script will copy the JSON file into the database)
- Once the script is done running, you should now have a working database for BoilerChat to use.

## Start The Server

Nice! Everything should now be properly set up. Now we just need to start the server.

- Run `npm start`. If it doesn't work, make sure that:
  - `nodemon` is installed globally (run `npm i -g nodemon` if it isn't)
  - You're running it as `sudo` if you get a permission error. Sometimes listening on port 80 is restricted to root permissions only.

Now you can navigate to `http://localhost:80` in your browser, and BoilerChat should be running!
