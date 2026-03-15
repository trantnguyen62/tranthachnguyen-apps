# Contributing to DevOps Mastery

## Adding Content

All study content lives in `app.js` inside the `devopsData.topics` array. Each topic object has the following shape:

```js
{
    id: 'mytopic',           // unique, kebab-case
    name: 'My Topic',        // display name
    icon: '🔧',              // emoji icon
    color: '#hexcolor',      // accent color used in UI
    flashcards: [
        { term: 'Term', definition: 'Clear, concise definition.' },
        // ...
    ],
    quiz: [
        {
            question: 'What does X do?',
            options: ['A', 'B', 'C', 'D'],
            correct: 0,      // 0-based index of the correct option
            explanation: 'Brief explanation shown after answering.'
        },
        // ...
    ],
    commands: [
        { cmd: 'mytool --flag', desc: 'What this command does' },
        // ...
    ],
    codebase: [              // optional: code/config examples
        {
            title: 'Example Config',     // display title shown in UI
            filename: 'example.yaml',    // filename shown as label
            language: 'yaml',            // used for syntax highlighting label; common values:
                                         // 'yaml', 'bash', 'dockerfile', 'hcl', 'json',
                                         // 'python', 'javascript', 'go', 'text'
            description: 'One-line description',
            code: `multi-line
code here`
        },
        // ...
    ]
}
```

### Guidelines

- **Flashcards**: Keep definitions under 2 sentences. Aim for 20–100 cards per topic. The `term` should be a noun or short phrase; the `definition` should answer "what is it and why does it matter".
- **Quiz questions**: Each question needs exactly 4 options (`options` array length must be 4) and one correct answer (`correct` is a 0-based index). Always include an `explanation`. Avoid "all of the above" / "none of the above" options.
- **Commands**: Include only commands a practitioner would actually run. Omit obvious flags. The `desc` should describe the effect, not just restate the command name.
- **Code examples**: Prefer real-world, minimal examples over toy snippets. Include comments inside the code block where the intent is not obvious.

## Adding a New Topic

1. Add a new object to the `topics` array in `app.js` following the schema above.
2. The sidebar and navigation are generated dynamically — no HTML changes needed.
3. Test locally by opening `index.html` in a browser.

## Modifying an Existing Topic

Search `app.js` for the topic's `id` string (e.g., `id: 'docker'`) to find its data block.

## Build Before Deploying

```bash
npm install
npx terser app.js -o app.min.js
npx cleancss -o styles.min.css styles.css
```

The production `index.html` references the `.min.*` files — always regenerate them before deploying.
