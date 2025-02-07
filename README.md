# Legend of the Wispguard: Build a Zelda-Like Game in Phaser 3 Course Code

This repo is the official code repository for the <a href="TODO" target="_blank">Legend of the Wispguard: Build a Zelda-Like Game in Phaser 3 Course</a> that is available on YouTube.

## Demo

TODO

## How To Play

Currently, the only supported way to play the game is with a Keyboard.

### Controls

| Keys                                   | Description                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Arrow Keys (Up, Down, Left, and Right) | Moves the player.                                                                                     |
| Space                                  | TODO                                     |
| Shift                                  | TODO |


## Local Development

### Requirements

<a href="https://nodejs.org" target="_blank">Node.js</a> and <a href="https://pnpm.io/" target="_blank">pnpm</a> are required to install dependencies and run scripts via `pnpm`.

**Note:** You can also use `npm` to install the required project dependencies. To do this, replace the commands listed below with the relevant `npm` command, such as `npm install` or `npm run start`.

<a href="https://vitejs.dev/" target="_blank">Vite</a> is required to bundle and serve the web application. This is included as part of the projects dev dependencies.

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm install --frozen-lockfile` | Install project dependencies |
| `pnpm start` | Build project and open web server running project |
| `pnpm build` | Builds code bundle for production |
| `pnpm lint` | Uses ESLint to lint code |

### Writing Code

After cloning the repo, run `pnpm install --frozen-lockfile` from your project directory. Then, you can start the local development
server by running `pnpm start`.

After starting the development server with `pnpm start`, you can edit any files in the `src` folder
and parcel will automatically recompile and reload your server (available at `http://localhost:8080`
by default).

### Deploying Code

After you run the `pnpm build` command, your code will be built into a single bundle located at
`dist/*` along with any other assets you project depended.

If you put the contents of the `dist` folder in a publicly-accessible location (say something like `http://myserver.com`),
you should be able to open `http://myserver.com/index.html` and play your game.

### Static Assets

Any static assets like images or audio files should be placed in the `public` folder. It'll then be served at `http://localhost:8080/path-to-file-your-file/file-name.file-type`.

## Credits

This project would have not been possible without the use of some awesome assets created by some amazing artists! This project would not have been possible without the following people/resources:

| Asset                       | Author           | Link                                                                                              |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| Fonts                       | Kenney           | [Kenney Fonts](https://www.kenney.nl/assets/kenney-fonts)                                         |

## Issues

TODO

For any issues you encounter, please open a new [GitHub Issue](https://github.com/devshareacademy/monster-tamer/issues) on this project.
