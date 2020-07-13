# taquito-boilerplate

![Built with Taquito][logo]

A minimal framework-agnostic setup for starting developing Tezos DApps quickly with Taquito.

## Dependencies
1. jQuery - for simple manipulation and traversal of HTML documents.
2. parcel-bundler - for packaging web applications quickly.

## Getting Started

1. Clone this repository:

    `git clone <URL>`

2. Change your current working directory to the newly cloned repository directory.
3. Install dependencies:

    `yarn install`

4. Start development server:

    `yarn run watch`

5. Add a .env file in the root folder of the project with content:
`SKIP_PREFLIGHT_CHECK=true`. This is needed since react-script unfortunately
don't like the eslint version we are using.

6. Open http://localhost:3000 in your browser to see a sample application.
