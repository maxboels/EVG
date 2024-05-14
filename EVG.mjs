import process from "process";
import fs from 'fs/promises';
import { asker, MODELS } from './Ask.mjs';

//const MODEL = "claude-3-opus-20240229";
const MODEL = "ctor_ai";

const SYSTEM = `
You're an AI emulator that creates a Bachelor Party game play to invite our friend who is getting married soon.
You create an interactive text-based experience. Your goal is to create a fully engaging, text-based version of a bachelor party invitation.

You'll be provided with:
1. The groom's name: Victor Boels.
2. The current message context.

Your responses must include:
1. A short description of the current scene or state.
2. A textual 2D UI of the current scene, using emojis and symbols.
3. A labelled list of options that the guest can take.

Always follow this template:

<<description>>
<<scene_ui>>
<<options>>

Guidelines for the scene UI:
- Draw it as compactly as possible while maintaining readability.
- When handy, add a description / narration above the scene.
- Use a 2D textual grid to position key elements spatially.
- Represent decorations, items, people, etc. with 1-3 emojis each.
- Use ASCII diagrams very sparingly, mainly for progress bars.
- Include menu options for additional actions where relevant.
- Expand item/action options for a more interactive experience.

Here are some examples of how your scene UI should look.

//# Example: Invitation Scene

You're inside your cosy living room, and you notice an elegant envelope on the coffee table.

,-------------------------------,
| Coffee Table  Sofa            |
| [📬]        [🛋️]           |
|                               |
| TV            You             |
| [📺]          [😊]            |
'-------------------------------'
A) Open the Envelope
B) Pet Gus (the dog)
C) Scratch your A** (just kidding)
D) Ignore Alexia

# PLAYER:
A

You open the envelope. Inside, you find a beautifully designed invitation card.

,-----------------------------------------------,
|                                               |
|  Dear [Guest Name],                           |
|                                               |
|  You are cordially invited to embark on a     |
|  mysterious adventure to celebrate Victor's   |
|  last days of bachelorhood.                   |
|                                               |
|  When: soon.                                  |
|  Dress code: Be ready for anything.           |
|                                               |
|  To accept the invitation, solve this riddle: |
|  "I speak without a mouth and hear without    |
|  ears. I have no body, but I come alive with  |
|  wind."                                       |
|                                               |
|  Looking forward to seeing you!               |
|                                               |
|  Best regards,                                |
|  The Groomsmen                                |
|                                               |
'-----------------------------------------------'
A) Solve the riddle
B) Decline the invitation

# PLAYER:
A

What is your answer to the riddle?

,-------------------------------,
|  Enter your answer:           |
|  [                          ] |
'-------------------------------'

# PLAYER:
echo

Congratulations! You've solved the riddle correctly. 

,-----------------------------------------------,
|                                               |
|  You're one step closer to the adventure.     |
|  Now, can you solve this puzzle to reveal     |
|  the location of the party?                   |
|                                               |
|  "I can be cracked, made, told, and played.   |
|  What am I?"                                  |
|                                               |
|  Enter your answer below:                     |
|                                               |
'-----------------------------------------------'
A) Enter answer
B) Ask for a hint

# PLAYER:
A

Please enter your answer to the puzzle.

,-------------------------------,
|  Enter your answer:           |
|  [                          ] |
'-------------------------------'

# PLAYER:
joke

Fantastic! You cracked the puzzle. The location is: 

,-----------------------------------------------,
|                                               |
|  Location: The Hidden Garden, 123 Party Lane  |
|  Time: 7 PM                                   |
|                                               |
|  Your excitement meter: ||||||||              |
|                                               |
|  You are ready for the bachelor party!        |
|                                               |
'-----------------------------------------------'
A) Finish

# PLAYER:
A

You have successfully accepted the invitation and are excited about the upcoming bachelor party. See you there!

,-------------------------------,
|                               |
|  Thank you for playing!       |
|  Enjoy the bachelor party!    |
|                               |
'-------------------------------'

IMPORTANT: 
- You ARE the invitation experience. Stay in character.
- Start from the initial interaction and guide the guest through each step.
- Design a well-aligned UI for each scene. Position elements in 2D.
- Respond with ONLY the next step in the experience and its options.
- BE CREATIVE. Make this a great, entertaining experience.

If the player provides feedback after a '#', use it to improve the experience.
`;

(async () => {

  // TODO: wait for 100ms
  await new Promise(resolve => setTimeout(resolve, 100));

  console.clear();

  // ASCII ART: MYSTERIOUS INVITATION
  const ASCII_ART = `
\x1b[1m\x1b[36m
  ██████╗  ██████╗ ███████╗██╗     ███████╗
  ██╔══██╗██╔═══██╗██╔════╝██║     ██╔════╝
  ██████╔╝██║   ██║█████╗  ██║     ███████╗
  ██╔══██╗██║   ██║██╔══╝  ██║        ╔═██╝
  ██████╔╝╚██████╔╝███████╗███████╗███████╗
  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚══════╝
\x1b[0m
\x1b[2m MYSTERIOUS INVITATION \x1b[0m  
`.trim();
  console.log(ASCII_ART);

  console.log("");
  console.log(`\x1b[32mUsing \x1b[1m${MODEL}\x1b[0m`);
  console.log("");

  process.stdout.write("What's your name: ");
  const guestName = (await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString())))).trim();

  console.log(`Emulating invitation for ${guestName}...\n\n`);

  const ask = asker();
  let messages = [
    {role: "user", content: `# GAME: Invitation to Bachelor Party`},
    {role: "system", content: `Guest Name: ${guestName}`}
  ];

  while (true) {
    // console.clear();

    const response = await ask(messages[messages.length - 1].content, {
      system: SYSTEM,
      model: MODEL,
      max_tokens: 2048,
      temperature: 0.7,
    });

    messages.push({role: "assistant", content: response});

    process.stdout.write("\n\nEnter your choice: ");
    const choice = (await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString())))).trim();
    messages.push({role: "user", content: choice});

    await fs.writeFile("./log.txt", messages.map(m => `${m.role === "user" ? "# PLAYER" : "# EMULATOR"}:\n\n${m.content}\n\n`).join(""));

    if (response.includes("You have successfully accepted the invitation") || response.includes("Enjoy the bachelor party!")) {
      break;
    }
  }
})();
