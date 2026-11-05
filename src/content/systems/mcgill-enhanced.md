---
title: McGillEnhanced
designation: Open source
summary: A browser extension for McGill course registration. I'm a contributor.
role: Contributor
period: "2025"
status: in service
stack: [JavaScript, WebExtensions]
repo: https://github.com/lpuv/McGillEnhanced
order: 30
featured: true
---

## What it is

McGillEnhanced is a community extension that fixes the parts of McGill's course registration and timetable that students have to fight every semester. I contribute to it. I didn't start it.

## What I fixed

The extension had gone a while without an update, and by the time I got to it the site had moved underneath it: links and buttons that used to work were dead. I updated the code that hooked into the page so the existing features worked again.

The bigger one was the course catalogue. The extension injects extra course information into the catalogue pages, and that had stopped working on the newer versions of the site. I ported the injection to the current pages so the extra info shows up again.

## Why it's different from a side project

The codebase has real users. A bug in a side project is a bug. A bug here breaks someone's registration at 8am on the day it opens. That changes the job: you read the surrounding code, you match conventions you didn't choose, and you take the boring fix if it's reviewable. It also means the site can change without warning, and you find out because someone's button stopped working.
