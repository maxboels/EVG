import process from "process";
import fs from 'fs/promises';
import { asker, MODELS } from './Ask.mjs';

//const MODEL = "claude-3-opus-20240229";
const MODEL = "g";


const SYSTEM = `
You're an AI emulator that sends garden party invitations through an interactive text-based experience. Your goal is to create a fully engaging, text-based version of a garden party invitation.

You'll be provided with:
1. The guest name.
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

<<description>>
You're inside your cosy living room, and you notice an elegant envelope on the coffee table.

<<scene_ui>>
,-------------------------------,
| Coffee Table  Sofa            |
| [✉️📬]        [🛋️]           |
|                               |
| TV            You             |
| [📺]          [😊]            |
'-------------------------------'
A) Open the Envelope
B) Watch TV
C) Sit on the Sofa
D) Leave the Room

<<options>>

# PLAYER:
A

<<description>>
You open the envelope. Inside, you find a beautifully designed invitation card.

<<scene_ui>>
,-----------------------------------------------,
|                                               |
|  Dear [Guest Name],                           |
|                                               |
|  You are cordially invited to a garden party  |
|  at our home located at 131 Kentish Town,     |
|  NW5 2RX, London.                             |
|                                               |
|  When: 30 May 2024, from 2 pm until midnight. |
|  Dress code: London style.                    |
|                                               |
|  To accept the invitation, please enter the   |
|  names of at least 3 out of 4 organizers or   |
|  solve this equation: 3x + 1 = 4.             |
|                                               |
|  Looking forward to seeing you!               |
|                                               |
|  Best regards,                                |
|  [Host Name]                                  |
|                                               |
'-----------------------------------------------'
A) Enter Names
B) Solve Equation
C) Decline the Invitation

<<options>>

# PLAYER:
A

<<description>>
Please enter the names of at least 3 out of 4 organizers.

<<scene_ui>>
,-----------------------------------------------,
|  Organizers:                                  |
|  1. [Host Name]                               |
|  2. [Organizer Name 1]                        |
|  3. [Organizer Name 2]                        |
|  4. [Organizer Name 3]                        |
|-----------------------------------------------|
|  Enter names (comma-separated):               |
|  [                ]                           |
'-----------------------------------------------'

<<options>>

# PLAYER:
[guest enters names]

<<description>>
Thank you! You have successfully entered the names of the organizers.

<<scene_ui>>
,-------------------------------,
| Your excitement meter: ||||||||
|                               |
| You are ready for the party!  |
|                               |
| Coffee Table  Sofa            |
| [✉️📬]        [🛋️]           |
| TV            You             |
| [📺]          [😊]            |
'-------------------------------'
A) Finish

<<options>>

# PLAYER:
B

<<description>>
Please solve the equation: 3x + 1 = 4.

<<scene_ui>>
,-------------------------------,
|  Enter the value of x:        |
|  [   ]                        |
'-------------------------------'

<<options>>

# PLAYER:
1

<<description>>
Congratulations! You have solved the equation correctly and accepted the invitation.

<<scene_ui>>
,-------------------------------,
| Your excitement meter: ||||||||
|                               |
| You are ready for the party!  |
|                               |
| Coffee Table  Sofa            |
| [✉️📬]        [🛋️]           |
| TV            You             |
| [📺]          [😊]            |
'-------------------------------'
A) Finish

<<options>>

# PLAYER:
A

<<description>>
You have successfully accepted the invitation and are excited about the upcoming garden party. See you there!

<<scene_ui>>
,-------------------------------,
|                               |
|  Thank you for playing!       |
|  Enjoy the garden party!      |
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

  const ASCII_ART = `
\x1b[1m\x1b[36m█▀▀▀▀▀█ ▀ ▄▀▄ █▀▀▀▀▀█\x1b[0m  
\x1b[1m\x1b[36m█ ███ █ ▀ ▀█▀ █ ███ █\x1b[0m
\x1b[1m\x1b[36m█ ▀▀▀ █ █ ▄█▄ █ ▀▀▀ █\x1b[0m
\x1b[1m\x1b[36m▀▀▀▀▀▀▀ ▀ ▀▀▀ ▀▀▀▀▀▀▀\x1b[0m
\x1b[2mK  E  N  T  I  S  H - T  O  W  N\x1b[0m  
\x1b[2mG  A  R  D  E  N  P  A  R  T  Y\x1b[0m
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
    {role: "user", content: `# GAME: Invitation to Garden Party`},
    {role: "system", content: `Guest Name: ${guestName}`}
  ];

  while (true) {
    console.clear();

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

    if (response.includes("You have successfully accepted the invitation") || response.includes("Enjoy the garden party!")) {
      break;
    }
  }
})();
