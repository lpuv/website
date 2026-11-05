---
title: grimoire
designation: Tooling
summary: A Discord bot that runs Blood on the Clocktower, because the old bot wasn't enough.
role: Solo
period: "2026 — present"
status: ongoing
stack: [Python, pycord, Discord]
order: 18
featured: true
---

## What it is

Grimoire runs Blood on the Clocktower text games in Discord. It replaces the old Bureaucrat bot. The name is the Storyteller's book: every character, player, and secret in a game.

The bot handles seating, game channels, threads, whispers, kibitz channels, a ledger, and `/end`. The stack is Python and pycord, with a database and migrations, tests for the whisper gate and channel helpers, and a CI/deploy pipeline to a VPS.

The repository is private.

## What's hard

The game is a pile of exceptions. A role can change another role's information, a dead player can still vote once, a drunk player thinks they have a different role, and the Storyteller can override the bot.

The hard part is the information model. A whisper has a gate (who can whisper to whom), a pair-based neighbor quota, and a ledger entry. Get the gate wrong and the wrong player sees the wrong thing. That ruins the game.

## What I'd change

I'd write the whisper gate tests before the whisper command. The gate is the part that gets subtle.
