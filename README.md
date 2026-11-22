# Snowfall Square

A touch-friendly snowy multiplayer hangout with original cartoon snowpeople. Players can choose a snowman or snowwoman, tap to walk, visit the plaza or ice lake, use emotes, and chat.

## Host multiplayer

Install Node.js, run `npm install`, then `npm start`. Host the server on a service that supports persistent WebSocket connections and HTTPS. The server keeps room state and chat in memory only.

## Build the iPad IPA

The `ios` folder contains the SwiftUI iPad client. Run **Build Snowfall Square IPA** from GitHub Actions. Download its unsigned IPA artifact and sign it with KravaSign. On launch, enter the public HTTPS address where this server runs.
